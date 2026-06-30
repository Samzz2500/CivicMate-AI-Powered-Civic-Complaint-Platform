const express = require('express');
const router = express.Router();
const Tweet = require('../models/Tweet');
const User = require('../models/User');
const Feedback = require('../models/Feedback');
const Department = require('../models/Department');
const AuditLog = require('../models/AuditLog');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { notifyComplaintAssigned, notifyComplaintStatusChanged } = require('../utils/socketEvents');
const { addEmailJob, addSMSJob } = require('../jobs/queueManager');
const logger = require('../utils/logger');

/**
 * @swagger
 * /api/admin/complaints/bulk-update:
 *   patch:
 *     summary: Bulk update complaint status
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - complaintIds
 *               - status
 *             properties:
 *               complaintIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               status:
 *                 type: string
 *                 enum: [pending, in-progress, completed]
 *               note:
 *                 type: string
 *     responses:
 *       200:
 *         description: Complaints updated
 */
router.patch('/complaints/bulk-update', authMiddleware, adminMiddleware, asyncHandler(async (req, res) => {
  const { complaintIds, status, note } = req.body;

  if (!complaintIds || !Array.isArray(complaintIds) || complaintIds.length === 0) {
    throw new AppError('Complaint IDs array is required', 400);
  }

  if (!status) {
    throw new AppError('Status is required', 400);
  }

  const complaints = await Tweet.find({ _id: { $in: complaintIds } }).populate('user');

  if (complaints.length === 0) {
    throw new AppError('No complaints found', 404);
  }

  const updates = [];

  for (const complaint of complaints) {
    const oldStatus = complaint.completed;
    complaint.completed = status;

    // Add to history
    complaint.history.push({
      status,
      changedBy: req.user.id,
      date: new Date(),
      note: note || `Bulk status update to ${status}`
    });

    if (status === 'completed') {
      complaint.actualResolutionDate = new Date();
    }

    await complaint.save();

    // Log audit
    await AuditLog.logAction({
      action: 'tweet_status_change',
      user: req.user.id,
      resource: 'Tweet',
      resourceId: complaint._id,
      changes: { oldStatus, newStatus: status },
      metadata: { bulkUpdate: true, note }
    });

    // Send notifications
    notifyComplaintStatusChanged(complaint, oldStatus, status, req.user.id);

    // Queue email
    if (complaint.user.preferences?.emailNotifications !== false) {
      addEmailJob(complaint.user.email, 'statusChanged', {
        user: complaint.user,
        complaint,
        oldStatus,
        newStatus: status
      });
    }

    // Queue SMS
    if (complaint.user.phone && complaint.user.preferences?.smsNotifications) {
      addSMSJob(complaint.user.phone, 'statusChanged', { complaint, newStatus: status });
    }

    updates.push({
      complaintId: complaint._id,
      oldStatus,
      newStatus: status
    });
  }

  logger.info('Bulk complaint update', {
    count: updates.length,
    status,
    adminId: req.user.id
  });

  res.json({
    success: true,
    message: `${updates.length} complaints updated`,
    updates
  });
}));

/**
 * @swagger
 * /api/admin/complaints/assign:
 *   post:
 *     summary: Assign complaint to staff member
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - complaintId
 *               - assignedTo
 *             properties:
 *               complaintId:
 *                 type: string
 *               assignedTo:
 *                 type: string
 *               department:
 *                 type: string
 *               estimatedResolutionDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Complaint assigned
 */
router.post('/complaints/assign', authMiddleware, adminMiddleware, asyncHandler(async (req, res) => {
  const { complaintId, assignedTo, department, estimatedResolutionDate } = req.body;

  const complaint = await Tweet.findById(complaintId).populate('user');
  if (!complaint) {
    throw new AppError('Complaint not found', 404);
  }

  const assignee = await User.findById(assignedTo);
  if (!assignee) {
    throw new AppError('Assignee not found', 404);
  }

  complaint.assignedTo = assignedTo;
  if (department) complaint.department = department;
  if (estimatedResolutionDate) complaint.estimatedResolutionDate = new Date(estimatedResolutionDate);

  // Add to history
  complaint.history.push({
    status: complaint.completed,
    changedBy: req.user.id,
    date: new Date(),
    note: `Assigned to ${assignee.firstname} ${assignee.lastname}`
  });

  // Change status to in-progress if pending
  if (complaint.completed === 'pending') {
    complaint.completed = 'in-progress';
  }

  await complaint.save();

  // Log audit
  await AuditLog.logAction({
    action: 'tweet_assign',
    user: req.user.id,
    resource: 'Tweet',
    resourceId: complaint._id,
    changes: { assignedTo },
    metadata: { department, estimatedResolutionDate }
  });

  // Notify assignee
  notifyComplaintAssigned(complaint, assignedTo);

  // Send email to assignee
  if (assignee.preferences?.emailNotifications !== false) {
    addEmailJob(assignee.email, 'complaintReceived', {
      user: assignee,
      complaint
    });
  }

  logger.info('Complaint assigned', {
    complaintId,
    assignedTo,
    adminId: req.user.id
  });

  res.json({
    success: true,
    message: 'Complaint assigned successfully',
    complaint
  });
}));

/**
 * @swagger
 * /api/admin/complaints/{id}/internal-note:
 *   post:
 *     summary: Add internal note (admin-only, not visible to users)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - note
 *             properties:
 *               note:
 *                 type: string
 *     responses:
 *       200:
 *         description: Note added
 */
