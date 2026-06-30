const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const RefreshToken = require("../models/RefreshToken");
const { authMiddleware, adminMiddleware } = require("../middleware/auth");
const Tweet = require("../models/Tweet");
const { validateRegister, validateLogin } = require("../middleware/validation");
const { asyncHandler, AppError } = require("../middleware/errorHandler");
const logger = require("../utils/logger");
const router = express.Router();

// Helper function to generate tokens
const generateTokens = async (userId, ipAddress) => {
  // Generate access token (15 minutes)
  const accessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });

  // Generate refresh token (7 days)
  const refreshToken = await RefreshToken.createToken(userId, ipAddress);

  return {
    accessToken,
    refreshToken: refreshToken.token,
    accessTokenExpires: new Date(Date.now() + 15 * 60 * 1000),
    refreshTokenExpires: refreshToken.expiresAt
  };
};

// Helper to get client IP
const getClientIp = (req) => {
  return req.headers['x-forwarded-for']?.split(',')[0] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress;
};

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *               - firstname
 *               - lastname
 *             properties:
 *               username:
 *                 type: string
 *                 example: johndoe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password123
 *               firstname:
 *                 type: string
 *                 example: John
 *               lastname:
 *                 type: string
 *                 example: Doe
 *               city:
 *                 type: string
 *                 example: Mumbai
 *               state:
 *                 type: string
 *                 example: Maharashtra
 *               pincode:
 *                 type: string
 *                 example: 400001
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *                 example: user
 *               adminSecret:
 *                 type: string
 *                 description: Required only for admin registration
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: User registered successfully
 *       400:
 *         description: Bad request (username exists, validation failed)
 *       403:
 *         description: Invalid admin secret
 */
router.post("/register", validateRegister, asyncHandler(async (req, res) => {
  const {
    username,
    email,
    password,
    firstname,
    lastname,
    city,
    state,
    pincode,
    role,
    adminSecret,
  } = req.body;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }

    if (role === "admin") {
      if (adminSecret !== process.env.ADMIN_SECRET) {
        return res.status(403).json({
          message: "Invalid admin secret",
        });
      }
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      firstname,
      lastname,
      city,
      state,
      pincode,
      role: role || "user",
    });

    // Save the user to the database
    await newUser.save();
    logger.info("User registered successfully", { username, email });
    res.status(201).json({ success: true, message: "User registered successfully" });
  } catch (error) {
    logger.error("Registration error", { error: error.message, username });
    throw error;
  }
}));

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: johndoe
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 token:
 *                   type: string
 *                   description: JWT token
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid credentials
 */
router.post("/login", validateLogin, asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check if user exists
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(423).json({ 
        message: "Account is temporarily locked due to multiple failed login attempts. Please try again later.",
        lockUntil: user.lockUntil
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // Increment login attempts
      await user.incLoginAttempts();
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Reset login attempts on successful login
    if (user.loginAttempts > 0) {
      await user.resetLoginAttempts();
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    const ipAddress = getClientIp(req);
    const tokens = await generateTokens(user._id, ipAddress);

    logger.info("User logged in successfully", { username: user.username });

    // Send response with tokens and user info
    res.json({
      success: true,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      accessTokenExpires: tokens.accessTokenExpires,
      refreshTokenExpires: tokens.refreshTokenExpires,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        firstname: user.firstname,
        lastname: user.lastname
      },
    });
  } catch (error) {
    logger.error("Login error", { error: error.message });
    throw error;
  }
}));

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized (no token or invalid token)
 */
router.get("/profile", authMiddleware, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select("-password"); // Exclude password
  res.json({ success: true, user });
}));

// Get tweets for a specific user
router.get("/tweets/user", authMiddleware, asyncHandler(async (req, res) => {
  const tweets = await Tweet.find({ user: req.user.id }).populate(
    "user",
    "username"
  );
  res.json({ success: true, tweets });
}));

router.patch(
  "/tweetCompleted/:tweetId",
  authMiddleware,
  adminMiddleware,
  asyncHandler(async (req, res) => {
    const tweet = await Tweet.findById(req.params.tweetId);

    if (!tweet) {
      return res.status(404).json({ success: false, message: "Tweet not found" });
    }

    const updatedTweet = await Tweet.findByIdAndUpdate(
      req.params.tweetId, 
      req.body, 
      { new: true }
    );

    logger.info("Tweet status updated", { tweetId: req.params.tweetId, admin: req.user.id });
    res.status(200).json({ success: true, tweet: updatedTweet });
  })
);

router.delete(
  "/tweetDeleted/:tweetId",
  authMiddleware,
  adminMiddleware,
  asyncHandler(async (req, res) => {
    const tweet = await Tweet.findById(req.params.tweetId);

    if (!tweet) {
      return res.status(404).json({ success: false, message: "Tweet not found" });
    }

    await Tweet.findByIdAndDelete(req.params.tweetId);

    logger.info("Tweet deleted by admin", { tweetId: req.params.tweetId, admin: req.user.id });
    res.status(200).json({ success: true, message: "Tweet deleted" });
  })
);

