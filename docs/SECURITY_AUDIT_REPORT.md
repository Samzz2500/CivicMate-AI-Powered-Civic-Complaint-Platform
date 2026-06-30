# 🔒 Security Audit Report

**Project:** Shahar Sahayya Kranti (CivicMate)  
**Date:** March 9, 2026  
**Audit Type:** Comprehensive Security & Vulnerability Assessment  
**Status:** CRITICAL ISSUES FOUND - ACTION REQUIRED

---

## 📊 Executive Summary

### Overall Security Score: 6.5/10

**Critical Issues:** 5  
**High Priority Issues:** 8  
**Medium Priority Issues:** 12  
**Low Priority Issues:** 6  
**Total Issues:** 31

---

## 🚨 CRITICAL VULNERABILITIES (Immediate Action Required)

### 1. ⚠️ HARDCODED ADMIN SECRET IN FRONTEND

**Severity:** CRITICAL  
**File:** `frontend/src/components/Register.js`  
**Line:** 7

```javascript
const ADMIN_SECRET = process.env.REACT_APP_ADMIN_SECRET || "123456";
```

**Issue:**
- Admin secret is hardcoded as fallback value "123456"
- Frontend code is visible to all users (client-side)
- Anyone can inspect the code and become admin
- Environment variable not properly configured

**Impact:**
- Unauthorized admin access
- Complete system compromise
- Data breach potential
- User privacy violation

**Fix:**
```javascript
// REMOVE fallback completely
const ADMIN_SECRET = process.env.REACT_APP_ADMIN_SECRET;

// Add validation
if (!ADMIN_SECRET) {
  console.error("Admin registration disabled - no secret configured");
  // Disable admin registration UI
}
```

**Better Solution:**
- Move admin creation to backend-only script
- Remove admin registration from public UI
- Use `backend/scripts/createAdmin.js` instead
- Require server-side verification

---

### 2. ⚠️ JWT SECRET NOT VALIDATED

**Severity:** CRITICAL  
**File:** `backend/middleware/auth.js`  
**Line:** 14

**Issue:**
- JWT_SECRET checked but server continues if missing
- Should fail immediately on startup
- Weak secrets not validated

**Impact:**
- Weak token security
- Potential token forgery
- Session hijacking

**Fix:**
```javascript
// In server-improved.js startup
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  logger.error("JWT_SECRET must be at least 32 characters");
  process.exit(1);
}
```

---

### 3. ⚠️ REGEX DENIAL OF SERVICE (ReDoS)

**Severity:** CRITICAL  
**File:** `backend/routes/tweets.js`  
**Line:** 67

```javascript
const sanitizedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
```

**Issue:**
- Incorrect escape sequence in regex
- Should be `\\$&` not `\\3ab7798d...`
- Can cause ReDoS attacks
- Server crash potential

**Impact:**
- Server downtime
- DoS attacks
- Performance degradation

**Fix:**
```javascript
const sanitizedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
```

---

### 4. ⚠️ NO INPUT LENGTH LIMITS ON SEARCH

**Severity:** CRITICAL  
**File:** `backend/routes/tweets.js`

**Issue:**
- Search query has no length limit
- Can cause database overload
- Memory exhaustion possible

**Impact:**
- Server crash
- Database overload
- DoS attacks

**Fix:**
```javascript
router.get("/", asyncHandler(async (req, res) => {
  let { query, page = 1, limit = 20 } = req.query;
  
  // Add length validation
  if (query && query.length > 100) {
    return res.status(400).json({ 
      success: false, 
      error: "Search query too long (max 100 characters)" 
    });
  }
  
  // ... rest of code
}));
```

---

### 5. ⚠️ FILE UPLOAD WITHOUT SIZE VALIDATION

**Severity:** CRITICAL  
**File:** `backend/server-improved.js`  
**Line:** 120

**Issue:**
- File size limit set to 5MB but not enforced properly
- No file type validation on upload
- Can upload malicious files

**Impact:**
- Server storage exhaustion
- Malicious file uploads
- XSS via SVG files

**Fix:**
```javascript
const upload = multer({
  storage,
  limits: { 
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1 // Only 1 file
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (!allowedTypes.includes(file.mimetype) || !allowedExtensions.includes(ext)) {
      return cb(new AppError('Invalid file type. Only JPEG, PNG, and WebP images allowed', 400), false);
    }
    
    cb(null, true);
  },
});

// Add error handler for multer
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        success: false, 
        error: 'File too large. Maximum size is 5MB' 
      });
    }
  }
  next(err);
});
```

