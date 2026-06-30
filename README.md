# 🏙️ CivicMate — AI-Powered Civic Complaint Platform

> **Shahar Sahayya Kranti** means *"City Help Revolution"* in Hindi.  
> This platform lets citizens report civic problems like potholes, broken streetlights, and garbage — and actually track them getting fixed.

![Tech Stack](https://img.shields.io/badge/Stack-React%20%7C%20Node.js%20%7C%20MongoDB-blue)
![Security](https://img.shields.io/badge/Security%20Score-8.8%2F10-green)
![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![Conference](https://img.shields.io/badge/IEEE-ICNTE--2026-orange)

---

## 🤔 What Problem Does This Solve?

In most Indian cities, when a citizen sees a pothole or a broken streetlight, they have no easy way to report it — and even if they do, there's zero visibility into whether anyone actually fixed it.

**CivicMate solves this in 3 steps:**
1. Citizen takes a photo and submits a complaint
2. AI verifies the image is a real civic issue (not spam)
3. Complaint gets routed to the right department, and citizen gets real-time updates — just like tracking an Amazon order

---

## ✨ Key Features

| Feature | What it does |
|--------|-------------|
| 📸 **Photo Complaints** | Submit complaints with images and location |
| 🤖 **AI Verification** | Groq AI checks if the image is a real civic issue |
| 📦 **7-Stage Tracking** | Track complaint from "Submitted" to "Resolved" like a delivery |
| 🔔 **Live Notifications** | Real-time updates via Socket.io |
| 🧑‍💼 **Admin Dashboard** | Assign complaints to departments, manage workflow |
| 📊 **Analytics** | See complaint trends, resolution times, hotspot areas |
| 💬 **AI Chatbot** | Groq-powered assistant for help and guidance |
| 📧 **Email/SMS Alerts** | Automated notifications at every status change |
| 🔐 **Secure Auth** | JWT with refresh tokens, account lockout on brute force |

---

## 🛠️ Tech Stack

```
Frontend          →   React 18, React Router v6, Bootstrap 5, Socket.io-client
Backend           →   Node.js, Express.js, Socket.io
Database          →   MongoDB with Mongoose ODM
Authentication    →   JWT (access + refresh token pattern)
AI / ML           →   Groq AI (image verification + chatbot)
Security          →   Helmet, bcrypt, express-rate-limit, mongo-sanitize
File Uploads      →   Multer (with MIME type + extension validation)
API Docs          →   Swagger UI (auto-generated)
Testing           →   Jest + Supertest
```

---

## 🚀 Getting Started

### What you need installed
- [Node.js](https://nodejs.org/) v14 or higher
- [MongoDB](https://www.mongodb.com/try/download/community) v4.4 or higher

### Step 1 — Clone and install

```bash
git clone https://github.com/your-username/civicmate.git
cd civicmate
```

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Step 2 — Configure environment

```bash
# In the backend folder, copy the example config
cd backend
copy .env.example .env
```

Open `backend/.env` and set these minimum values:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/urbanml
JWT_SECRET=any-long-random-string-at-least-32-characters
ADMIN_SECRET=another-secret-for-admin-registration
```

> **Optional but recommended:** Add a `GROQ_API_KEY` from [console.groq.com](https://console.groq.com) (free) to enable AI image verification and chatbot.

### Step 3 — Start MongoDB

```bash
# Windows (run as Administrator)
net start MongoDB
```

### Step 4 — Run the app

```bash
# Terminal 1 — Start backend
cd backend
npm start

# Terminal 2 — Start frontend
cd frontend
npm start
```

**OR** just double-click `START.bat` from the root folder.

### Step 5 — Open the app

| Service | URL |
|---------|-----|
| 🌐 Frontend | http://localhost:3000 |
| ⚙️ Backend API | http://localhost:5000 |
| 📚 API Docs (Swagger) | http://localhost:5000/api-docs |
| 🏥 Health Check | http://localhost:5000/health |

---

## 📁 Project Structure

```
civicmate/
│
├── backend/                    # Node.js + Express API server
│   ├── config/                 # DB connection, security, swagger, socket
│   ├── middleware/             # Auth, error handler, rate limiter, validation
│   ├── models/                 # MongoDB schemas (User, Tweet, Notification...)
│   ├── routes/                 # All API endpoints
│   ├── utils/                  # AI verification, email, SMS, cache, logger
│   ├── jobs/                   # Background job queue (Bull + Redis)
│   ├── tests/                  # Unit and integration tests
│   ├── .env.example            # Config template
│   └── server-improved.js      # Main entry point
│
├── frontend/                   # React application
│   └── src/
│       ├── components/         # All UI components (20+)
│       ├── config/             # Centralized API endpoint config
│       ├── hooks/              # Custom React hooks
│       └── utils/              # Axios config, error handler
│
├── docs/                       # Deep-dive documentation
├── scripts/                    # setup.bat, clean.bat
├── START.bat                   # One-click launcher
└── .gitignore
```

---

## 🔄 How a Complaint Works (The Full Flow)

```
Citizen submits complaint + photo
        ↓
Multer saves the image (validates type, size, extension)
        ↓
Groq AI checks: "Is this a real civic issue? Any inappropriate content?"
        ↓
Complaint saved to MongoDB with category auto-detected
        ↓
Admin gets notified → reviews → assigns to department
        ↓
Department marks progress → citizen gets email/SMS/app notification
        ↓
Complaint marked Resolved → citizen can confirm or reopen
```

---

## 🗺️ Complaint Tracking Stages

Just like tracking a package — citizens always know what's happening:

```
1. 📥 Submitted      → Complaint received in the system
2. 👀 Under Review   → Admin is reviewing your complaint
3. ✅ Verified       → Complaint confirmed as valid
4. 🏢 Assigned       → Sent to the responsible department
5. 🔧 In Progress    → Work has started on the ground
6. 🎉 Resolved       → Issue has been fixed
7. 🔒 Closed         → Citizen confirmed resolution
```

---

## 👤 User Roles

| Role | What they can do |
|------|-----------------|
| **Citizen** | Submit complaints, upload photos, track status, chat with AI |
| **Admin** | View all complaints, assign to departments, update status, view analytics |
| **Department** | View assigned complaints, update work progress |

---

## 🔐 Security Highlights

This isn't just a CRUD app — security was taken seriously:

- **Passwords** — bcrypt hashed, minimum 8 chars with complexity rules
- **JWT** — Short-lived access tokens (15 min) + long-lived refresh tokens (7 days)
- **Brute Force** — Account locks after multiple failed login attempts
- **Rate Limiting** — Per-route limits on auth, upload, and API endpoints
- **File Uploads** — Checks MIME type, extension, file size, and blocks double-extensions like `file.php.jpg`
- **Injection** — MongoDB query sanitization via `express-mongo-sanitize`
- **Headers** — Helmet.js sets secure HTTP headers
- **Secrets** — All secrets in `.env`, never hardcoded, validated on startup

> Security audit score: **8.8 / 10**

---

## 🧪 Running Tests

```bash
cd backend

# Run all tests with coverage
npm test

# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration
```

---

## 🌐 API Overview

Full documentation available at `/api-docs` (Swagger). Quick reference:

```
POST   /api/auth/register          Register new user
POST   /api/auth/login             Login → returns access + refresh token
POST   /api/auth/refresh-token     Get new access token
POST   /api/auth/logout            Revoke session

GET    /api/tweets                 Get all complaints
POST   /api/tweets                 Submit new complaint (with image)
GET    /api/tweets/:id             Get single complaint
DELETE /api/tweets/:id             Delete complaint

GET    /api/tracking/:id           Get complaint tracking timeline
GET    /api/analytics/stats        Get platform statistics
GET    /api/admin/users            Manage users (admin only)

POST   /api/chatbot                Chat with AI assistant
GET    /health                     Server health check
```

---

## ⚙️ Optional Services

These are disabled if not configured — the app still works without them:

| Service | How to enable |
|---------|--------------|
| 🤖 AI Verification | Add `GROQ_API_KEY` to `.env` (free at groq.com) |
| 📧 Email alerts | Add Gmail credentials to `.env` |
| 📱 SMS alerts | Add Twilio credentials to `.env` |
| 💾 Caching | Install Redis, add `REDIS_URL` to `.env` |
| 🗺️ Geolocation | Add `GOOGLE_MAPS_API_KEY` to `.env` |

---

## 🛠️ Common Issues

**MongoDB not connecting?**
```bash
net start MongoDB          # Windows
# OR
mongod --dbpath C:\data\db
```

**Port already in use?**
```bash
npx kill-port 5000    # free up backend port
npx kill-port 3000    # free up frontend port
```

**Missing modules?**
```bash
cd backend && npm install
cd ../frontend && npm install
```

---

## 📚 Documentation

All detailed docs are in the `/docs` folder:

| File | What's inside |
|------|--------------|
| `ARCHITECTURE.md` | System design and component diagram |
| `SECURITY_AUDIT_REPORT.md` | Full security analysis and fixes |
| `TRACKING_SYSTEM_IMPLEMENTATION.md` | How the 7-stage tracker works |
| `AI_CHATBOT_SETUP.md` | How to set up and configure AI |
| `TESTING_AND_VERIFICATION_GUIDE.md` | How to run and write tests |
| `RESEARCH_PAPER.md` | Academic paper for IEEE ICNTE-2026 |
| `HOW_TO_RUN.md` | Detailed step-by-step setup guide |

---

## 🏆 About This Project

This was built as a **Final Year Major Project** for **IEEE ICNTE-2026**, with a focus on:

- Real-world problem solving (not just a demo app)
- Production-level code quality
- AI integration with fallback handling
- Security-first approach
- Scalable, modular architecture

The name *Shahar Sahayya Kranti* reflects the vision: a revolution in how cities help their citizens.

---

## 📄 License

Built for academic and research purposes — IEEE ICNTE-2026.

---

<div align="center">
  <strong>Built with ❤️ for smarter, more responsive cities</strong>
</div>
