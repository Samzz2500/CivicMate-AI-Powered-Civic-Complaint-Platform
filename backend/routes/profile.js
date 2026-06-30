// Additional profile routes for update, password change, and deletion
const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Tweet = require("../models/Tweet");
const { authMiddleware } = require("../middleware/auth");
const { asyncHandler, AppError } = require("../middleware/errorHandler");
const { sanitizeString } = require("../middleware/validation");
const logger = require("../utils/logger");
const router = express.Router();

// Update user profile
router.patch("/", authMiddleware, asyncHandler(async (req, res) => {
  const { firstname, lastname, city, state, pincode } = req.body;
  
  const updateData = {};
  if (firstname) updateData.firstname = sanitizeString(firstname);
  if (lastname) updateData.lastname = sanitizeString(lastname);
  if (city) updateData.city = sanitizeString(city);
  if (state) updateData.state = sanitizeString(state);
  if (pincode) updateData.pincode = sanitizeString(pincode);

  const user = await User.findByIdAndUpdate(
    req.user.id,
    updateData,
    { new: true, runValidators: true }
  ).select("-password");

  logger.info("Profile updated", { userId: req.user.id });
  res.json({ success: true, user });
}));

// Change password
router.post("/change-password", authMiddleware, asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new AppError("Current and new password are required", 400);
  }

  if (newPassword.length < 6) {
    throw new AppError("New password must be at least 6 characters", 400);
  }

  const user = await User.findById(req.user.id);
  const isMatch = await bcrypt.compare(currentPassword, user.password);

  if (!isMatch) {
    throw new AppError("Current password is incorrect", 400);
  }

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();

  logger.info("Password changed", { userId: req.user.id });
  res.json({ success: true, message: "Password changed successfully" });
}));

// Delete user account
router.delete("/", authMiddleware, asyncHandler(async (req, res) => {
  const { password } = req.body;

  if (!password) {
    throw new AppError("Password is required to delete account", 400);
  }

  const user = await User.findById(req.user.id);
  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new AppError("Password is incorrect", 400);
  }

  // Delete all user's tweets
  await Tweet.deleteMany({ user: req.user.id });

  // Delete user
  await User.findByIdAndDelete(req.user.id);

  logger.info("User account deleted", { userId: req.user.id });
  res.json({ success: true, message: "Account deleted successfully" });
}));

module.exports = router;
