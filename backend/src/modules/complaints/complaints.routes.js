const express = require('express');
const { authenticate, requireRole } = require('../../middleware/auth');
const { upload, handleMulterError } = require('../../middleware/upload');
const {
  analyzeImage, submitComplaint, getMyComplaints,
  getComplaintById, getDepartmentComplaints,
  updateComplaintStatus, uploadEvidence, publicTrack,
} = require('./complaints.controller');

const router = express.Router();

// Public
router.get('/public/:ticketNumber', publicTrack);

// Citizen
router.post('/analyze-image', authenticate, requireRole('citizen'), upload.single('image'), handleMulterError, analyzeImage);
router.post('/', authenticate, requireRole('citizen'), submitComplaint);
router.get('/my', authenticate, requireRole('citizen'), getMyComplaints);

// Shared (citizen + admin + reviewer)
router.get('/:id', authenticate, getComplaintById);

// Department Admin
router.get('/', authenticate, requireRole('department_admin', 'super_admin', 'reviewer'), getDepartmentComplaints);
router.patch('/:id/status', authenticate, requireRole('department_admin', 'super_admin'), updateComplaintStatus);
router.post('/:id/evidence', authenticate, requireRole('department_admin', 'super_admin'), upload.single('file'), handleMulterError, uploadEvidence);

module.exports = router;

