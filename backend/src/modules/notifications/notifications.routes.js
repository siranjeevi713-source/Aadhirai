const express = require('express');
const { authenticate } = require('../../middleware/auth');
const { getNotifications, markAllRead, markOneRead } = require('./notifications.controller');

const router = express.Router();
router.get('/', authenticate, getNotifications);
router.patch('/mark-all-read', authenticate, markAllRead);
router.patch('/:id/read', authenticate, markOneRead);

module.exports = router;

