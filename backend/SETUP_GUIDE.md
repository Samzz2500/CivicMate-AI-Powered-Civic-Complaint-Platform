# Setup Guide - Shahar Sahayya Kranti

## Prerequisites

1. **Node.js** (v14 or higher)
2. **Python** (v3.8 or higher)
3. **MongoDB** (local or Atlas)
4. **Git**

## Installation Steps

### 1. Clone and Install Dependencies

```bash
# Navigate to backend
cd URBANML/URBANML/shahar-sahayya-kranti/backend

# Install Node.js dependencies
npm install

# Install additional security packages
npm install helmet express-mongo-sanitize express-rate-limit validator

# Install Python dependencies
pip install -r requirements.txt
```

### 2. Environment Configuration

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your actual values
# IMPORTANT: Change all default secrets!
```

**Critical Environment Variables:**

- `JWT_SECRET`: Use a strong random string (at least 32 characters)
- `ADMIN_SECRET`: Use a strong password (not "123456"!)
- `MONGO_URI`: Your MongoDB connection string
- `PYTHON_PATH`: Path to your Python executable
- `GEMINI_API_KEY`: Your Gemini API key
- `EMAIL_USER` & `EMAIL_PASS`: Gmail credentials for password reset

### 3. Generate Strong Secrets

```bash
# Generate JWT_SECRET (Node.js)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or use online generator: https://randomkeygen.com/
```

### 4. Database Setup

```bash
# Create admin user
node scripts/createAdmin.js
```

### 5. Start the Server

**Development Mode:**
```bash
# Using old server
node server.js

# Using improved server (recommended)
node server-improved.js
```

**Production Mode:**
```bash
NODE_ENV=production node server-improved.js
```

## Security Checklist

- [ ] Changed JWT_SECRET from default
- [ ] Changed ADMIN_SECRET from default
- [ ] Updated MongoDB credentials
- [ ] Configured email credentials
- [ ] Set FRONTEND_URL for CORS
- [ ] Removed .env from git tracking
- [ ] Installed security packages
- [ ] Created database indexes
- [ ] Tested rate limiting
- [ ] Verified file upload restrictions

## Testing

```bash
# Test health endpoint
curl http://localhost:5000/health

# Test with invalid file type
curl -X POST http://localhost:5000/api/tweets \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@test.pdf" \
  -F "title=Test" \
  -F "description=Test description" \
  -F "location=Test location"
```

## Common Issues

### Python Script Errors

**Issue:** "Python not found"
**Solution:** Set `PYTHON_PATH` in .env to your Python executable path

```bash
# Windows
PYTHON_PATH=C:\Users\YourName\AppData\Local\Programs\Python\Python39\python.exe

# Mac/Linux
PYTHON_PATH=/usr/bin/python3
```

### MongoDB Connection Errors

**Issue:** "MongoNetworkError"
**Solution:** Check your MONGO_URI and network connection

### Rate Limiting

**Issue:** "Too many requests"
**Solution:** Wait 15 minutes or adjust limits in `middleware/rateLimiter.js`

## Migration from Old Server

To migrate from `server.js` to `server-improved.js`:

1. Install new dependencies
2. Update package.json scripts
3. Test all endpoints
4. Update deployment configuration
5. Monitor logs for errors

## Logs

Logs are stored in `backend/logs/`:
- `info.log` - General information
- `error.log` - Error messages
- `warn.log` - Warnings
- `debug.log` - Debug information

## Next Steps

1. Add unit tests
2. Set up CI/CD pipeline
3. Configure production environment
4. Set up monitoring (e.g., PM2, New Relic)
5. Configure backup strategy
6. Add API documentation (Swagger)
