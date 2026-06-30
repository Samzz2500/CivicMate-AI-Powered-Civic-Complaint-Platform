const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const cors = require("cors");
const dotenv = require("dotenv");
const multer = require("multer");
const fs = require("fs");
const { exec } = require("child_process");

// Load environment variables
dotenv.config();

// Import Swagger for API documentation
const swaggerUi = require('swagger-ui-express');
let swaggerSpec;
try {
  swaggerSpec = require('./config/swagger');
} catch (e) {
  console.log('Swagger documentation not available');
}

// Import middleware (with fallback if files don't exist)
let errorHandler, AppError, asyncHandler;
let apiLimiter, authLimiter, uploadLimiter, perUserUploadLimit;
let corsOptions, securityHeaders, mongoSanitize;
let logger;

try {
  const errorHandlerModule = require("./middleware/errorHandler");
  errorHandler = errorHandlerModule.errorHandler;
  AppError = errorHandlerModule.AppError;
  asyncHandler = errorHandlerModule.asyncHandler;
} catch (e) {
  console.log("Using fallback error handler");
  errorHandler = (err, req, res, next) => {
    res.status(err.statusCode || 500).json({ success: false, error: err.message || "Server error" });
  };
  AppError = class extends Error {
    constructor(message, statusCode) {
      super(message);
      this.statusCode = statusCode;
    }
  };
  asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

try {
  const rateLimiterModule = require("./middleware/rateLimiter");
  apiLimiter = rateLimiterModule.apiLimiter;
  authLimiter = rateLimiterModule.authLimiter;
  uploadLimiter = rateLimiterModule.uploadLimiter;
  perUserUploadLimit = rateLimiterModule.perUserUploadLimit;
} catch (e) {
  console.log("Rate limiter not available");
  apiLimiter = authLimiter = uploadLimiter = perUserUploadLimit = (req, res, next) => next();
}

try {
  const securityModule = require("./config/security");
  corsOptions = securityModule.corsOptions;
  securityHeaders = securityModule.securityHeaders;
  mongoSanitize = securityModule.mongoSanitize;
} catch (e) {
  console.log("Using default security settings");
  corsOptions = { origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true };
  securityHeaders = (req, res, next) => next();
  mongoSanitize = () => (req, res, next) => next();
}

try {
  logger = require("./utils/logger");
} catch (e) {
  console.log("Using console logger");
  logger = {
    info: console.log,
    error: console.error,
    warn: console.warn,
    debug: console.log
  };
}

// App instance
const app = express();

// Security middleware
if (securityHeaders) app.use(securityHeaders);
app.use(cors(corsOptions));
if (mongoSanitize) app.use(mongoSanitize());

// Body parsing middleware with size limits
// SECURITY FIX #8: Add request size limits to prevent DoS
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Rate limiting
if (apiLimiter) app.use("/api/", apiLimiter);
if (authLimiter) {
  app.use("/api/auth/login", authLimiter);
  app.use("/api/auth/register", authLimiter);
}

// Database connection with retry logic
const connectDB = async (retries = 5) => {
  const mongoUri = process.env.MONGO_URI;
  
  if (!mongoUri) {
    logger.error("MONGO_URI not defined in environment variables");
    process.exit(1);
  }

  for (let i = 0; i < retries; i++) {
    try {
      await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      logger.info(`MongoDB connected successfully`);
      
      // Create indexes after connection
      await createIndexes();
      return;
    } catch (err) {
      logger.error(`MongoDB connection attempt ${i + 1} failed:`, { error: err.message });
      if (i === retries - 1) {
        logger.error("Failed to connect to MongoDB after multiple attempts");
        process.exit(1);
      }
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5s before retry
    }
  }
};

// Create database indexes for performance
const createIndexes = async () => {
  try {
    const User = require("./models/User");
    const Tweet = require("./models/Tweet");

    await User.collection.createIndex({ username: 1 }, { unique: true });
    await User.collection.createIndex({ email: 1 }, { unique: true });
    await Tweet.collection.createIndex({ user: 1 });
    await Tweet.collection.createIndex({ createdAt: -1 });
    await Tweet.collection.createIndex({ category: 1 });
    await Tweet.collection.createIndex({ completed: 1 });
    
    logger.info("Database indexes created successfully");
  } catch (error) {
    logger.warn("Index creation warning:", { error: error.message });
  }
};

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads/";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${Date.now()}-${sanitizedName}`);
  },
});

