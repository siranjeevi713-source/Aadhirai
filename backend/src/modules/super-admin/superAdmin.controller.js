const { User, District, Department, RoutingRule, AuditLog, Complaint } = require('../../models');
const { createAuditLog } = require('../../utils/helpers');
const bcrypt = require('bcryptjs');

// ─── Districts ─────────────────────────────────────────────────────────────────
async function getDistricts(req, res) {
  const districts = await District.find().sort({ name: 1 });
  res.json({ success: true, data: districts });
}

async function createDistrict(req, res) {
  try {
    const { name, nameTa, state, lat, lng } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'District name is required.' });

    const existing = await District.findOne({ name: name.trim() });
    if (existing) return res.status(409).json({ success: false, message: 'District already exists.' });

    const district = await District.create({
      name: name.trim(),
      nameTa: nameTa || '',
      state: state || 'Tamil Nadu',
      center: { type: 'Point', coordinates: [parseFloat(lng) || 0, parseFloat(lat) || 0] },
    });

    await createAuditLog({ userId: req.user._id, action: 'CREATE_DISTRICT', entityType: 'District', entityId: district._id, details: { name }, ipAddress: req.ip });
    res.status(201).json({ success: true, message: 'District created.', data: district });
  } catch (err) {
    console.error('[Admin:createDistrict]', err);
    res.status(500).json({ success: false, message: err.message });
  }
}

async function updateDistrict(req, res) {
  const district = await District.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!district) return res.status(404).json({ success: false, message: 'District not found.' });
  res.json({ success: true, data: district });
}

async function toggleDistrict(req, res) {
  const district = await District.findById(req.params.id);
  if (!district) return res.status(404).json({ success: false, message: 'District not found.' });
  district.isActive = !district.isActive;
  await district.save();
  res.json({ success: true, message: `District ${district.isActive ? 'activated' : 'deactivated'}.`, data: district });
}

// ─── Departments ───────────────────────────────────────────────────────────────
async function getDepartments(req, res) {
  const filter = {};
  if (req.query.districtId) filter.districtId = req.query.districtId;
  const depts = await Department.find(filter).populate('districtId', 'name').sort({ name: 1 });
  res.json({ success: true, data: depts });
}

async function createDepartment(req, res) {
  try {
    const { name, code, districtId, description, contactEmail, contactPhone } = req.body;
    if (!name || !code || !districtId) {
      return res.status(400).json({ success: false, message: 'Name, code, and districtId are required.' });
    }

    const district = await District.findById(districtId);
    if (!district) return res.status(404).json({ success: false, message: 'District not found.' });

    const dept = await Department.create({ name, code: code.toUpperCase(), districtId, description, contactEmail, contactPhone });
    await createAuditLog({ userId: req.user._id, action: 'CREATE_DEPARTMENT', entityType: 'Department', entityId: dept._id, details: { name, districtId }, ipAddress: req.ip });
    res.status(201).json({ success: true, message: 'Department created.', data: dept });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ success: false, message: 'Department code already exists.' });
    res.status(500).json({ success: false, message: err.message });
  }
}

async function updateDepartment(req, res) {
  const dept = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('districtId', 'name');
  if (!dept) return res.status(404).json({ success: false, message: 'Department not found.' });
  res.json({ success: true, data: dept });
}

// ─── Users (Admin / Reviewer Provisioning) ─────────────────────────────────────
async function getUsers(req, res) {
  const { role, districtId, page = 1, limit = 20, search } = req.query;
  const filter = {};
  if (role) filter.role = role;
  if (districtId) filter.assignedDistrictId = districtId;
  if (search) filter.$or = [{ name: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }];

  const users = await User.find(filter)
    .populate('assignedDistrictId', 'name')
    .populate('departmentId', 'name')
    .populate('homeDistrictId', 'name')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await User.countDocuments(filter);
  res.json({ success: true, data: users, pagination: { total, page: parseInt(page), limit: parseInt(limit) } });
}

