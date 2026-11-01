const jwt = require('jsonwebtoken');
const { User } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'aadhirai_secret';

// Verify JWT and attach user to req
async function authenticate(req, res, next) {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication token required.' });
    }

    const token = auth.split(' ')[1];
    const payload = jwt.verify(token, JWT_SECRET);

    const user = await User.findById(payload.id).populate('homeDistrictId').populate('assignedDistrictId').populate('departmentId');
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'User not found or account deactivated.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
}

// Role guard factory
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthenticated.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${roles.join(', ')}. Your role: ${req.user.role}.`,
      });
    }
    next();
  };
}

// District scope guard — only allows access if user is assigned to the requested district
function requireDistrictScope(req, res, next) {
  const { districtId } = req.params;
  if (!districtId) return next();

  const user = req.user;
  if (user.role === 'super_admin') return next();

  const userDistrict = user.assignedDistrictId?._id?.toString() || user.assignedDistrictId?.toString();
  if (!userDistrict || userDistrict !== districtId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You are not authorized for this district.',
    });
  }
  next();
}

function signToken(userId, role) {
  return jwt.sign({ id: userId, role }, JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
}

module.exports = { authenticate, requireRole, requireDistrictScope, signToken };

