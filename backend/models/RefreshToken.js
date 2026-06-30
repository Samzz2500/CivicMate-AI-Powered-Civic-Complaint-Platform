const mongoose = require("mongoose");
const crypto = require("crypto");

const RefreshTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true
  },
  createdByIp: {
    type: String
  },
  revokedAt: {
    type: Date
  },
  revokedByIp: {
    type: String
  },
  replacedByToken: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  }
}, {
  timestamps: true
});

// Virtual to check if token is expired
RefreshTokenSchema.virtual('isExpired').get(function() {
  return Date.now() >= this.expiresAt;
});

// Virtual to check if token is valid
RefreshTokenSchema.virtual('isValid').get(function() {
  return this.isActive && !this.isExpired && !this.revokedAt;
});

// Method to revoke token
RefreshTokenSchema.methods.revoke = function(ipAddress, replacedByToken) {
  this.revokedAt = Date.now();
  this.revokedByIp = ipAddress;
  this.isActive = false;
  if (replacedByToken) {
    this.replacedByToken = replacedByToken;
  }
  return this.save();
};

// Static method to generate token
RefreshTokenSchema.statics.generateToken = function() {
  return crypto.randomBytes(40).toString('hex');
};

// Static method to create refresh token
RefreshTokenSchema.statics.createToken = async function(userId, ipAddress) {
  const token = this.generateToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  const refreshToken = new this({
    token,
    user: userId,
    expiresAt,
    createdByIp: ipAddress
  });

  await refreshToken.save();
  return refreshToken;
};

// Static method to revoke all user tokens
RefreshTokenSchema.statics.revokeAllUserTokens = async function(userId, ipAddress) {
  return this.updateMany(
    { user: userId, isActive: true },
    { 
      $set: { 
        revokedAt: Date.now(), 
        revokedByIp: ipAddress,
        isActive: false
      } 
    }
  );
};

// Cleanup expired tokens (run periodically)
RefreshTokenSchema.statics.cleanupExpired = async function() {
  return this.deleteMany({
    expiresAt: { $lt: new Date() }
  });
};

module.exports = mongoose.model("RefreshToken", RefreshTokenSchema);
