const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30,
    index: true
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  password: { 
    type: String, 
    required: true,
    minlength: 6
  },
  firstname: { 
    type: String, 
    required: true,
    trim: true
  },
  lastname: { 
    type: String, 
    required: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true,
    match: /^[0-9]{10}$/
  },
  city: { 
    type: String,
    trim: true
  },
  state: { 
    type: String,
    trim: true
  },
  pincode: { 
    type: String,
    trim: true,
    match: /^[0-9]{6}$/
  },
  role: {
    type: String,
    enum: ["admin", "user"],
    default: "user",
    index: true
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: {
    type: String
  },
  profilePicture: {
    type: String
  },
  lastLogin: {
    type: Date
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date
  },
  preferences: {
    emailNotifications: {
      type: Boolean,
      default: true
    },
    smsNotifications: {
      type: Boolean,
      default: false
    },
    language: {
      type: String,
      enum: ['en', 'mr'],
      default: 'en'
    }
  },
  resetPasswordToken: {
    type: String
  },
  resetPasswordExpires: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index for faster queries
UserSchema.index({ email: 1, username: 1 });

// Virtual for full name
UserSchema.virtual('fullName').get(function() {
  return `${this.firstname} ${this.lastname}`;
});

// Virtual to check if account is locked
UserSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Method to increment login attempts
UserSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }
  
  // Otherwise increment
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts for 2 hours
  const maxAttempts = 5;
  const lockTime = 2 * 60 * 60 * 1000; // 2 hours
  
  if (this.loginAttempts + 1 >= maxAttempts && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + lockTime };
  }
  
  return this.updateOne(updates);
};

// Method to reset login attempts
UserSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $set: { loginAttempts: 0 },
    $unset: { lockUntil: 1 }
  });
};

module.exports = mongoose.model("User", UserSchema);
