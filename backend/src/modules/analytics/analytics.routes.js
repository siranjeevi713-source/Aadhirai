const express = require('express');
const { authenticate, requireRole } = require('../../middleware/auth');
const { getDepartmentAdminSummary, getReviewerSummary, getCitizenSummary, getPublicMap } = require('./analytics.controller');

const router = express.Router();

router.get('/public-map', getPublicMap);
router.get('/department-admin', authenticate, requireRole('department_admin'), getDepartmentAdminSummary);
router.get('/reviewer', authenticate, requireRole('reviewer'), getReviewerSummary);
router.get('/citizen', authenticate, requireRole('citizen'), getCitizenSummary);

module.exports = router;

