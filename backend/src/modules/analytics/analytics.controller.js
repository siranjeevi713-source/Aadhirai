const { Complaint, District } = require('../../models');

async function getDepartmentAdminSummary(req, res) {
  const deptId = req.user.departmentId;
  const filter = { departmentId: deptId };
  const [total, submitted, routed, assigned, inProgress, pendingReview, verified] = await Promise.all([
    Complaint.countDocuments(filter),
    Complaint.countDocuments({ ...filter, status: 'SUBMITTED' }),
    Complaint.countDocuments({ ...filter, status: 'ROUTED' }),
    Complaint.countDocuments({ ...filter, status: 'ASSIGNED' }),
    Complaint.countDocuments({ ...filter, status: 'IN_PROGRESS' }),
    Complaint.countDocuments({ ...filter, status: 'RESOLVED_PENDING_REVIEW' }),
    Complaint.countDocuments({ ...filter, status: 'VERIFIED' }),
  ]);
  res.json({ success: true, data: { total, submitted, routed, assigned, inProgress, pendingReview, verified } });
}

async function getReviewerSummary(req, res) {
  const districtId = req.user.assignedDistrictId;
  const filter = districtId ? { incidentDistrictId: districtId } : {};
  const [pending, approved, rejected] = await Promise.all([
    Complaint.countDocuments({ ...filter, status: 'RESOLVED_PENDING_REVIEW' }),
    Complaint.countDocuments({ ...filter, status: 'VERIFIED' }),
    Complaint.countDocuments({ ...filter, status: 'REJECTED' }),
  ]);
  res.json({ success: true, data: { pending, approved, rejected } });
}

async function getCitizenSummary(req, res) {
  const filter = { citizenId: req.user._id };
  const [total, active, verified] = await Promise.all([
    Complaint.countDocuments(filter),
    Complaint.countDocuments({ ...filter, status: { $in: ['SUBMITTED', 'ROUTED', 'ASSIGNED', 'IN_PROGRESS'] } }),
    Complaint.countDocuments({ ...filter, status: 'VERIFIED' }),
  ]);
  res.json({ success: true, data: { total, active, verified } });
}

async function getPublicMap(req, res) {
  const complaints = await Complaint.find({ status: { $in: ['ROUTED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED_PENDING_REVIEW', 'VERIFIED'] } })
    .select('ticketNumber citizenConfirmedCategory incidentLocation status severity createdAt incidentDistrictId')
    .populate('incidentDistrictId', 'name')
    .limit(500);
  res.json({ success: true, data: complaints });
}

module.exports = { getDepartmentAdminSummary, getReviewerSummary, getCitizenSummary, getPublicMap };

