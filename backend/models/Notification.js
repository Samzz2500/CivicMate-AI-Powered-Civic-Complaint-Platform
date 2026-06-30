const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: [
      'status_change',
      'comment',
      'upvote',
      'assignment',
      'completion',
      'feedback_request',
      'system'
    ],
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  message: {
    type: String,
    required: true,
    maxlength: 500
  },
  link: {
    type: String,
    description: "URL to navigate when notification is clicked"
  },
  relatedTweet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tweet"
  },
  read: {
    type: Boolean,
    default: false,
    index: true
  },
  readAt: {
    type: Date
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
NotificationSchema.index({ user: 1, read: 1, createdAt: -1 });
NotificationSchema.index({ user: 1, type: 1, createdAt: -1 });

// Method to mark as read
NotificationSchema.methods.markAsRead = function() {
  this.read = true;
  this.readAt = new Date();
  return this.save();
};

// Static method to create notification
NotificationSchema.statics.createNotification = async function(data) {
  const notification = new this(data);
  await notification.save();
  
  // Emit real-time notification
  try {
    const { notifyUser, notifyUnreadCount } = require('../utils/socketEvents');
    notifyUser(data.user.toString(), notification);
    
    // Update unread count
    const unreadCount = await this.countDocuments({ 
      user: data.user, 
      read: false 
    });
    notifyUnreadCount(data.user.toString(), unreadCount);
  } catch (error) {
    // Don't fail if socket emission fails
    console.error('Failed to emit notification:', error.message);
  }
  
  return notification;
};

// Static method to mark all as read for a user
NotificationSchema.statics.markAllAsRead = async function(userId) {
  return this.updateMany(
    { user: userId, read: false },
    { $set: { read: true, readAt: new Date() } }
  );
};

module.exports = mongoose.model("Notification", NotificationSchema);
