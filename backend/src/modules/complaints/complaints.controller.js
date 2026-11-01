const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const {
  Complaint, StatusHistory, Evidence, RoutingRule, Department, District,
  User, Category, Notification,
} = require('../../models');
const { createAuditLog, createNotification } = require('../../utils/helpers');

const ML_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8001';

// Generate ticket number: ADH-YYYY-DIST-NNNN
async function generateTicketNumber(districtId) {
  const year = new Date().getFullYear();
  const count = await Complaint.countDocuments();
  const seq = String(count + 1).padStart(4, '0');
  return `ADH-${year}-${String(districtId).slice(-4).toUpperCase()}-${seq}`;
}

// POST /api/complaints/analyze-image
async function analyzeImage(req, res) {
  try {
    const fileObj = req.file || req.files?.image?.[0] || req.files?.file?.[0];
    if (!fileObj) return res.status(400).json({ success: false, message: 'Image file required.' });

    const form = new FormData();
    form.append('file', fs.createReadStream(fileObj.path), {
      filename: fileObj.originalname || 'image.jpg',
      contentType: fileObj.mimetype,
    });

    let mlResult;
    try {
      const { data } = await axios.post(`${ML_URL}/analyze`, form, {
        headers: form.getHeaders(),
        timeout: 30000,
      });
      mlResult = data;
    } catch (mlErr) {
      console.error('[Complaints:analyzeImage] ML service error:', mlErr.message);
      return res.status(503).json({
        success: false,
        message: 'AI analysis service is temporarily unavailable. Please select the category manually.',
        fallback: true,
      });
    }

    return res.json({
      success: true,
      fileUrl: `/uploads/${path.basename(fileObj.path)}`,
      fileName: path.basename(fileObj.path),
      predictedCategory: mlResult.predictedCategory || mlResult.predicted_category,
      predicted_category: mlResult.predictedCategory || mlResult.predicted_category,
      confidence: mlResult.confidence !== undefined ? mlResult.confidence : mlResult.confidence_score,
      confidence_score: mlResult.confidence_score !== undefined ? mlResult.confidence_score : mlResult.confidence,
      quality: mlResult.quality || mlResult.image_quality,
      image_quality: mlResult.image_quality || mlResult.quality,
      explanation: mlResult.explanation || mlResult.issue_description,
      issue_description: mlResult.issue_description || mlResult.explanation,
      suggestedSeverity: mlResult.suggestedSeverity || mlResult.suggested_severity,
      suggested_severity: mlResult.suggested_severity || mlResult.suggestedSeverity,
      isUnclear: mlResult.isUnclear !== undefined ? mlResult.isUnclear : mlResult.is_unclear,
      ai: mlResult,
    });
  } catch (err) {
    console.error('[Complaints:analyzeImage]', err);
    res.status(500).json({ success: false, message: err.message });
  }
}

