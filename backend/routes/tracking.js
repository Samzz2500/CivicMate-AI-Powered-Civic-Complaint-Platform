const express = require('express');
const router = express.Router();
const Tweet = require('../models/Tweet');
const Department = require('../models/Department');
const Notification = require('../models/Notification');
const { auth, adminAuth } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

// Import services
let emailService, smsService, socketEvents;
try {
  emailService = require('../utils/emailService');
  smsService = require('../utils/smsService');
  socketEvents = require('../utils/socketEvents');
} catch (e) {
  console.log('Optional services not available');
}

/**
 * @swagger
 * /api/tracking/{complaintId}:
 *   get:
 *     summary: Get complaint tracking details (Citizen view)
 *     tags: [Tracking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: complaintId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tracking details retrieved
 */
router.get('/:complaintId', auth, asyncHandler(async (req, res) => {
  const complaint = await Tweet.findById(req.params.complaintId)
    .populate('user', 'name email phone')
    .populate('assignedTo', 'name email')
    .populate('department', 'name description contactEmail contactPhone')
    .populate('verifiedBy', 'name email')
    .populate('workflow.submitted.completedBy', 'name')
    .populate('workflow.assigned.completedBy', 'name')
    .populate('workflow.assigned.assignedTo', 'name email phone')
    .populate('workflow.inProgress.completedBy', 'name')
    .populate('workflow.underReview.completedBy', 'name')
    .populate('workflow.resolved.completedBy', 'name')
    .populate('workflow.verified.completedBy', 'name')
    .populate('workflow.completed.completedBy', 'name');

  if (!complaint) {
    return res.status(404).json({
      success: false,
      error: 'Complaint not found'
    });
  }

  // Check if user owns this complaint or is admin
  if (complaint.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Access denied'
    });
  }

  // Build tracking timeline
  const timeline = [];

  // 1. Submitted
  if (complaint.workflow.submitted.status) {
    timeline.push({
      stage: 'submitted',
      title: 'Complaint Submitted',
      description: 'Your complaint has been registered successfully',
      status: 'completed',
      timestamp: complaint.workflow.submitted.timestamp,
      completedBy: complaint.workflow.submitted.completedBy,
      note: complaint.workflow.submitted.note,
      icon: '📝'
    });
  }

  // 2. Assigned
  if (complaint.workflow.assigned.status) {
    timeline.push({
      stage: 'assigned',
      title: 'Assigned to Department',
      description: `Assigned to ${complaint.workflow.assigned.department || 'department'}`,
      status: 'completed',
      timestamp: complaint.workflow.assigned.timestamp,
      completedBy: complaint.workflow.assigned.completedBy,
      assignedTo: complaint.workflow.assigned.assignedTo,
      department: complaint.department,
      note: complaint.workflow.assigned.note,
      icon: '👥'
    });
  } else if (complaint.completed === 'submitted') {
    timeline.push({
      stage: 'assigned',
      title: 'Awaiting Assignment',
      description: 'Waiting to be assigned to a department',
      status: 'pending',
      icon: '⏳'
    });
  }

  // 3. In Progress
  if (complaint.workflow.inProgress.status) {
    timeline.push({
      stage: 'in-progress',
      title: 'Work in Progress',
      description: 'Department is working on resolving your complaint',
      status: 'completed',
      timestamp: complaint.workflow.inProgress.timestamp,
      completedBy: complaint.workflow.inProgress.completedBy,
      progressPercentage: complaint.workflow.inProgress.progressPercentage,
      note: complaint.workflow.inProgress.note,
      icon: '🔧'
    });
  } else if (complaint.workflow.assigned.status && !complaint.workflow.inProgress.status) {
    timeline.push({
      stage: 'in-progress',
      title: 'Awaiting Work Start',
      description: 'Assigned staff will begin work soon',
      status: 'pending',
      icon: '⏳'
    });
  }

  // 4. Under Review
  if (complaint.workflow.underReview.status) {
    timeline.push({
      stage: 'under-review',
      title: 'Under Review',
      description: 'Work completed, under review by supervisor',
      status: 'completed',
      timestamp: complaint.workflow.underReview.timestamp,
      completedBy: complaint.workflow.underReview.completedBy,
      note: complaint.workflow.underReview.note,
      icon: '🔍'
    });
  } else if (complaint.workflow.inProgress.status && !complaint.workflow.underReview.status) {
    timeline.push({
      stage: 'under-review',
      title: 'Pending Review',
      description: 'Will be reviewed after work completion',
      status: 'pending',
      icon: '⏳'
    });
  }

  // 5. Resolved
  if (complaint.workflow.resolved.status) {
    timeline.push({
      stage: 'resolved',
      title: 'Issue Resolved',
      description: 'The issue has been resolved by the department',
      status: 'completed',
      timestamp: complaint.workflow.resolved.timestamp,
      completedBy: complaint.workflow.resolved.completedBy,
      resolutionDetails: complaint.workflow.resolved.resolutionDetails,
      note: complaint.workflow.resolved.note,
      icon: '✅'
    });
  } else if (complaint.workflow.underReview.status && !complaint.workflow.resolved.status) {
    timeline.push({
      stage: 'resolved',
      title: 'Pending Resolution',
      description: 'Awaiting final resolution',
      status: 'pending',
      icon: '⏳'
    });
  }

  // 6. Verified
  if (complaint.workflow.verified.status) {
    timeline.push({
      stage: 'verified',
      title: 'Verified by Officer',
      description: `Verified by ${complaint.workflow.verified.verifiedBy || 'Main Officer'}`,
      status: 'completed',
      timestamp: complaint.workflow.verified.timestamp,
      completedBy: complaint.workflow.verified.completedBy,
      verifiedBy: complaint.workflow.verified.verifiedBy,
      note: complaint.workflow.verified.note,
      icon: '✔️'
    });
  } else if (complaint.workflow.resolved.status && !complaint.workflow.verified.status) {
    timeline.push({
      stage: 'verified',
      title: 'Pending Verification',
      description: 'Awaiting verification by main officer',
      status: 'pending',
      icon: '⏳'
    });
  }

  // 7. Completed
  if (complaint.workflow.completed.status) {
    timeline.push({
      stage: 'completed',
      title: 'Complaint Closed',
      description: 'Your complaint has been successfully resolved and closed',
      status: 'completed',
      timestamp: complaint.workflow.completed.timestamp,
      completedBy: complaint.workflow.completed.completedBy,
      note: complaint.workflow.completed.note,
      icon: '🎉'
    });
  } else if (complaint.workflow.verified.status && !complaint.workflow.completed.status) {
    timeline.push({
      stage: 'completed',
      title: 'Pending Closure',
      description: 'Final closure pending',
      status: 'pending',
      icon: '⏳'
    });
  }

  // Calculate progress percentage
  const totalStages = 7;
  const completedStages = timeline.filter(t => t.status === 'completed').length;
  const progressPercentage = Math.round((completedStages / totalStages) * 100);

  // Current stage
  const currentStage = timeline.find(t => t.status === 'pending') || timeline[timeline.length - 1];

  // Estimated completion
  let estimatedCompletion = null;
  if (complaint.estimatedResolutionDate) {
    estimatedCompletion = complaint.estimatedResolutionDate;
  } else if (complaint.workflow.assigned.timestamp) {
    // Estimate 7 days from assignment
    estimatedCompletion = new Date(complaint.workflow.assigned.timestamp);
    estimatedCompletion.setDate(estimatedCompletion.getDate() + 7);
  }

  res.json({
    success: true,
    tracking: {
      complaintId: complaint._id,
      title: complaint.title,
      category: complaint.category,
      location: complaint.location,
      status: complaint.completed,
      progressPercentage,
      currentStage: currentStage.stage,
      timeline,
      estimatedCompletion,
      actualCompletion: complaint.actualResolutionDate,
      department: complaint.department,
      assignedTo: complaint.assignedTo,
      createdAt: complaint.createdAt,
      updatedAt: complaint.updatedAt
    }
  });
}));

