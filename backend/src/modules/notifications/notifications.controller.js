const { Notification } = require('../../models');

async function getNotifications(req, res) {
  const { page = 1, limit = 20 } = req.query;
  const notifications = await Notification.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));
  const unreadCount = await Notification.countDocuments({ userId: req.user._id, isRead: false });
  res.json({ success: true, data: notifications, unreadCount });
}

async function markAllRead(req, res) {
  await Notification.updateMany({ userId: req.user._id, isRead: false }, { isRead: true });
  res.json({ success: true, message: 'All notifications marked as read.' });
}

async function markOneRead(req, res) {
  await Notification.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, { isRead: true });
  res.json({ success: true });
}

module.exports = { getNotifications, markAllRead, markOneRead };