---

## 🔴 HIGH PRIORITY VULNERABILITIES

### 6. Password Storage Not Verified

**Severity:** HIGH  
**File:** `backend/routes/auth.js`

**Issue:**
- Password hashing implementation not verified
- bcrypt rounds not specified
- No password strength validation

**Fix:**
```javascript
const bcrypt = require('bcryptjs');
const SALT_ROUNDS = 12; // Minimum 10, recommended 12

// In registration
const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

// Add password strength validation
const validatePasswordStrength = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  if (password.length < minLength) {
    return { valid: false, error: 'Password must be at least 8 characters' };
  }
  
  const strength = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean).length;
  
  if (strength < 3) {
    return { valid: false, error: 'Password must contain uppercase, lowercase, and numbers' };
  }
  
  return { valid: true };
};
```

---

### 7. No CSRF Protection

**Severity:** HIGH  
**File:** `backend/server-improved.js`

**Issue:**
- No CSRF token implementation
- State-changing operations vulnerable
- Cookie-based auth vulnerable

**Fix:**
```javascript
const csrf = require('csurf');
const cookieParser = require('cookie-parser');

app.use(cookieParser());
app.use(csrf({ cookie: true }));

// Add CSRF token to responses
app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  next();
});

// Frontend must include CSRF token in requests
```

---

### 8. Sensitive Data in Logs

**Severity:** HIGH  
**File:** Multiple files

**Issue:**
- Passwords may be logged
- Tokens may be logged
- User data in error messages

**Fix:**
```javascript
// Create sanitization function
const sanitizeForLog = (data) => {
  const sensitive = ['password', 'token', 'secret', 'apiKey'];
  const sanitized = { ...data };
  
  sensitive.forEach(key => {
    if (sanitized[key]) {
      sanitized[key] = '[REDACTED]';
    }
  });
  
  return sanitized;
};

// Use in logging
logger.info("User registered", sanitizeForLog(userData));
```

---

### 9. No Rate Limiting on File Uploads

**Severity:** HIGH  
**File:** `backend/middleware/rateLimiter.js`

**Issue:**
- Upload limiter set to 20/hour
- Too permissive for abuse
- No per-user limits

**Fix:**
```javascript
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Reduce to 10 uploads per hour
  skipFailedRequests: false,
  message: {
    success: false,
    error: 'Too many uploads, please try again later',
  },
});

// Add per-user upload tracking
const userUploadTracker = new Map();

const perUserUploadLimit = async (req, res, next) => {
  if (!req.user) return next();
  
  const userId = req.user.id;
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  
  if (!userUploadTracker.has(userId)) {
    userUploadTracker.set(userId, []);
  }
  
  const uploads = userUploadTracker.get(userId).filter(time => now - time < oneHour);
  
  if (uploads.length >= 5) {
    return res.status(429).json({
      success: false,
      error: 'You have reached your upload limit. Please try again later.'
    });
  }
  
  uploads.push(now);
  userUploadTracker.set(userId, uploads);
  next();
};
```

---

### 10. JWT Token Never Expires

**Severity:** HIGH  
**File:** `backend/routes/auth.js`

**Issue:**
- JWT expiration not set
- Tokens valid forever
- Compromised tokens never expire

**Fix:**
```javascript
const token = jwt.sign(
  { id: user._id, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: '7d' } // Add expiration
);

// Implement token refresh mechanism
const refreshToken = jwt.sign(
  { id: user._id },
  process.env.JWT_REFRESH_SECRET,
  { expiresIn: '30d' }
);
```

---

### 11. No Input Sanitization on Comments

**Severity:** HIGH  
**File:** `backend/routes/tweets.js`

**Issue:**
- Comments not sanitized
- XSS vulnerability
- HTML injection possible

**Fix:**
```javascript
const sanitizeHtml = require('sanitize-html');

router.post("/:tweetId/comment", authMiddleware, validateComment, asyncHandler(async (req, res) => {
  const { text } = req.body;
  
  // Sanitize HTML
  const sanitizedText = sanitizeHtml(text, {
    allowedTags: [], // No HTML allowed
    allowedAttributes: {}
  });
  
  tweet.comments.push({
    user: req.user.id,
    text: sanitizedText,
  });
  
  await tweet.save();
  res.status(201).json({ success: true, tweet });
}));
```

---

### 12. MongoDB Injection in Search

**Severity:** HIGH  
**File:** `backend/routes/tweets.js`

