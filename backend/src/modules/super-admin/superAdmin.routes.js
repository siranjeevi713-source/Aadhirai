const express = require('express');
const { authenticate, requireRole } = require('../../middleware/auth');
const {
  getDistricts, createDistrict, updateDistrict, toggleDistrict,
  getDepartments, createDepartment, updateDepartment,
  getUsers, createPrivilegedUser, toggleUser, resetPassword,
  getRoutingRules, upsertRoutingRule,
  getAuditLogs, getSuperAdminSummary,
} = require('./superAdmin.controller');

const router = express.Router();
const SA = [authenticate, requireRole('super_admin')];

// Districts
router.get('/districts', ...SA, getDistricts);
router.post('/districts', ...SA, createDistrict);
router.put('/districts/:id', ...SA, updateDistrict);
router.patch('/districts/:id/toggle', ...SA, toggleDistrict);

// Departments
router.get('/departments', ...SA, getDepartments);
router.post('/departments', ...SA, createDepartment);
router.put('/departments/:id', ...SA, updateDepartment);

// Users
router.get('/users', ...SA, getUsers);
router.post('/users/provision', ...SA, createPrivilegedUser);
router.patch('/users/:id/toggle', ...SA, toggleUser);
router.patch('/users/:id/reset-password', ...SA, resetPassword);

// Routing Rules
router.get('/routing-rules', ...SA, getRoutingRules);
router.post('/routing-rules', ...SA, upsertRoutingRule);

// Analytics
router.get('/summary', ...SA, getSuperAdminSummary);
router.get('/audit-logs', ...SA, getAuditLogs);

module.exports = router;

