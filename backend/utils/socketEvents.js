const { emitToUser, emitToAdmins, emitToComplaint } = require('../config/socket');
const logger = require('./logger');

/**
 * Socket Event Emitters
 * Centralized functions for emitting real-time events
 */

// Notification Events
const notifyUser = (userId, notification) => {
  emitToUser(userId, 'notification:new', {
    notification,
    timestamp: new Date()
  });
  logger.info('Notification sent to user', { userId, type: notification.type });
};

const notifyUnreadCount = (userId, count) => {
  emitToUser(userId, 'notification:unread-count', {
    count,
    timestamp: new Date()
  });
};

// Complaint Events
const notifyComplaintCreated = (complaint) => {
  // Notify all admins
  emitToAdmins('complaint:created', {
    complaint,
    timestamp: new Date()
  });
  logger.info('New complaint notification sent to admins', { complaintId: complaint._id });
};

const notifyComplaintUpdated = (complaint) => {
  // Notify complaint owner
  emitToUser(complaint.user.toString(), 'complaint:updated', {
    complaint,
    timestamp: new Date()
  });

  // Notify complaint room (for viewers)
  emitToComplaint(complaint._id.toString(), 'complaint:updated', {
    complaint,
    timestamp: new Date()
  });

  logger.info('Complaint update notification sent', { complaintId: complaint._id });
};

const notifyComplaintStatusChanged = (complaint, oldStatus, newStatus, changedBy) => {
  // Notify complaint owner
  emitToUser(complaint.user.toString(), 'complaint:status-changed', {
    complaintId: complaint._id,
    oldStatus,
    newStatus,
    changedBy,
    timestamp: new Date()
  });

  // Notify complaint room
  emitToComplaint(complaint._id.toString(), 'complaint:status-changed', {
    complaintId: complaint._id,
    oldStatus,
    newStatus,
    changedBy,
    timestamp: new Date()
  });

  logger.info('Status change notification sent', { 
    complaintId: complaint._id, 
    oldStatus, 
    newStatus 
  });
};

const notifyComplaintAssigned = (complaint, assignedTo) => {
  // Notify assigned admin/staff
  emitToUser(assignedTo.toString(), 'complaint:assigned', {
    complaint,
    timestamp: new Date()
  });

  // Notify complaint owner
  emitToUser(complaint.user.toString(), 'complaint:assigned', {
    complaint,
    assignedTo,
    timestamp: new Date()
  });

  logger.info('Assignment notification sent', { 
    complaintId: complaint._id, 
    assignedTo 
  });
};

const notifyComplaintDeleted = (complaintId, userId) => {
  // Notify complaint owner
  emitToUser(userId.toString(), 'complaint:deleted', {
    complaintId,
    timestamp: new Date()
  });

  // Notify complaint room
  emitToComplaint(complaintId.toString(), 'complaint:deleted', {
    complaintId,
    timestamp: new Date()
  });

  logger.info('Deletion notification sent', { complaintId });
};

// Comment Events
const notifyNewComment = (complaint, comment, commenter) => {
  // Notify complaint owner (if not the commenter)
  if (complaint.user.toString() !== commenter._id.toString()) {
    emitToUser(complaint.user.toString(), 'comment:new', {
      complaintId: complaint._id,
      comment,
      commenter: {
        id: commenter._id,
        username: commenter.username
      },
      timestamp: new Date()
    });
  }

  // Notify complaint room
  emitToComplaint(complaint._id.toString(), 'comment:new', {
    complaintId: complaint._id,
    comment,
    commenter: {
      id: commenter._id,
      username: commenter.username
    },
    timestamp: new Date()
  });

  logger.info('New comment notification sent', { 
    complaintId: complaint._id,
    commenterId: commenter._id 
  });
};

// Upvote Events
const notifyUpvote = (complaint, upvoterId) => {
  // Notify complaint owner
  if (complaint.user.toString() !== upvoterId.toString()) {
    emitToUser(complaint.user.toString(), 'complaint:upvoted', {
      complaintId: complaint._id,
      upvoteCount: complaint.upvotes.length,
      timestamp: new Date()
    });
  }

  // Notify complaint room
  emitToComplaint(complaint._id.toString(), 'complaint:upvoted', {
    complaintId: complaint._id,
    upvoteCount: complaint.upvotes.length,
    timestamp: new Date()
  });
};

// Feedback Events
const notifyFeedbackSubmitted = (feedback, complaint) => {
  // Notify admins
  emitToAdmins('feedback:submitted', {
    feedback,
    complaint: {
      id: complaint._id,
      title: complaint.title,
      category: complaint.category
    },
    timestamp: new Date()
  });

  logger.info('Feedback notification sent to admins', { 
    feedbackId: feedback._id,
    complaintId: complaint._id 
  });
};

// Admin Dashboard Events
const notifyAdminDashboardUpdate = (stats) => {
  emitToAdmins('dashboard:update', {
    stats,
    timestamp: new Date()
  });
  logger.debug('Dashboard update sent to admins');
};

// System Events
const notifySystemAlert = (alert) => {
  emitToAdmins('system:alert', {
    alert,
    timestamp: new Date()
  });
  logger.warn('System alert sent to admins', { alert });
};

const notifyMaintenanceMode = (enabled, message) => {
  // Broadcast to all users
  const { broadcast } = require('../config/socket');
  broadcast('system:maintenance', {
    enabled,
    message,
    timestamp: new Date()
  });
  logger.info('Maintenance mode notification broadcasted', { enabled });
};

// User Events
const notifyUserOnline = (userId) => {
  emitToAdmins('user:online', {
    userId,
    timestamp: new Date()
  });
};

const notifyUserOffline = (userId) => {
  emitToAdmins('user:offline', {
    userId,
    timestamp: new Date()
  });
};

module.exports = {
  // Notifications
  notifyUser,
  notifyUnreadCount,
  
  // Complaints
  notifyComplaintCreated,
  notifyComplaintUpdated,
  notifyComplaintStatusChanged,
  notifyComplaintAssigned,
  notifyComplaintDeleted,
  
  // Comments
  notifyNewComment,
  
  // Upvotes
  notifyUpvote,
  
  // Feedback
  notifyFeedbackSubmitted,
  
  // Admin
  notifyAdminDashboardUpdate,
  
  // System
  notifySystemAlert,
  notifyMaintenanceMode,
  
  // Users
  notifyUserOnline,
  notifyUserOffline
};
