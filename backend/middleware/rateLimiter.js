// Rate limiting middleware to prevent abuse

const rateLimit = require('express-rate-limit');

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased for development - Limit each IP to 1000 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict limiter for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 attempts per windowMs (increased for testing)
  skipSuccessfulRequests: true,
  message: {
    success: false,
    error: 'Too many login attempts, please try again after 15 minutes',
  },
});

// Upload limiter
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // Increased for development - 50 uploads per hour
  skipSuccessfulRequests: false,
  message: {
    success: false,
    error: 'Too many uploads, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// SECURITY FIX #10: Per-user upload tracking
const userUploadTracker = new Map();

const perUserUploadLimit = (req, res, next) => {
  if (!req.user) return next();
  
  const userId = req.user.id.toString();
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  
  // Clean up old entries
  if (userUploadTracker.size > 10000) {
    userUploadTracker.clear();
  }
  
  if (!userUploadTracker.has(userId)) {
    userUploadTracker.set(userId, []);
  }
  
  // Filter uploads within last hour
  const uploads = userUploadTracker.get(userId).filter(time => now - time < oneHour);
  
  if (uploads.length >= 20) { // Increased for development
    return res.status(429).json({
      success: false,
      error: 'You have reached your upload limit (20 per hour). Please try again later.'
    });
  }
  
  uploads.push(now);
  userUploadTracker.set(userId, uploads);
  next();
};

module.exports = { apiLimiter, authLimiter, uploadLimiter, perUserUploadLimit };
