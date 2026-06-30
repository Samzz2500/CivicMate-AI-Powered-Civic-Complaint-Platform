# Shahar Sahayya Kranti - Project Information

## 📋 Project Overview

**Name**: Shahar Sahayya Kranti (CivicMate)  
**Type**: AI-Powered Civic Engagement Platform  
**Conference**: IEEE ICNTE-2026  
**Category**: Final Year Major Project  

---

## 🎯 Project Goals

Transform civic engagement through AI-powered complaint management system that:
- Enables citizens to report civic issues with photo evidence
- Uses AI to verify and categorize complaints automatically
- Provides real-time tracking (Amazon-style delivery tracking)
- Connects citizens with government departments efficiently
- Analyzes trends to improve urban planning

---

## 🏗️ Architecture

### Technology Stack

**Frontend**
- React 18
- React Router v6
- Axios for API calls
- Socket.io-client for real-time updates
- CSS3 with modern animations

**Backend**
- Node.js + Express
- MongoDB with Mongoose
- JWT authentication
- Socket.io for WebSocket
- Groq AI for image verification
- Python integration for ML

**Security**
- bcrypt password hashing
- JWT tokens with refresh mechanism
- Rate limiting (express-rate-limit)
- Input sanitization
- CORS protection
- File upload validation

---

## 📊 Key Features

### 1. Complaint Management
- Submit complaints with images
- AI-powered verification
- Category auto-detection
- Priority assignment
- Status tracking

### 2. Tracking System (7 Stages)
1. Submitted - Initial complaint received
2. Under Review - Admin reviewing
3. Verified - AI/Admin verified
4. Assigned - Assigned to department
5. In Progress - Work started
6. Resolved - Issue fixed
7. Closed - Citizen confirmed

### 3. Admin Dashboard
- Complaint workflow management
- User management
- Department assignment
- Analytics and reports
- Audit logs

### 4. AI Integration
- **Groq AI**: Image verification and chatbot
- **ML Model**: Complaint categorization
- **Predictions**: Issue priority and resolution time

### 5. Real-time Features
- Live notifications
- Status updates
- Chat support
- Dashboard updates

---

## 📁 Clean Project Structure

```
shahar-sahayya-kranti/
│
├── README.md                    # Main project documentation
├── INSTALL_MONGODB.md          # MongoDB setup guide
├── PROJECT_INFO.md             # This file
├── START.bat                   # Main startup script
│
├── backend/                    # Backend API
│   ├── config/                # Configuration files
│   ├── middleware/            # Express middleware
│   ├── models/                # MongoDB schemas
│   ├── routes/                # API endpoints
│   ├── utils/                 # Helper functions
│   ├── tests/                 # Test suites
│   ├── uploads/               # User uploaded files
│   ├── logs/                  # Application logs
│   ├── .env                   # Environment variables
│   ├── .env.example           # Environment template
│   ├── package.json           # Dependencies
│   └── server-improved.js     # Main server file
│
├── frontend/                  # React application
│   ├── public/               # Static files
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── config/           # Configuration
│   │   ├── hooks/            # Custom hooks
│   │   ├── utils/            # Helper functions
│   │   ├── App.js            # Main app component
│   │   └── index.js          # Entry point
│   ├── .env                  # Environment variables
│   ├── .env.example          # Environment template
│   └── package.json          # Dependencies
│
├── docs/                     # Documentation
│   ├── README.md            # Documentation index
│   ├── ARCHITECTURE.md      # System architecture
│   ├── BACKEND_ASSESSMENT.md
│   ├── SECURITY_AUDIT_REPORT.md
│   ├── TRACKING_SYSTEM_IMPLEMENTATION.md
│   ├── FEATURE_INTERCONNECTION_MAP.md
│   ├── TESTING_AND_VERIFICATION_GUIDE.md
│   ├── AI_CHATBOT_SETUP.md
│   ├── RESEARCH_PAPER.md
│   ├── PROJECT_GOALS.md
│   ├── HOW_TO_RUN.md
│   ├── GET_FREE_AI_KEY.txt
│   └── FLOW_DIAGRAM_EXPLANATION.txt
│
└── scripts/                 # Utility scripts
    ├── setup.bat           # Install dependencies
    └── clean.bat           # Clean project
```

---

## 🚀 Quick Start Commands

```bash
# 1. Setup (first time only)
scripts\setup.bat

# 2. Start application
START.bat

# 3. Clean project (if needed)
scripts\clean.bat
```

---

## 🔧 Configuration Files

### Backend .env
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/urbanml
JWT_SECRET=<64-char-secret>
JWT_REFRESH_SECRET=<64-char-secret>
ADMIN_SECRET=<64-char-secret>
GROQ_API_KEY=<your-api-key>
```

### Frontend .env
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_ADMIN_SECRET=<same-as-backend>
```

---

## 📈 Project Statistics

- **Total Files**: ~100+
- **Backend Routes**: 15+
- **Frontend Components**: 20+
- **API Endpoints**: 50+
- **Security Score**: 8.8/10
- **Test Coverage**: Unit + Integration tests

---

## 🔐 Security Highlights

✅ All critical vulnerabilities fixed  
✅ Strong password requirements  
✅ JWT authentication with refresh  
✅ Rate limiting (global + per-user)  
✅ Input sanitization  
✅ File upload validation  
✅ XSS protection  
✅ CORS configuration  
✅ Audit logging  

---

## 📚 Important Links

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Docs**: http://localhost:5000/api-docs
- **MongoDB**: mongodb://127.0.0.1:27017

---

## 👥 User Roles

1. **Citizen**: Submit and track complaints
2. **Admin**: Manage complaints, users, departments
3. **Department**: Handle assigned complaints

---

## 🎓 Academic Contribution

This project demonstrates:
- Full-stack web development
- AI/ML integration
- Real-time communication
- Security best practices
- Scalable architecture
- User-centric design
- Social impact technology

---

## 📞 Support

For issues or questions:
1. Check `docs/HOW_TO_RUN.md`
2. Review `docs/README.md` for specific topics
3. Check `INSTALL_MONGODB.md` for database setup

---

## 🏆 Project Status

✅ Backend: Complete  
✅ Frontend: Complete  
✅ Security: Audited & Fixed  
✅ Testing: Implemented  
✅ Documentation: Complete  
✅ Ready for Deployment  

---

**Last Updated**: March 2026  
**Version**: 1.0.0  
**Status**: Production Ready
