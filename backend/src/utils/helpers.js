const { AuditLog, Notification } = require('../models');

async function createAuditLog({ userId, action, entityType, entityId, details, ipAddress }) {
  try {
    await AuditLog.create({ userId, action, entityType, entityId, details, ipAddress });
  } catch (e) {
    console.error('[AuditLog] Failed to write:', e.message);
  }
}

async function createNotification({ userId, title, message, type = 'STATUS_UPDATE', complaintId = null }) {
  try {
    await Notification.create({ userId, title, message, type, complaintId });
  } catch (e) {
    console.error('[Notification] Failed to create:', e.message);
  }
}

module.exports = { createAuditLog, createNotification };