router.post('/complaints/:id/internal-note', authMiddleware, adminMiddleware, asyncHandler(async (req, res) => {
  const { note } = req.body;

  if (!note) {
    throw new AppError('Note is required', 400);
  }

  const complaint = await Tweet.findById(req.params.id);
  if (!complaint) {
    throw new AppError('Complaint not found', 404);
  }

  complaint.internalNotes.push({
    user: req.user.id,
    note,
    date: new Date()
  });

  await complaint.save();

  logger.info('Internal note added', {
    complaintId: req.params.id,
    adminId: req.user.id
  });

  res.json({
    success: true,
    message: 'Internal note added',
    note: complaint.internalNotes[complaint.internalNotes.length - 1]
  });
}));

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users with filters
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Users retrieved
 */
router.get('/users', authMiddleware, adminMiddleware, asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, role, search } = req.query;
  const skip = (page - 1) * limit;

  const query = {};
  if (role) query.role = role;
  if (search) {
    query.$or = [
      { username: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { firstname: { $regex: search, $options: 'i' } },
      { lastname: { $regex: search, $options: 'i' } }
    ];
  }

  const [users, total] = await Promise.all([
    User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    User.countDocuments(query)
  ]);

  // Get complaint counts for each user
  const usersWithStats = await Promise.all(users.map(async (user) => {
    const complaintCount = await Tweet.countDocuments({ user: user._id });
    return { ...user, complaintCount };
  }));

  res.json({
    success: true,
    users: usersWithStats,
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
 * /api/admin/users/{id}/toggle-status:
 *   patch:
 *     summary: Enable/disable user account
 *     tags: [Admin]
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
 *         description: User status toggled
 */
router.patch('/users/:id/toggle-status', authMiddleware, adminMiddleware, asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Toggle lock status
  if (user.lockUntil && user.lockUntil > Date.now()) {
    user.lockUntil = undefined;
    user.loginAttempts = 0;
  } else {
    user.lockUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year
  }

  await user.save();

  await AuditLog.logAction({
    action: 'user_update',
    user: req.user.id,
    resource: 'User',
    resourceId: user._id,
    changes: { lockUntil: user.lockUntil },
    metadata: { action: 'toggle_status' }
  });

  logger.info('User status toggled', {
    userId: user._id,
    locked: !!user.lockUntil,
    adminId: req.user.id
  });

  res.json({
    success: true,
    message: user.lockUntil ? 'User account disabled' : 'User account enabled',
    user: {
      id: user._id,
      username: user.username,
      locked: !!user.lockUntil
    }
  });
}));

/**
 * @swagger
 * /api/admin/departments:
 *   get:
 *     summary: Get all departments
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Departments retrieved
 */
router.get('/departments', authMiddleware, adminMiddleware, asyncHandler(async (req, res) => {
  const departments = await Department.find({ active: true })
    .populate('head', 'username firstname lastname email')
    .populate('staff', 'username firstname lastname')
    .lean();

  res.json({
    success: true,
    departments
  });
}));

/**
 * @swagger
 * /api/admin/departments:
 *   post:
 *     summary: Create new department
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - categories
 *             properties:
 *               name:
 *                 type: string
 *               nameMarathi:
 *                 type: string
 *               description:
 *                 type: string
 *               categories:
 *                 type: array
 *                 items:
 *                   type: string
 *               contactEmail:
 *                 type: string
 *               contactPhone:
 *                 type: string
 *     responses:
 *       201:
 *         description: Department created
 */
router.post('/departments', authMiddleware, adminMiddleware, asyncHandler(async (req, res) => {
  const department = new Department(req.body);
  await department.save();

  await AuditLog.logAction({
    action: 'admin_action',
    user: req.user.id,
    resource: 'Department',
    resourceId: department._id,
    metadata: { action: 'create_department' }
  });

  logger.info('Department created', {
    departmentId: department._id,
    name: department.name,
    adminId: req.user.id
  });

  res.status(201).json({
    success: true,
    message: 'Department created successfully',
    department
  });
}));

/**
 * @swagger
 * /api/admin/export/complaints:
 *   get:
 *     summary: Export complaints to CSV
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: CSV file
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 */
router.get('/export/complaints', authMiddleware, adminMiddleware, asyncHandler(async (req, res) => {
  const { status, category, startDate, endDate } = req.query;

  const query = {};
  if (status) query.completed = status;
  if (category) query.category = category;
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const complaints = await Tweet.find(query)
    .populate('user', 'username email firstname lastname')
    .populate('assignedTo', 'username firstname lastname')
    .lean();

  // Generate CSV
  const csv = generateComplaintsCSV(complaints);

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=complaints-${Date.now()}.csv`);
  res.send(csv);

  logger.info('Complaints exported', {
    count: complaints.length,
    filters: { status, category, startDate, endDate },
    adminId: req.user.id
  });
}));

// Helper function to generate CSV
const generateComplaintsCSV = (complaints) => {
  const headers = [
    'ID',
    'Title',
    'Description',
    'Category',
    'Status',
    'Location',
    'Priority',
    'Upvotes',
    'User',
    'User Email',
    'Assigned To',
    'Department',
    'Created At',
    'Updated At',
    'Resolution Date'
  ];

  const rows = complaints.map(c => [
    c._id,
    `"${c.title.replace(/"/g, '""')}"`,
    `"${c.description.replace(/"/g, '""')}"`,
    c.category,
    c.completed,
    `"${c.location.replace(/"/g, '""')}"`,
    c.priority,
    c.upvotes.length,
    c.user?.username || 'N/A',
    c.user?.email || 'N/A',
    c.assignedTo ? `${c.assignedTo.firstname} ${c.assignedTo.lastname}` : 'Unassigned',
    c.department || 'N/A',
    new Date(c.createdAt).toISOString(),
    new Date(c.updatedAt).toISOString(),
    c.actualResolutionDate ? new Date(c.actualResolutionDate).toISOString() : 'N/A'
  ]);

  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
};

module.exports = router;