// POST /api/complaints — submit a new complaint
async function submitComplaint(req, res) {
  try {
    const lat = req.body.lat !== undefined ? req.body.lat : req.body.latitude;
    const lng = req.body.lng !== undefined ? req.body.lng : req.body.longitude;
    const incidentAddress = req.body.incidentAddress || req.body.addressText;
    const {
      citizenConfirmedCategory,
      aiPredictedCategory, aiConfidence, aiExplanation, aiModelVersion,
      title, description, severity,
      beforeImageUrl, beforeImageName,
    } = req.body;

    if (!lat || !lng || !citizenConfirmedCategory || !title) {
      return res.status(400).json({ success: false, message: 'lat, lng, citizenConfirmedCategory, and title are required.' });
    }

    // Resolve incident district from coordinates using DB
    const incidentLat = parseFloat(lat);
    const incidentLng = parseFloat(lng);

    const nearestDistrict = await District.findOne({
      center: {
        $near: {
          $geometry: { type: 'Point', coordinates: [incidentLng, incidentLat] },
          $maxDistance: 200000, // 200km radius
        },
      },
      isActive: true,
    });

    const incidentDistrictId = nearestDistrict?._id || null;

    // Find routing rule
    let departmentId = null;
    let assignedAdminId = null;
    const categoryCode = citizenConfirmedCategory.toUpperCase().replace(/ /g, '_').replace(/[/]/g, '_').trim();

    if (incidentDistrictId) {
      const rule = await RoutingRule.findOne({
        districtId: incidentDistrictId,
        categoryCode,
        isActive: true,
      });

      if (rule) {
        departmentId = rule.departmentId;
        // Find department admin for this department
        const admin = await User.findOne({ role: 'department_admin', departmentId, isActive: true });
        assignedAdminId = admin?._id || null;
      }
    }

    // Determine SLA due date
    const cat = await Category.findOne({ code: categoryCode });
    const slaHours = cat?.slaHours || 48;
    const dueAt = new Date(Date.now() + slaHours * 60 * 60 * 1000);

    const citizen = req.user;
    const ticketNumber = await generateTicketNumber(incidentDistrictId || 'XXXX');

    const status = departmentId ? 'ROUTED' : (incidentDistrictId ? 'ROUTING_REVIEW_REQUIRED' : 'LOCATION_REVIEW_REQUIRED');

    const complaint = await Complaint.create({
      ticketNumber,
      citizenId: citizen._id,
      incidentLocation: { type: 'Point', coordinates: [incidentLng, incidentLat] },
      incidentAddress: incidentAddress || '',
      incidentDistrictId,
      registeredDistrictId: citizen.homeDistrictId || null,
      aiPredictedCategory: aiPredictedCategory || null,
      aiConfidence: parseFloat(aiConfidence) || 0,
      aiExplanation: aiExplanation || '',
      aiModelVersion: aiModelVersion || '',
      citizenConfirmedCategory,
      categoryCode,
      departmentId,
      assignedAdminId,
      title: title.trim(),
      description: description || '',
      severity: severity || cat?.defaultSeverity || 'MEDIUM',
      beforeImageUrl: beforeImageUrl || null,
      status,
      dueAt,
    });

    // Log status history
    await StatusHistory.create({
      complaintId: complaint._id,
      previousStatus: null,
      newStatus: status,
      changedById: citizen._id,
      reason: 'Complaint submitted by citizen',
    });

    // Notify admin if routed
    if (assignedAdminId) {
      await createNotification({
        userId: assignedAdminId,
        title: 'New Complaint Assigned',
        message: `Complaint ${ticketNumber} has been routed to your department.`,
        type: 'ASSIGNMENT',
        complaintId: complaint._id,
      });
    }

    await createAuditLog({
      userId: citizen._id, action: 'SUBMIT_COMPLAINT', entityType: 'Complaint',
      entityId: complaint._id, details: { ticketNumber, status }, ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully.',
      data: {
        id: complaint._id,
        _id: complaint._id,
        ticketNumber: complaint.ticketNumber,
        status: complaint.status,
        incidentDistrict: nearestDistrict?.name || null,
        incidentDistrictId: complaint.incidentDistrictId,
        departmentId: complaint.departmentId,
        departmentRouted: !!departmentId,
        complaint,
      },
      complaint,
    });
  } catch (err) {
    console.error('[Complaints:submit]', err);
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/complaints/my — citizen's own complaints
async function getMyComplaints(req, res) {
  const { page = 1, limit = 10, status } = req.query;
  const filter = { citizenId: req.user._id };
  if (status) filter.status = status;

  const complaints = await Complaint.find(filter)
    .populate('incidentDistrictId', 'name')
    .populate('departmentId', 'name')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Complaint.countDocuments(filter);
  res.json({ success: true, data: complaints, pagination: { total, page: parseInt(page), limit: parseInt(limit) } });
}

// GET /api/complaints/:id — complaint detail
async function getComplaintById(req, res) {
  const complaint = await Complaint.findById(req.params.id)
    .populate('citizenId', 'name email mobile')
    .populate('incidentDistrictId', 'name')
    .populate('departmentId', 'name contactEmail')
    .populate('assignedAdminId', 'name email');

  if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });

  // Citizens can only view their own complaints
  if (req.user.role === 'citizen' && complaint.citizenId._id.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Access denied.' });
  }

  const history = await StatusHistory.find({ complaintId: complaint._id }).populate('changedById', 'name role').sort({ createdAt: 1 });
  res.json({ success: true, data: { ...complaint.toObject(), statusHistory: history } });
}