async function createPrivilegedUser(req, res) {
  try {
    const { name, email, mobile, password, role, assignedDistrictId, departmentId } = req.body;

    if (!['department_admin', 'reviewer'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Only department_admin or reviewer roles can be provisioned here.' });
    }
    if (!name || !email || !mobile || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, mobile, and password are required.' });
    }
    if (!assignedDistrictId) {
      return res.status(400).json({ success: false, message: 'assignedDistrictId is required.' });
    }
    if (role === 'department_admin' && !departmentId) {
      return res.status(400).json({ success: false, message: 'departmentId is required for Department Admin.' });
    }

    const exists = await User.findOne({ $or: [{ email }, { mobile }] });
    if (exists) return res.status(409).json({ success: false, message: 'Email or mobile already registered.' });

    // Validate department belongs to district
    if (departmentId) {
      const dept = await Department.findById(departmentId);
      if (!dept || dept.districtId.toString() !== assignedDistrictId) {
        return res.status(400).json({ success: false, message: 'Department does not belong to the selected district.' });
      }
    }

    const hash = await bcrypt.hash(password, 12);
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      mobile,
      passwordHash: hash,
      role,
      assignedDistrictId,
      departmentId: departmentId || null,
      isActive: true,
    });

    await createAuditLog({ userId: req.user._id, action: `CREATE_${role.toUpperCase()}`, entityType: 'User', entityId: user._id, details: { email, role, assignedDistrictId }, ipAddress: req.ip });
    res.status(201).json({ success: true, message: `${role === 'department_admin' ? 'Department Admin' : 'Reviewer'} account created.`, data: user });
  } catch (err) {
    console.error('[Admin:createPrivilegedUser]', err);
    res.status(500).json({ success: false, message: err.message });
  }
}

async function toggleUser(req, res) {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
  if (user.role === 'super_admin') return res.status(403).json({ success: false, message: 'Cannot deactivate super admin.' });
  user.isActive = !user.isActive;
  await user.save();
  res.json({ success: true, message: `User ${user.isActive ? 'activated' : 'deactivated'}.`, data: { id: user._id, isActive: user.isActive } });
}

async function resetPassword(req, res) {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 8) return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
  const hash = await bcrypt.hash(newPassword, 12);
  await User.findByIdAndUpdate(req.params.id, { passwordHash: hash });
  await createAuditLog({ userId: req.user._id, action: 'RESET_PASSWORD', entityType: 'User', entityId: req.params.id, ipAddress: req.ip });
  res.json({ success: true, message: 'Password reset successfully.' });
}

// ─── Routing Rules ─────────────────────────────────────────────────────────────
async function getRoutingRules(req, res) {
  const filter = {};
  if (req.query.districtId) filter.districtId = req.query.districtId;
  const rules = await RoutingRule.find(filter).populate('districtId', 'name').populate('departmentId', 'name code');
  res.json({ success: true, data: rules });
}

async function upsertRoutingRule(req, res) {
  try {
    const { districtId, categoryCode, departmentId, priority } = req.body;
    if (!districtId || !categoryCode || !departmentId) {
      return res.status(400).json({ success: false, message: 'districtId, categoryCode, and departmentId are required.' });
    }
    const dept = await Department.findById(departmentId);
    if (!dept || dept.districtId.toString() !== districtId) {
      return res.status(400).json({ success: false, message: 'Department does not belong to selected district.' });
    }
    const rule = await RoutingRule.findOneAndUpdate(
      { districtId, categoryCode: categoryCode.toUpperCase() },
      { $set: { departmentId, priority: priority || 'MEDIUM', isActive: true } },
      { upsert: true, new: true }
    );
    res.json({ success: true, message: 'Routing rule saved.', data: rule });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ─── Audit Logs ───────────────────────────────────────────────────────────────
async function getAuditLogs(req, res) {
  const { page = 1, limit = 50 } = req.query;
  const logs = await AuditLog.find()
    .populate('userId', 'name email role')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));
  const total = await AuditLog.countDocuments();
  res.json({ success: true, data: logs, pagination: { total, page: parseInt(page), limit: parseInt(limit) } });
}

// ─── Analytics Summary ──────────────────────────────────────────────────────────
async function getSuperAdminSummary(req, res) {
  const [totalComplaints, totalUsers, totalDistricts, totalDepartments,
    submitted, assigned, inProgress, verified] = await Promise.all([
    Complaint.countDocuments(),
    User.countDocuments({ role: 'citizen' }),
    District.countDocuments({ isActive: true }),
    Department.countDocuments({ isActive: true }),
    Complaint.countDocuments({ status: 'SUBMITTED' }),
    Complaint.countDocuments({ status: 'ASSIGNED' }),
    Complaint.countDocuments({ status: 'IN_PROGRESS' }),
    Complaint.countDocuments({ status: 'VERIFIED' }),
  ]);
  res.json({
    success: true,
    data: { totalComplaints, totalUsers, totalDistricts, totalDepartments, submitted, assigned, inProgress, verified },
  });
}

module.exports = {
  getDistricts, createDistrict, updateDistrict, toggleDistrict,
  getDepartments, createDepartment, updateDepartment,
  getUsers, createPrivilegedUser, toggleUser, resetPassword,
  getRoutingRules, upsertRoutingRule,
  getAuditLogs, getSuperAdminSummary,
};