const fileFilter = (req, file, cb) => {
  // SECURITY FIX #5: Enhanced file validation
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  
  const ext = path.extname(file.originalname).toLowerCase();
  const mimetype = file.mimetype.toLowerCase();
  
  // Check both MIME type and extension
  if (!allowedTypes.includes(mimetype)) {
    return cb(new AppError(`Invalid file type: ${mimetype}. Only JPEG, PNG, and WebP are allowed`, 400), false);
  }
  
  if (!allowedExtensions.includes(ext)) {
    return cb(new AppError(`Invalid file extension: ${ext}. Only .jpg, .jpeg, .png, .webp are allowed`, 400), false);
  }
  
  // Prevent double extensions (e.g., file.php.jpg)
  const filename = file.originalname.toLowerCase();
  const dangerousExtensions = ['.php', '.exe', '.sh', '.bat', '.cmd', '.js', '.html', '.htm'];
  for (const dangerousExt of dangerousExtensions) {
    if (filename.includes(dangerousExt)) {
      return cb(new AppError('Suspicious file name detected', 400), false);
    }
  }
  
  cb(null, true);
};

const upload = multer({
  storage,
  limits: { 
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1, // Only 1 file per request
    fields: 10, // Limit number of fields
    fileSize: 5 * 1024 * 1024 // Enforce file size limit
  },
  fileFilter,
});

// SECURITY FIX #5: Add multer error handler
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        success: false, 
        error: 'File too large. Maximum size is 5MB' 
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ 
        success: false, 
        error: 'Too many files. Only 1 file allowed per upload' 
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ 
        success: false, 
        error: 'Unexpected file field' 
      });
    }
    return res.status(400).json({ 
      success: false, 
      error: `Upload error: ${err.message}` 
    });
  }
  next(err);
});

// Image verification middleware using AI
const verifyImage = async (req, res, next) => {
  // Skip verification if configured
  if (process.env.NSFW_SKIP === 'true') {
    logger.warn("Image verification skipped (NSFW_SKIP=true)");
    return next();
  }

  if (!req.file) return next(); // Text-only tweet

  const filePath = path.join(__dirname, "uploads", req.file.filename).replace(/\\/g, '/');

  try {
    // Use AI verification instead of Python models
    const { verifyImageWithAI } = require('./utils/aiVerification');
    const aiResult = await verifyImageWithAI(filePath);
    
    logger.info("AI Verification Result:", aiResult);

    // Check for NSFW content
    if (aiResult.nsfw) {
      fs.unlinkSync(filePath);
      return res.status(403).json({
        success: false,
        error: "Content violates community guidelines",
        details: "Image contains inappropriate content"
      });
    }

    // Store AI prediction for use in tweet creation
    req.civicPrediction = {
      category: aiResult.category || 'others',
      confidence: aiResult.confidence || 0,
      civic: aiResult.civic !== false,
      source: aiResult.source || 'AI',
      description: aiResult.description || ''
    };
    
    next();
  } catch (err) {
    logger.error("AI Verification Error:", { error: err.message, file: filePath });
    
    // Fallback: allow image but log warning
    logger.warn("Using fallback verification - allowing image");
    req.civicPrediction = {
      category: 'others',
      confidence: 0,
      civic: true,
      source: 'fallback'
    };
    next();
  }
};

// Route imports
const authRoutes = require("./routes/auth");
const tweetRoutes = require("./routes/tweets");
const chatbotRoutes = require("./routes/chatbot");

// Import new routes if they exist
let tweetsExtended, profileRoutes, feedbackRoutes, notificationRoutes, analyticsRoutes;
let geolocationRoutes, adminRoutes, advancedAnalyticsRoutes, mobileApiRoutes, reportsRoutes, i18nRoutes, trackingRoutes;

try {
  tweetsExtended = require("./routes/tweets-extended");
  logger.info("Extended tweet routes loaded");
} catch (e) {
  logger.warn("Extended tweet routes not available");
}

try {
  profileRoutes = require("./routes/profile");
  logger.info("Profile routes loaded");
} catch (e) {
  logger.warn("Profile routes not available");
}

try {
  feedbackRoutes = require("./routes/feedback");
  logger.info("Feedback routes loaded");
} catch (e) {
  logger.warn("Feedback routes not available");
}

