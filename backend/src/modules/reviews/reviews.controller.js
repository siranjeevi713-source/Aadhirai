const { Complaint, Review, StatusHistory, Notification } = require('../../models');
const { createAuditLog, createNotification } = require('../../utils/helpers');

// GET /api/reviews/pending
async function getPendingReviews(req, res) {
  const user = req.user;
  const filter = { status: 'RESOLVED_PENDING_REVIEW' };

  // Reviewer scoped to assigned district
  if (user.role === 'reviewer' && user.assignedDistrictId) {
    filter.incidentDistrictId = user.assignedDistrictId;
  }

  const complaints = await Complaint.find(filter)
    .populate('citizenId', 'name mobile')
    .populate('incidentDistrictId', 'name')
    .populate('departmentId', 'name')
    .sort({ createdAt: -1 });

  res.json({ success: true, data: complaints });
}

// POST /api/reviews/:complaintId/decide
async function reviewDecision(req, res) {
  try {
    const { decision, notes } = req.body;
    if (!['APPROVED', 'REJECTED', 'MORE_EVIDENCE_REQUIRED'].includes(decision)) {
      return res.status(400).json({ success: false, message: 'Invalid decision.' });
    }

    const complaint = await Complaint.findById(req.params.complaintId);
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });
    if (complaint.status !== 'RESOLVED_PENDING_REVIEW') {
      return res.status(400).json({ success: false, message: 'Complaint is not pending review.' });
    }

    // Scope check
    if (req.user.role === 'reviewer' && req.user.assignedDistrictId) {
      if (complaint.incidentDistrictId?.toString() !== req.user.assignedDistrictId?.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized to review this district.' });
      }
    }

    const newStatus = decision === 'APPROVED' ? 'VERIFIED' :
                      decision === 'REJECTED' ? 'REJECTED' : 'MORE_EVIDENCE_REQUIRED';

    const previousStatus = complaint.status;
    complaint.status = newStatus;
    if (newStatus === 'VERIFIED') complaint.verifiedAt = new Date();
    await complaint.save();

    await StatusHistory.create({
      complaintId: complaint._id,
      previousStatus,
      newStatus,
      changedById: req.user._id,
      reason: notes || `Reviewer decision: ${decision}`,
    });

    await Review.findOneAndUpdate(
      { complaintId: complaint._id },
      { reviewerId: req.user._id, decision, notes: notes || '', reviewedAt: new Date() },
      { upsert: true, new: true }
    );

    await createNotification({
      userId: complaint.citizenId,
      title: `Complaint ${decision === 'APPROVED' ? 'Verified' : decision === 'REJECTED' ? 'Rejected' : 'Needs More Evidence'}`,
      message: `Your complaint ${complaint.ticketNumber} has been ${decision.toLowerCase()} by the district reviewer.`,
      type: 'REVIEW',
      complaintId: complaint._id,
    });

    await createAuditLog({ userId: req.user._id, action: `REVIEW_${decision}`, entityType: 'Complaint', entityId: complaint._id, details: { decision, notes }, ipAddress: req.ip });

    res.json({ success: true, message: `Complaint ${decision.toLowerCase()}.`, data: { id: complaint._id, status: newStatus } });
  } catch (err) {
    console.error('[Review:decide]', err);
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/reviews/history
async function getReviewHistory(req, res) {
  const filter = {};
  if (req.user.role === 'reviewer') filter.reviewerId = req.user._id;

  const reviews = await Review.find(filter)
    .populate('complaintId', 'ticketNumber citizenConfirmedCategory status')
    .sort({ reviewedAt: -1 });

  res.json({ success: true, data: reviews });
}

module.exports = { getPendingReviews, reviewDecision, getReviewHistory };

