const { User } = require('../../models');
const { signToken } = require('../../middleware/auth');
const { createAuditLog } = require('../../utils/helpers');
const bcrypt = require('bcryptjs');

// POST /api/auth/register (citizen only)
async function register(req, res) {
  try {
    const name = req.body.name || req.body.fullName;
    const email = req.body.email;
    const mobile = req.body.mobile || req.body.mobileNumber;
    const password = req.body.password;
    const homeDistrictId = req.body.homeDistrictId;
    const consent = req.body.consent !== undefined ? req.body.consent : true;

    if (!name || !email || !mobile || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, mobile, and password are required.' });
    }
    if (!consent) {
      return res.status(400).json({ success: false, message: 'Consent is required.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
    }
    if (!/^\d{10}$/.test(mobile)) {
      return res.status(400).json({ success: false, message: 'Mobile number must be exactly 10 digits.' });
    }

    const existing = await User.findOne({ $or: [{ email: email.toLowerCase().trim() }, { mobile }] });
    if (existing) {
      const field = existing.email === email.toLowerCase().trim() ? 'Email' : 'Mobile number';
      return res.status(409).json({ success: false, message: `${field} is already registered.` });
    }

    const hash = await bcrypt.hash(password, 12);
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      mobile,
      passwordHash: hash,
      role: 'citizen',  // PUBLIC registration ALWAYS creates citizen
      homeDistrictId: homeDistrictId || null,
    });

    const token = signToken(user._id, user.role);
    await createAuditLog({ userId: user._id, action: 'REGISTER', entityType: 'User', entityId: user._id, ipAddress: req.ip });

    return res.status(201).json({
      success: true,
      message: 'Registration successful.',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error('[Auth:register]', err);
    return res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
}

// POST /api/auth/login
async function login(req, res) {
  try {
    let { email, mobile, password, identifier } = req.body;

    if (identifier) {
      if (identifier.includes('@')) {
        email = identifier;
      } else {
        mobile = identifier;
      }
    }

    if (!password || (!email && !mobile)) {
      return res.status(400).json({ success: false, message: 'Email or mobile and password are required.' });
    }

    const query = email ? { email: email.toLowerCase().trim() } : { mobile: mobile.trim() };
    const user = await User.findOne(query).populate('homeDistrictId').populate('assignedDistrictId').populate('departmentId');

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid credentials or account deactivated.' });
    }

    const valid = await user.comparePassword(password);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = signToken(user._id, user.role);
    await createAuditLog({ userId: user._id, action: 'LOGIN', entityType: 'User', entityId: user._id, ipAddress: req.ip });

    return res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        homeDistrict: user.homeDistrictId,
        assignedDistrict: user.assignedDistrictId,
        department: user.departmentId,
      },
    });
  } catch (err) {
    console.error('[Auth:login]', err);
    return res.status(500).json({ success: false, message: 'Server error during login.' });
  }
}

// GET /api/auth/me
async function getMe(req, res) {
  return res.json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      mobile: req.user.mobile,
      role: req.user.role,
      homeDistrict: req.user.homeDistrictId,
      assignedDistrict: req.user.assignedDistrictId,
      department: req.user.departmentId,
    },
  });
}

module.exports = { register, login, getMe };