try {
  notificationRoutes = require("./routes/notifications");
  logger.info("Notification routes loaded");
} catch (e) {
  logger.warn("Notification routes not available");
}

try {
  analyticsRoutes = require("./routes/analytics");
  logger.info("Analytics routes loaded");
} catch (e) {
  logger.warn("Analytics routes not available");
}

try {
  geolocationRoutes = require("./routes/geolocation");
  logger.info("Geolocation routes loaded");
} catch (e) {
  logger.warn("Geolocation routes not available");
}

try {
  adminRoutes = require("./routes/admin");
  logger.info("Admin routes loaded");
} catch (e) {
  logger.warn("Admin routes not available");
}

// Phase 4: Advanced Features
try {
  advancedAnalyticsRoutes = require("./routes/advancedAnalytics");
  logger.info("Advanced analytics routes loaded");
} catch (e) {
  logger.warn("Advanced analytics routes not available");
}

try {
  mobileApiRoutes = require("./routes/mobileApi");
  logger.info("Mobile API routes loaded");
} catch (e) {
  logger.warn("Mobile API routes not available");
}

try {
  reportsRoutes = require("./routes/reports");
  logger.info("Reports routes loaded");
} catch (e) {
  logger.warn("Reports routes not available");
}

try {
  i18nRoutes = require("./routes/i18n");
  logger.info("i18n routes loaded");
} catch (e) {
  logger.warn("i18n routes not available");
}

try {
  trackingRoutes = require("./routes/tracking");
  logger.info("Tracking routes loaded");
} catch (e) {
  logger.warn("Tracking routes not available");
}

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/tweets", uploadLimiter || ((req, res, next) => next()), tweetRoutes(upload, verifyImage));
app.use("/api/chatbot", chatbotRoutes);

// Add new routes if available
if (tweetsExtended) {
  app.use("/api/tweets", tweetsExtended);
}
if (profileRoutes) {
  app.use("/api/auth/profile", profileRoutes);
}
if (feedbackRoutes) {
  app.use("/api/feedback", feedbackRoutes);
  logger.info("✅ Feedback API available at /api/feedback");
}
if (notificationRoutes) {
  app.use("/api/notifications", notificationRoutes);
  logger.info("✅ Notifications API available at /api/notifications");
}
if (analyticsRoutes) {
  app.use("/api/analytics", analyticsRoutes);
  logger.info("✅ Analytics API available at /api/analytics");
}
if (geolocationRoutes) {
  app.use("/api/geolocation", geolocationRoutes);
  logger.info("✅ Geolocation API available at /api/geolocation");
}
if (adminRoutes) {
  app.use("/api/admin", adminRoutes);
  logger.info("✅ Admin API available at /api/admin");
}

// Phase 4: Advanced Features Routes
if (advancedAnalyticsRoutes) {
  app.use("/api/advanced-analytics", advancedAnalyticsRoutes);
  logger.info("✅ Advanced Analytics API available at /api/advanced-analytics");
}
if (mobileApiRoutes) {
  app.use("/api/mobile", mobileApiRoutes);
  logger.info("✅ Mobile API available at /api/mobile");
}
if (reportsRoutes) {
  app.use("/api/reports", reportsRoutes);
  logger.info("✅ Reports API available at /api/reports");
}
if (i18nRoutes) {
  app.use("/api/i18n", i18nRoutes);
  logger.info("✅ i18n API available at /api/i18n");
}
if (trackingRoutes) {
  app.use("/api/tracking", trackingRoutes);
  logger.info("✅ Tracking API available at /api/tracking");
}

// API Documentation (Swagger)
if (swaggerSpec) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'CivicMate API Documentation'
  }));
  logger.info('📚 API Documentation available at /api-docs');
}

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    success: true,
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// 404 handler
app.use((req, res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
});

// Global error handler (must be last)
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  mongoose.connection.close(() => {
    logger.info('MongoDB connection closed');
    process.exit(0);
  });
});