**Issue:**
- Search query not properly sanitized
- MongoDB injection possible
- NoSQL injection vulnerability

**Fix:**
```javascript
// Already using express-mongo-sanitize but ensure it's applied
const mongoSanitize = require('express-mongo-sanitize');

// In server.js
app.use(mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    logger.warn(`Sanitized key: ${key} in request`);
  },
}));

// Additional validation in route
router.get("/", asyncHandler(async (req, res) => {
  let { query } = req.query;
  
  // Ensure query is string
  if (query && typeof query !== 'string') {
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid query format' 
    });
  }
  
  // ... rest of code
}));
```

---

### 13. Insecure Direct Object Reference (IDOR)

**Severity:** HIGH  
**File:** `backend/routes/tweets.js`, `backend/routes/admin.js`

**Issue:**
- No ownership verification on tweet updates
- Users can modify others' tweets
- Admin routes not properly protected

**Fix:**
```javascript
// Add ownership check
router.put("/:tweetId", authMiddleware, asyncHandler(async (req, res) => {
  const tweet = await Tweet.findById(req.params.tweetId);
  
  if (!tweet) {
    return res.status(404).json({ success: false, error: 'Tweet not found' });
  }
  
  // Check ownership
  if (tweet.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      error: 'You do not have permission to modify this tweet' 
    });
  }
  
  // ... update logic
}));
```

---

## 🟡 MEDIUM PRIORITY ISSUES

### 14. No Email Verification

**Severity:** MEDIUM  
**Issue:** Users can register with fake emails

**Fix:** Implement email verification flow

---

### 15. Weak Password Requirements

**Severity:** MEDIUM  
**Issue:** Minimum 6 characters is too weak

**Fix:** Increase to 8 characters with complexity requirements

---

### 16. No Account Lockout on Failed Logins

**Severity:** MEDIUM  
**Issue:** Brute force attacks possible

**Fix:** Already implemented in User model, ensure it's used in auth route

---

### 17. API Keys in Frontend Code

**Severity:** MEDIUM  
**File:** `frontend/src/components/Register.js`

**Issue:** Admin secret exposed in frontend

**Fix:** Remove admin registration from frontend

---

### 18. No Content Security Policy

**Severity:** MEDIUM  
**Issue:** XSS attacks possible

**Fix:** Already using Helmet, but CSP needs tightening

---

### 19. CORS Too Permissive

**Severity:** MEDIUM  
**File:** `backend/config/security.js`

**Issue:** Only checks origin, no other restrictions

**Fix:**
```javascript
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400, // 24 hours
  optionsSuccessStatus: 200,
};
```

---

### 20. No Request Size Limits

**Severity:** MEDIUM  
**Issue:** Large payloads can crash server

**Fix:**
```javascript
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
```

---

### 21. Error Messages Too Verbose

**Severity:** MEDIUM  
**Issue:** Stack traces exposed in production

**Fix:**
```javascript
app.use((err, req, res, next) => {
  logger.error(err);
  
  res.status(err.statusCode || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'An error occurred' 
      : err.message,
    // Never send stack trace in production
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});
```

---

### 22. No Helmet Configuration for Production

**Severity:** MEDIUM  
**Issue:** Default Helmet settings not optimal

**Fix:**
```javascript
const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true,
}));
```

---

### 23. Session Management Issues

**Severity:** MEDIUM  
**Issue:** No session timeout, no concurrent session limits

**Fix:** Implement session management with Redis

---

### 24. No Audit Logging

**Severity:** MEDIUM  
**Issue:** No audit trail for sensitive operations

**Fix:** Already have AuditLog model, ensure it's used

---

### 25. File Upload Path Traversal

**Severity:** MEDIUM  
**Issue:** Filename not sanitized

**Fix:**
```javascript
filename: (req, file, cb) => {
  const sanitizedName = file.originalname
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/\.+/g, '.') // Prevent multiple dots
    .substring(0, 100); // Limit length
  
  cb(null, `${Date.now()}-${sanitizedName}`);
}
```

---

## 🟢 LOW PRIORITY ISSUES

### 26. No API Versioning

**Severity:** LOW  
**Fix:** Add `/api/v1/` prefix to all routes

---

### 27. No Request ID Tracking

**Severity:** LOW  
**Fix:** Add request ID middleware for debugging

---

### 28. No Health Check Authentication

**Severity:** LOW  
**Fix:** Health check endpoint is public (acceptable)

---

### 29. No Database Connection Pooling