// Forgot Password - Send reset link via email
router.post("/forgot-password", asyncHandler(async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found with this email" });
    }

    // Generate reset token (valid for 1 hour)
    const resetToken = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Create reset link
    const resetLink = `http://localhost:3000/reset-password/${resetToken}`;

    // Send email using nodemailer
    const nodemailer = require("nodemailer");

    // Configure email transporter (using Gmail as example)
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // Your email
        pass: process.env.EMAIL_PASS, // Your email app password
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset Request - CivicMate",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #007bff;">Password Reset Request</h2>
          <p>Hello ${user.firstname},</p>
          <p>You requested to reset your password for your CivicMate account.</p>
          <p>Click the button below to reset your password:</p>
          <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">Reset Password</a>
          <p>Or copy and paste this link in your browser:</p>
          <p style="color: #666; word-break: break-all;">${resetLink}</p>
          <p style="color: #dc3545; margin-top: 20px;">This link will expire in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
          <p style="color: #666; font-size: 12px;">CivicMate - AI Driven City Grievances</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    logger.info("Password reset email sent", { email });
    res.status(200).json({ success: true, message: "Password reset link sent to your email" });
  } catch (error) {
    logger.error("Forgot password error", { error: error.message, email });
    throw error;
  }
}));

// Reset Password - Update password with token
router.post("/reset-password/:token", asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    user.password = hashedPassword;
    await user.save();

    logger.info("Password reset successful", { userId: user._id });
    res.status(200).json({ success: true, message: "Password reset successful" });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(400).json({ success: false, message: "Reset link has expired" });
    }
    logger.error("Reset password error", { error: error.message });
    throw error;
  }
}));


module.exports = router;

/**
 * @swagger
 * /api/auth/refresh-token:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Refresh token received during login
 *     responses:
 *       200:
 *         description: New access token generated
 *       401:
 *         description: Invalid or expired refresh token
 */
router.post("/refresh-token", asyncHandler(async (req, res) => {
  const { refreshToken: token } = req.body;

  if (!token) {
    throw new AppError("Refresh token is required", 400);
  }

  const refreshToken = await RefreshToken.findOne({ token }).populate('user');

  if (!refreshToken || !refreshToken.isValid) {
    throw new AppError("Invalid or expired refresh token", 401);
  }

  const user = refreshToken.user;

  // Generate new tokens
  const ipAddress = getClientIp(req);
  
  // Revoke old refresh token
  await refreshToken.revoke(ipAddress);
  
  // Create new tokens
  const tokens = await generateTokens(user._id, ipAddress);

  logger.info("Token refreshed", { userId: user._id });

  res.json({
    success: true,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    accessTokenExpires: tokens.accessTokenExpires,
    refreshTokenExpires: tokens.refreshTokenExpires
  });
}));

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user (revoke refresh token)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
router.post("/logout", authMiddleware, asyncHandler(async (req, res) => {
  const { refreshToken: token } = req.body;
  const ipAddress = getClientIp(req);

  if (token) {
    // Revoke specific refresh token
    const refreshToken = await RefreshToken.findOne({ token, user: req.user.id });
    if (refreshToken) {
      await refreshToken.revoke(ipAddress);
    }
  } else {
    // Revoke all user's refresh tokens
    await RefreshToken.revokeAllUserTokens(req.user.id, ipAddress);
  }

  logger.info("User logged out", { userId: req.user.id });

  res.json({
    success: true,
    message: "Logged out successfully"
  });
}));

/**
 * @swagger
 * /api/auth/sessions:
 *   get:
 *     summary: Get active sessions (refresh tokens)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active sessions retrieved
 */
router.get("/sessions", authMiddleware, asyncHandler(async (req, res) => {
  const sessions = await RefreshToken.find({
    user: req.user.id,
    isActive: true,
    expiresAt: { $gt: new Date() }
  }).select('createdByIp createdAt expiresAt').sort({ createdAt: -1 });

  res.json({
    success: true,
    sessions
  });
}));

/**
 * @swagger
 * /api/auth/sessions/{tokenId}:
 *   delete:
 *     summary: Revoke specific session
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tokenId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Session revoked
 */
router.delete("/sessions/:tokenId", authMiddleware, asyncHandler(async (req, res) => {
  const refreshToken = await RefreshToken.findOne({
    _id: req.params.tokenId,
    user: req.user.id
  });

  if (!refreshToken) {
    throw new AppError("Session not found", 404);
  }

  const ipAddress = getClientIp(req);
  await refreshToken.revoke(ipAddress);

  logger.info("Session revoked", { userId: req.user.id, tokenId: req.params.tokenId });

  res.json({
    success: true,
    message: "Session revoked successfully"
  });
}));