// Start server
const PORT = process.env.PORT || 5000;
const startServer = async () => {
  // SECURITY FIX #4: Validate JWT_SECRET before starting server
  if (!process.env.JWT_SECRET) {
    logger.error("CRITICAL: JWT_SECRET is not defined in environment variables");
    console.error("❌ CRITICAL ERROR: JWT_SECRET must be defined in .env file");
    console.error("   Generate a strong secret: node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\"");
    process.exit(1);
  }
  
  if (process.env.JWT_SECRET.length < 32) {
    logger.error("CRITICAL: JWT_SECRET is too short (minimum 32 characters required)");
    console.error("❌ CRITICAL ERROR: JWT_SECRET must be at least 32 characters long");
    console.error("   Current length:", process.env.JWT_SECRET.length);
    console.error("   Generate a strong secret: node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\"");
    process.exit(1);
  }
  
  logger.info("✅ JWT_SECRET validated successfully");
  
  await connectDB();
  const server = app.listen(PORT, () => {
    logger.info(`Server running on http://localhost:${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  });

  // Initialize Socket.io
  try {
    const { initializeSocket } = require('./config/socket');
    initializeSocket(server);
    logger.info('✅ Socket.io initialized');
    console.log(`🔌 Socket.io ready for real-time connections`);
  } catch (error) {
    logger.warn('Socket.io initialization failed', { error: error.message });
    console.log(`⚠️  Socket.io not available`);
  }

  // Initialize Email Service
  try {
    const { initializeEmailService } = require('./utils/emailService');
    const emailInitialized = initializeEmailService();
    if (emailInitialized) {
      logger.info('✅ Email service initialized');
      console.log(`📧 Email notifications ready`);
    }
  } catch (error) {
    logger.warn('Email service initialization failed', { error: error.message });
    console.log(`⚠️  Email service not available`);
  }

  // Initialize SMS Service
  try {
    const { initializeSMSService } = require('./utils/smsService');
    const smsInitialized = initializeSMSService();
    if (smsInitialized) {
      logger.info('✅ SMS service initialized');
      console.log(`📱 SMS notifications ready`);
    }
  } catch (error) {
    logger.warn('SMS service initialization failed', { error: error.message });
    console.log(`⚠️  SMS service not available`);
  }

  // Initialize Background Jobs
  try {
    const { initializeQueues, scheduleRecurringJobs } = require('./jobs/queueManager');
    const queuesInitialized = initializeQueues();
    if (queuesInitialized) {
      scheduleRecurringJobs();
      logger.info('✅ Background jobs initialized');
      console.log(`⚙️  Background jobs ready`);
    }
  } catch (error) {
    logger.warn('Background jobs initialization failed', { error: error.message });
    console.log(`⚠️  Background jobs not available`);
  }

  // Initialize Cache Service
  try {
    const { initializeCache } = require('./utils/cacheService');
    const cacheInitialized = await initializeCache();
    if (cacheInitialized) {
      logger.info('✅ Cache service initialized');
      console.log(`💾 Redis cache ready`);
    }
  } catch (error) {
    logger.warn('Cache service initialization failed', { error: error.message });
    console.log(`⚠️  Cache service not available`);
  }

  // Initialize Geolocation Service
  try {
    const { initializeGeolocation } = require('./utils/geolocationService');
    const geoInitialized = initializeGeolocation();
    if (geoInitialized) {
      logger.info('✅ Geolocation service initialized');
      console.log(`🗺️  Geolocation ready`);
    }
  } catch (error) {
    logger.warn('Geolocation service initialization failed', { error: error.message });
    console.log(`⚠️  Geolocation not available`);
  }

  // Initialize Image Optimizer
  try {
    const { initializeImageOptimizer } = require('./utils/imageOptimizer');
    const imageOptimizerInitialized = initializeImageOptimizer();
    if (imageOptimizerInitialized) {
      logger.info('✅ Image optimizer initialized');
      console.log(`🖼️  Image optimization ready`);
    }
  } catch (error) {
    logger.warn('Image optimizer initialization failed', { error: error.message });
    console.log(`⚠️  Image optimizer not available`);
  }

  console.log(`\n`);

  return server;
};

startServer().catch(err => {
  logger.error("Failed to start server:", { error: err.message });
  console.error("Failed to start server:", err.message);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  
  try {
    const { closeQueues } = require('./jobs/queueManager');
    await closeQueues();
  } catch (error) {
    logger.warn('Error closing queues', { error: error.message });
  }

  try {
    const { closeCache } = require('./utils/cacheService');
    await closeCache();
  } catch (error) {
    logger.warn('Error closing cache', { error: error.message });
  }
  
  mongoose.connection.close(() => {
    logger.info('MongoDB connection closed');
    process.exit(0);
  });
});

// Export app for testing
module.exports = app;
