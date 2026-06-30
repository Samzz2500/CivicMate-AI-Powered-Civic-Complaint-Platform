const mongoose = require("mongoose");

const AuditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: [
      'user_register',
      'user_login',
      'user_logout',
      'user_update',
      'user_delete',
      'tweet_create',
      'tweet_update',
      'tweet_delete',
      'tweet_status_change',
      'tweet_assign',
      'comment_create',
      'comment_delete',
      'upvote',
      'feedback_submit',
      'admin_action',
      'system_action'
    ],
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  resource: {
    type: String,
    required: true,
    enum: ['User', 'Tweet', 'Feedback', 'Comment', 'System'],
    index: true
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    index: true
  },
  changes: {
    type: mongoose.Schema.Types.Mixed,
    description: "Object containing before/after values"
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    description: "Additional context data"
  },
  severity: {
    type: String,
    enum: ['info', 'warning', 'critical'],
    default: 'info',
    index: true
  }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

// Compound indexes for efficient queries
AuditLogSchema.index({ user: 1, createdAt: -1 });
AuditLogSchema.index({ resource: 1, resourceId: 1, createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });
AuditLogSchema.index({ severity: 1, createdAt: -1 });

// Static method to log action
AuditLogSchema.statics.logAction = async function(data) {
  try {
    const log = new this(data);
    await log.save();
    return log;
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw error - audit logging should not break main flow
    return null;
  }
};

// Static method to get user activity
AuditLogSchema.statics.getUserActivity = async function(userId, limit = 50) {
  return this.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('user', 'username email')
    .lean();
};

// Static method to get resource history
AuditLogSchema.statics.getResourceHistory = async function(resource, resourceId) {
  return this.find({ resource, resourceId })
    .sort({ createdAt: -1 })
    .populate('user', 'username email')
    .lean();
};

module.exports = mongoose.model("AuditLog", AuditLogSchema);
