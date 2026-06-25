const express = require('express');
const router = express.Router();
const { Notification } = require('../models');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// @route   GET /api/notifications
// @desc    Get all notifications (Admin only)
// @access  Private/Admin
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      order: [['createdAt', 'DESC']],
    });
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications.' });
  }
});

// @route   PUT /api/notifications/read-all
// @desc    Mark all notifications as read (Admin only)
// @access  Private/Admin
router.put('/read-all', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await Notification.update(
      { isRead: true },
      { where: { isRead: false } }
    );
    res.json({ message: 'All notifications marked as read.' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark notifications as read.' });
  }
});

// @route   PUT /api/notifications/:id/read
// @desc    Mark a notification as read (Admin only)
// @access  Private/Admin
router.put('/:id/read', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findByPk(id);

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found.' });
    }

    notification.isRead = true;
    await notification.save();

    res.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read.' });
  }
});

// @route   DELETE /api/notifications/:id
// @desc    Delete a notification (Admin only)
// @access  Private/Admin
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findByPk(id);

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found.' });
    }

    await notification.destroy();
    res.json({ message: 'Notification deleted successfully.' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Failed to delete notification.' });
  }
});

module.exports = router;
