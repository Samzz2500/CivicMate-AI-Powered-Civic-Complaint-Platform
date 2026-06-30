const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");
const { authMiddleware } = require("../middleware/auth");
const { asyncHandler, AppError } = require("../middleware/errorHandler");
const logger = require("../utils/logger");

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get user notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: unreadOnly
 *         schema:
 *           type: boolean
 *           default: false
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 */
router.get("/", authMiddleware, asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, unreadOnly = false } = req.query;
  const skip = (page - 1) * limit;

  const query = { user: req.user.id };
  if (unreadOnly === 'true') {
    query.read = false;
  }

  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .populate('relatedTweet', 'title category')
    .lean();

  const total = await Notification.countDocuments(query);
  const unreadCount = await Notification.countDocuments({ 
    user: req.user.id, 
    read: false 
  });

  res.json({
    success: true,
    notifications,
    unreadCount,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

/**
 * @swagger
 * /api/notifications/unread-count:
 *   get:
 *     summary: Get unread notification count
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread count retrieved
 */
router.get("/unread-count", authMiddleware, asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({
    user: req.user.id,
    read: false
  });

  res.json({
    success: true,
    unreadCount: count
  });
}));

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   patch:
 *     summary: Mark notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification marked as read
 */
router.patch("/:id/read", authMiddleware, asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({
    _id: req.params.id,
    user: req.user.id
  });

  if (!notification) {
    throw new AppError("Notification not found", 404);
  }

  await notification.markAsRead();

  res.json({
    success: true,
    notification
  });
}));

/**
 * @swagger
 * /api/notifications/mark-all-read:
 *   patch:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 */
router.patch("/mark-all-read", authMiddleware, asyncHandler(async (req, res) => {
  const result = await Notification.markAllAsRead(req.user.id);

  logger.info("All notifications marked as read", { 
    userId: req.user.id, 
    count: result.modifiedCount 
  });

  res.json({
    success: true,
    message: "All notifications marked as read",
    count: result.modifiedCount
  });
}));

/**
 * @swagger
 * /api/notifications/{id}:
 *   delete:
 *     summary: Delete notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification deleted
 */
router.delete("/:id", authMiddleware, asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndDelete({
    _id: req.params.id,
    user: req.user.id
  });

  if (!notification) {
    throw new AppError("Notification not found", 404);
  }

  logger.info("Notification deleted", { 
    notificationId: req.params.id, 
    userId: req.user.id 
  });

  res.json({
    success: true,
    message: "Notification deleted"
  });
}));

module.exports = router;
