const express = require('express');
const { Op } = require('sequelize');
const Notification = require('../models/Notification');
const { authenticateToken } = require('../middleware/auth');
const { validatePagination, validateId } = require('../middleware/validation');

const router = express.Router();

// Get all notifications for the current user with pagination
router.get('/', authenticateToken, validatePagination, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sort = 'createdAt',
      order = 'desc'
    } = req.query;

    // Build where clause - only show notifications for the current user
    const whereClause = {
      userId: req.user.id
    };

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const orderClause = [[sort, order.toUpperCase()]];

    const { count, rows: notifications } = await Notification.findAndCountAll({
      where: whereClause,
      order: orderClause,
      limit: parseInt(limit),
      offset: offset
    });

    res.json({
      notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      error: 'Failed to get notifications',
      message: error.message
    });
  }
});

// Get unread notification count for the current user
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const count = await Notification.count({
      where: {
        userId: req.user.id,
        isRead: false
      }
    });

    res.json({ count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      error: 'Failed to get unread count',
      message: error.message
    });
  }
});

// Mark a notification as read
router.put('/:id/read', authenticateToken, validateId, async (req, res) => {
  try {
    const notification = await Notification.findByPk(req.params.id);
    
    if (!notification) {
      return res.status(404).json({
        error: 'Notification not found'
      });
    }

    // Check if notification belongs to the current user
    if (notification.userId !== req.user.id) {
      return res.status(403).json({
        error: 'Access denied'
      });
    }

    await notification.update({ isRead: true });

    res.json({
      message: 'Notification marked as read',
      notification
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({
      error: 'Failed to mark notification as read',
      message: error.message
    });
  }
});

// Mark all notifications as read for the current user
router.put('/read-all', authenticateToken, async (req, res) => {
  try {
    await Notification.update(
      { isRead: true },
      {
        where: {
          userId: req.user.id,
          isRead: false
        }
      }
    );

    res.json({
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({
      error: 'Failed to mark all notifications as read',
      message: error.message
    });
  }
});

// Delete a notification
router.delete('/:id', authenticateToken, validateId, async (req, res) => {
  try {
    const notification = await Notification.findByPk(req.params.id);
    
    if (!notification) {
      return res.status(404).json({
        error: 'Notification not found'
      });
    }

    // Check if notification belongs to the current user
    if (notification.userId !== req.user.id) {
      return res.status(403).json({
        error: 'Access denied'
      });
    }

    await notification.destroy();

    res.json({
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      error: 'Failed to delete notification',
      message: error.message
    });
  }
});

module.exports = router;