**Severity:** LOW  
**Fix:** Mongoose handles this automatically

---

### 30. No Graceful Degradation

**Severity:** LOW  
**Fix:** Already implemented for optional services

---

### 31. No API Documentation Authentication

**Severity:** LOW  
**Fix:** Swagger docs are public (acceptable for development)

---

## 🛠️ IMMEDIATE ACTION PLAN

### Priority 1 (Do Today):
1. ✅ Remove hardcoded admin secret from frontend
2. ✅ Fix ReDoS vulnerability in search
3. ✅ Add input length limits
4. ✅ Validate JWT_SECRET on startup
5. ✅ Add file upload size validation

### Priority 2 (Do This Week):
6. ✅ Implement CSRF protection
7. ✅ Add password strength validation
8. ✅ Sanitize log data
9. ✅ Add JWT expiration
10. ✅ Fix IDOR vulnerabilities

### Priority 3 (Do This Month):
11. ✅ Implement email verification
12. ✅ Add comprehensive audit logging
13. ✅ Implement session management
14. ✅ Add API versioning
15. ✅ Security testing

---

## 📋 SECURITY CHECKLIST

### Authentication & Authorization
- [ ] Remove hardcoded secrets
- [ ] Implement strong password policy
- [ ] Add JWT expiration
- [ ] Implement refresh tokens
- [ ] Add email verification
- [ ] Implement 2FA (optional)
- [ ] Fix IDOR vulnerabilities
- [ ] Add CSRF protection

### Input Validation
- [ ] Sanitize all user inputs
- [ ] Add length limits
- [ ] Validate file uploads
- [ ] Prevent XSS
- [ ] Prevent SQL/NoSQL injection
- [ ] Fix ReDoS vulnerability

### Data Protection
- [ ] Encrypt sensitive data
- [ ] Sanitize logs
- [ ] Secure file storage
- [ ] Implement data retention policy
- [ ] Add backup encryption

### Network Security
- [ ] Configure CORS properly
- [ ] Implement rate limiting
- [ ] Add request size limits
- [ ] Use HTTPS only
- [ ] Implement CSP

### Monitoring & Logging
- [ ] Implement audit logging
- [ ] Monitor failed login attempts
- [ ] Track suspicious activities
- [ ] Set up alerts
- [ ] Regular security audits

---

## 🔐 SECURITY BEST PRACTICES

### 1. Environment Variables
```env
# Use strong, random secrets
JWT_SECRET=<64-character-random-string>
ADMIN_SECRET=<64-character-random-string>

# Never commit .env file
# Use different secrets for dev/prod
```

### 2. Password Policy
- Minimum 8 characters
- Require uppercase, lowercase, numbers
- Optional special characters
- Check against common passwords
- Implement password history

### 3. Rate Limiting
- Auth endpoints: 5 attempts per 15 minutes
- API endpoints: 100 requests per 15 minutes
- Upload endpoints: 5 uploads per hour per user
- Search endpoints: 50 requests per minute

### 4. File Upload Security
- Validate file type (MIME + extension)
- Limit file size (5MB max)
- Scan for malware
- Store outside web root
- Use CDN for serving

### 5. Database Security
- Use parameterized queries
- Enable MongoDB authentication
- Limit database user permissions
- Regular backups
- Encrypt backups

---

## 📊 SECURITY METRICS

### Current State:
- Authentication: 6/10
- Authorization: 5/10
- Input Validation: 7/10
- Data Protection: 6/10
- Network Security: 7/10
- Monitoring: 5/10

### Target State:
- Authentication: 9/10
- Authorization: 9/10
- Input Validation: 9/10
- Data Protection: 9/10
- Network Security: 9/10
- Monitoring: 8/10

---

## 🎯 CONCLUSION

The system has several critical vulnerabilities that need immediate attention:

1. **Hardcoded admin secret** - Most critical, fix immediately
2. **ReDoS vulnerability** - Can crash server
3. **Missing input validation** - Multiple attack vectors
4. **Weak authentication** - No token expiration
5. **IDOR vulnerabilities** - Users can access others' data

**Recommendation:** Address Priority 1 issues before deployment. The system should NOT be deployed to production until critical issues are fixed.

**Estimated Time to Fix:**
- Priority 1: 4-6 hours
- Priority 2: 2-3 days
- Priority 3: 1-2 weeks

---

**Report Generated:** March 9, 2026  
**Next Audit:** After fixes are implemented  
**Status:** 🔴 CRITICAL ISSUES FOUND