/**
 * @swagger
 * /api/tracking/{complaintId}/update-stage:
 *   post:
 *     summary: Update complaint workflow stage (Admin only)
 *     tags: [Tracking]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:complaintId/update-stage', adminAuth, asyncHandler(async (req, res) => {
  const { stage, note, progressPercentage, resolutionDetails, verifiedBy } = req.body;

  const complaint = await Tweet.findById(req.params.complaintId);
  if (!complaint) {
    return res.status(404).json({
      success: false,
      error: 'Complaint not found'
    });
  }

  const validStages = ['assigned', 'inProgress', 'underReview', 'resolved', 'verified', 'completed'];
  if (!validStages.includes(stage)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid stage'
    });
  }

  // Update the workflow stage
  const stageKey = stage === 'inProgress' ? 'inProgress' : stage;
  complaint.workflow[stageKey] = {
    status: true,
    timestamp: new Date(),
    completedBy: req.user.id,
    note: note || '',
    ...(progressPercentage && { progressPercentage }),
    ...(resolutionDetails && { resolutionDetails }),
    ...(verifiedBy && { verifiedBy })
  };

  // Update main status
  const stageToStatusMap = {
    'assigned': 'assigned',
    'inProgress': 'in-progress',
    'underReview': 'under-review',
    'resolved': 'resolved',
    'verified': 'verified',
    'completed': 'completed'
  };
  complaint.completed = stageToStatusMap[stage];

  // Add to history
  complaint.history.push({
    status: complaint.completed,
    changedBy: req.user.id,
    date: new Date(),
    note: note || `Status changed to ${complaint.completed}`
  });

  await complaint.save();

  // Create notification for user
  try {
    await Notification.create({
      user: complaint.user,
      type: 'status_change',
      title: 'Complaint Status Updated',
      message: `Your complaint "${complaint.title}" status: ${complaint.completed}`,
      relatedTweet: complaint._id,
      priority: 'high'
    });

    // Emit socket event
    if (socketEvents && socketEvents.emitStatusChanged) {
      socketEvents.emitStatusChanged(complaint.user.toString(), {
        complaintId: complaint._id,
        title: complaint.title,
        oldStatus: complaint.history[complaint.history.length - 2]?.status || 'submitted',
        newStatus: complaint.completed,
        note
      });
    }

    // Send email notification
    if (emailService && emailService.sendStatusChangedEmail) {
      const user = await complaint.populate('user');
      emailService.sendStatusChangedEmail(user.user, complaint, complaint.history[complaint.history.length - 2]?.status || 'submitted', complaint.completed);
    }

    // Send SMS notification
    if (smsService && smsService.sendStatusChangedSMS) {
      const user = await complaint.populate('user');
      if (user.user.phone) {
        smsService.sendStatusChangedSMS(user.user.phone, complaint, complaint.completed);
      }
    }
  } catch (error) {
    console.error('Notification error:', error);
  }

  res.json({
    success: true,
    message: 'Workflow stage updated successfully',
    complaint: {
      id: complaint._id,
      status: complaint.completed,
      workflow: complaint.workflow
    }
  });
}));

/**
 * @swagger
 * /api/tracking/{complaintId}/assign-department:
 *   post:
 *     summary: Assign complaint to department (Admin only)
 *     tags: [Tracking]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:complaintId/assign-department', adminAuth, asyncHandler(async (req, res) => {
  const { departmentId, assignedToUserId, note, estimatedDays } = req.body;

  const complaint = await Tweet.findById(req.params.complaintId);
  if (!complaint) {
    return res.status(404).json({
      success: false,
      error: 'Complaint not found'
    });
  }

  const department = await Department.findById(departmentId);
  if (!department) {
    return res.status(404).json({
      success: false,
      error: 'Department not found'
    });
  }

  // Update complaint
  complaint.department = departmentId;
  complaint.assignedTo = assignedToUserId;
  complaint.completed = 'assigned';

  // Calculate estimated resolution date
  if (estimatedDays) {
    const estimatedDate = new Date();
    estimatedDate.setDate(estimatedDate.getDate() + estimatedDays);
    complaint.estimatedResolutionDate = estimatedDate;
  }

  // Update workflow
  complaint.workflow.assigned = {
    status: true,
    timestamp: new Date(),
    completedBy: req.user.id,
    department: department.name,
    assignedTo: assignedToUserId,
    note: note || `Assigned to ${department.name}`
  };

  // Add to history
  complaint.history.push({
    status: 'assigned',
    changedBy: req.user.id,
    date: new Date(),
    note: `Assigned to ${department.name}`
  });

  await complaint.save();

  // Create notifications
  try {
    // Notify complaint owner
    await Notification.create({
      user: complaint.user,
      type: 'complaint_assigned',
      title: 'Complaint Assigned',
      message: `Your complaint has been assigned to ${department.name}`,
      relatedTweet: complaint._id,
      priority: 'high'
    });

    // Notify assigned staff
    if (assignedToUserId) {
      await Notification.create({
        user: assignedToUserId,
        type: 'complaint_assigned',
        title: 'New Complaint Assigned',
        message: `You have been assigned complaint: ${complaint.title}`,
        relatedTweet: complaint._id,
        priority: 'high'
      });
    }

    // Emit socket events
    if (socketEvents && socketEvents.emitComplaintAssigned) {
      socketEvents.emitComplaintAssigned(complaint.user.toString(), {
        complaintId: complaint._id,
        department: department.name
      });
    }
  } catch (error) {
    console.error('Notification error:', error);
  }

  res.json({
    success: true,
    message: 'Complaint assigned to department successfully',
    complaint: {
      id: complaint._id,
      department: department.name,
      assignedTo: assignedToUserId,
      estimatedResolutionDate: complaint.estimatedResolutionDate
    }
  });
}));

/**
 * @swagger
 * /api/tracking/{complaintId}/verify:
 *   post:
 *     summary: Verify complaint resolution (Main Officer only)
 *     tags: [Tracking]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:complaintId/verify', adminAuth, asyncHandler(async (req, res) => {
  const { verifiedBy, note, approved } = req.body;

  const complaint = await Tweet.findById(req.params.complaintId);
  if (!complaint) {
    return res.status(404).json({
      success: false,
      error: 'Complaint not found'
    });
  }

  if (!complaint.workflow.resolved.status) {
    return res.status(400).json({
      success: false,
      error: 'Complaint must be resolved before verification'
    });
  }

  if (approved) {
    // Approve and verify
    complaint.workflow.verified = {
      status: true,
      timestamp: new Date(),
      completedBy: req.user.id,
      verifiedBy: verifiedBy || req.user.name,
      note: note || 'Verified by main officer'
    };
    complaint.completed = 'verified';
    complaint.verifiedBy = req.user.id;

    // Add to history
    complaint.history.push({
      status: 'verified',
      changedBy: req.user.id,
      date: new Date(),
      note: note || 'Verified by main officer'
    });
  } else {
    // Reject and send back to in-progress
    complaint.workflow.underReview.status = false;
    complaint.workflow.resolved.status = false;
    complaint.completed = 'in-progress';
    complaint.rejectionReason = note;

    // Add to history
    complaint.history.push({
      status: 'in-progress',
      changedBy: req.user.id,
      date: new Date(),
      note: `Rejected: ${note}`
    });
  }

  await complaint.save();

  // Create notification
  try {
    await Notification.create({
      user: complaint.user,
      type: 'complaint_verified',
      title: approved ? 'Complaint Verified' : 'Complaint Needs Rework',
      message: approved 
        ? 'Your complaint resolution has been verified by the main officer'
        : `Your complaint needs rework: ${note}`,
      relatedTweet: complaint._id,
      priority: 'high'
    });

    // Notify assigned staff if rejected
    if (!approved && complaint.assignedTo) {
      await Notification.create({
        user: complaint.assignedTo,
        type: 'complaint_rejected',
        title: 'Complaint Rejected',
        message: `Complaint "${complaint.title}" needs rework: ${note}`,
        relatedTweet: complaint._id,
        priority: 'high'
      });
    }
  } catch (error) {
    console.error('Notification error:', error);
  }

  res.json({
    success: true,
    message: approved ? 'Complaint verified successfully' : 'Complaint sent back for rework',
    complaint: {
      id: complaint._id,
      status: complaint.completed,
      verified: approved
    }
  });
}));

/**
 * @swagger
 * /api/tracking/{complaintId}/complete:
 *   post:
 *     summary: Mark complaint as completed (Admin only)
 *     tags: [Tracking]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:complaintId/complete', adminAuth, asyncHandler(async (req, res) => {
  const { note } = req.body;

  const complaint = await Tweet.findById(req.params.complaintId);
  if (!complaint) {
    return res.status(404).json({
      success: false,
      error: 'Complaint not found'
    });
  }

  if (!complaint.workflow.verified.status) {
    return res.status(400).json({
      success: false,
      error: 'Complaint must be verified before completion'
    });
  }

  // Mark as completed
  complaint.workflow.completed = {
    status: true,
    timestamp: new Date(),
    completedBy: req.user.id,
    note: note || 'Complaint successfully resolved and closed'
  };
  complaint.completed = 'completed';
  complaint.actualResolutionDate = new Date();

  // Add to history
  complaint.history.push({
    status: 'completed',
    changedBy: req.user.id,
    date: new Date(),
    note: note || 'Complaint closed'
  });

  await complaint.save();

  // Create notification and request feedback
  try {
    await Notification.create({
      user: complaint.user,
      type: 'complaint_completed',
      title: 'Complaint Completed',
      message: 'Your complaint has been successfully resolved. Please provide feedback.',
      relatedTweet: complaint._id,
      priority: 'high'
    });

    // Send feedback request email
    if (emailService && emailService.sendFeedbackRequestEmail) {
      const user = await complaint.populate('user');
      emailService.sendFeedbackRequestEmail(user.user, complaint);
    }

    // Send feedback request SMS
    if (smsService && smsService.sendFeedbackRequestSMS) {
      const user = await complaint.populate('user');
      if (user.user.phone) {
        smsService.sendFeedbackRequestSMS(user.user.phone, complaint);
      }
    }
  } catch (error) {
    console.error('Notification error:', error);
  }

  res.json({
    success: true,
    message: 'Complaint marked as completed successfully',
    complaint: {
      id: complaint._id,
      status: complaint.completed,
      actualResolutionDate: complaint.actualResolutionDate
    }
  });
}));

module.exports = router;
