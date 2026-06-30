// Security configuration and utilities

const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');

// Security headers middleware
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  crossOriginEmbedderPolicy: false,
});

// CORS configuration
// SECURITY FIX #9: Stricter CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400, // 24 hours
  optionsSuccessStatus: 200,
};

// MongoDB injection prevention
const mongoSanitizeConfig = {
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.warn(`Sanitized key: ${key} in request`);
  },
};

module.exports = {
  securityHeaders,
  corsOptions,
  mongoSanitize: () => mongoSanitize(mongoSanitizeConfig),
};