// GET /api/complaints — department admin view
async function getDepartmentComplaints(req, res) {
  const { page = 1, limit = 20, status } = req.query;
  const user = req.user;

  const filter = {};
  if (user.role === 'department_admin') {
    filter.departmentId = user.departmentId?._id || user.departmentId;
  }
  if (status) filter.status = status;

  const complaints = await Complaint.find(filter)
    .populate('citizenId', 'name mobile')
    .populate('incidentDistrictId', 'name')
    .populate('departmentId', 'name')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Complaint.countDocuments(filter);
  res.json({ success: true, data: complaints, pagination: { total, page: parseInt(page), limit: parseInt(limit) } });
}

// PATCH /api/complaints/:id/status — update status
async function updateComplaintStatus(req, res) {
  try {
    const { status, reason } = req.body;
    const user = req.user;
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });

    // Department admin scope check
    if (user.role === 'department_admin') {
      const userDeptId = user.departmentId?._id?.toString() || user.departmentId?.toString();
      const compDeptId = complaint.departmentId?._id?.toString() || complaint.departmentId?.toString();
      if (compDeptId !== userDeptId) {
        return res.status(403).json({ success: false, message: 'Not authorized for this complaint.' });
      }
    }

    const previousStatus = complaint.status;
    complaint.status = status;
    if (status === 'RESOLVED_PENDING_REVIEW') complaint.resolvedAt = new Date();
    await complaint.save();

    await StatusHistory.create({
      complaintId: complaint._id, previousStatus, newStatus: status,
      changedById: user._id, reason: reason || '',
    });

    // Notify citizen
    await createNotification({
      userId: complaint.citizenId,
      title: 'Complaint Status Updated',
      message: `Your complaint ${complaint.ticketNumber} status changed to ${status}.`,
      type: 'STATUS_UPDATE',
      complaintId: complaint._id,
    });

    res.json({ success: true, message: 'Status updated.', data: { id: complaint._id, status: complaint.status } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// POST /api/complaints/:id/evidence — upload resolution evidence
async function uploadEvidence(req, res) {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Evidence file required.' });
    const { phase } = req.body;

    const evidence = await Evidence.create({
      complaintId: req.params.id,
      uploadedById: req.user._id,
      phase: phase || 'RESOLUTION',
      fileUrl: `/uploads/${path.basename(req.file.path)}`,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      fileSizeBytes: req.file.size,
    });

    // Update afterImageUrl on complaint
    if (phase === 'RESOLUTION' || !phase) {
      await Complaint.findByIdAndUpdate(req.params.id, { afterImageUrl: evidence.fileUrl });
    }

    res.status(201).json({ success: true, message: 'Evidence uploaded.', data: evidence });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/complaints/public/:ticketNumber — public tracking
async function publicTrack(req, res) {
  const complaint = await Complaint.findOne({ ticketNumber: req.params.ticketNumber })
    .populate('incidentDistrictId', 'name')
    .populate('departmentId', 'name')
    .select('ticketNumber status citizenConfirmedCategory incidentDistrictId departmentId createdAt dueAt severity');

  if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });
  res.json({ success: true, data: complaint });
}

module.exports = {
  analyzeImage, submitComplaint, getMyComplaints,
  getComplaintById, getDepartmentComplaints,
  updateComplaintStatus, uploadEvidence, publicTrack,
};

