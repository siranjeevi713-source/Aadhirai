const express = require('express');
const { authenticate, requireRole } = require('../../middleware/auth');
const { getPendingReviews, reviewDecision, getReviewHistory } = require('./reviews.controller');

const router = express.Router();
const R = [authenticate, requireRole('reviewer', 'super_admin')];

router.get('/pending', ...R, getPendingReviews);
router.post('/:complaintId/decide', ...R, reviewDecision);
router.get('/history', ...R, getReviewHistory);

module.exports = router;

