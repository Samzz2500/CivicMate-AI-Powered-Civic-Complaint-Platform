
CHAPTER 5
IMPLEMENTATION

─────────────────────────────────────────────────────────────────────────────

5.1 Introduction

The implementation phase of CivicMate: An AI-Driven City Grievance System
involves translating the system design into a fully functional web application.
The system is implemented using a combination of modern web technologies,
machine learning tools, and database management systems. This chapter describes
the step-by-step implementation of each module, supported by relevant code
snippets, database schemas, and API definitions.

The system is divided into two major components: the frontend, developed using
React.js, and the backend, developed using Node.js with the Express.js
framework. MongoDB is used as the primary database. The AI component is
implemented using a Convolutional Neural Network (CNN) model trained to
classify civic complaint images into predefined categories.

The implementation follows a modular approach, where each feature is developed
independently and then integrated into the main application. This ensures
maintainability, scalability, and ease of testing.

─────────────────────────────────────────────────────────────────────────────

5.2 Technologies Used

The following technologies were used in the implementation of CivicMate:

Frontend:
  - React.js (v18)         : Component-based UI development
  - Axios                  : HTTP client for API communication
  - React Router DOM       : Client-side routing
  - CSS3                   : Styling and responsive design

Backend:
  - Node.js (v24)          : Server-side JavaScript runtime
  - Express.js             : Web application framework
  - bcryptjs               : Password hashing
  - JSON Web Token (JWT)   : Stateless authentication
  - Multer                 : File upload handling
  - Mongoose               : MongoDB object modeling
  - Socket.io              : Real-time bidirectional communication
  - Nodemailer             : Email notification service

Database:
  - MongoDB Atlas          : Cloud-hosted NoSQL database

AI / Machine Learning:
  - Python 3.x             : AI processing scripts
  - TensorFlow / Keras     : CNN model training and inference
  - NumPy                  : Numerical computation
  - Pillow (PIL)           : Image preprocessing

Other Tools:
  - Swagger UI             : API documentation
  - Winston                : Server-side logging
  - dotenv                 : Environment variable management

─────────────────────────────────────────────────────────────────────────────

5.3 System Modules

The CivicMate system is organized into the following core modules:

  1. User Authentication Module
     Handles user registration, login, JWT token generation, and account
     security including login attempt tracking and account lockout.

  2. Complaint Submission Module
     Allows citizens to submit civic complaints with title, description,
     location, category, and an optional image attachment.

  3. AI Image Classification Module
     Automatically classifies uploaded complaint images using a trained CNN
     model to verify that the image is a valid civic issue.

  4. Complaint Tracking Module
     Provides an Amazon-style multi-step workflow tracker so citizens can
     monitor the real-time status of their submitted complaints.

  5. Admin Dashboard Module
     Allows administrators to view, assign, update status, and delete
     complaints. Includes analytics and department-wise filtering.

  6. Notification Module
     Sends real-time in-app notifications and email alerts to users when
     their complaint status is updated.

  7. Chatbot Module
     An AI-powered chatbot that assists users with complaint-related queries
     using a Python-based conversational backend.

  8. Geolocation Module
     Captures and stores GPS coordinates of complaints for map-based
     visualization and area-wise analysis.

─────────────────────────────────────────────────────────────────────────────

5.4 Implementation Details

This section describes the implementation of each module with relevant code
snippets extracted from the actual project source code.

─────────────────────────────────────────────────────────────────────────────

5.4.1 User Authentication Module

The authentication module is implemented using bcryptjs for password hashing
and JSON Web Tokens (JWT) for session management. When a user registers, the
password is hashed before being stored in the database. During login, the
stored hash is compared with the entered password using bcrypt's compare
function.

The system also implements an account lockout mechanism. After five consecutive
failed login attempts, the account is locked for two hours to prevent brute
force attacks.

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
Code Snippet 5.1: Password Hashing using bcrypt (Node.js)
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    const bcrypt = require("bcryptjs");

    // Hash the password before saving to database
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,   // Store hashed password only
      firstname,
      lastname,
      city,
      state,
      pincode,
      role: role || "user",
    });

    await newUser.save();

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

The second parameter (10) in bcrypt.hash() is the salt rounds value. A higher
value increases security but also increases computation time. A value of 10 is
considered a good balance for production systems.

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
Code Snippet 5.2: Password Verification and JWT Token Generation
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    // Verify password against stored hash
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      await user.incLoginAttempts();
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate JWT access token (expires in 15 minutes)
    const accessToken = jwt.sign(
      { id: userId },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    res.json({ success: true, accessToken, user: { id, username, role } });

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

As shown in the code snippet above, the system generates a short-lived access
token (15 minutes) and a separate refresh token (7 days). This dual-token
approach improves security by limiting the exposure window of the access token.

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
Code Snippet 5.3: Account Lockout Logic (User Model)
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    // Lock account after 5 failed attempts for 2 hours
    UserSchema.methods.incLoginAttempts = function () {
      const maxAttempts = 5;
      const lockTime = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

      const updates = { $inc: { loginAttempts: 1 } };

      if (this.loginAttempts + 1 >= maxAttempts && !this.isLocked) {
        updates.$set = { lockUntil: Date.now() + lockTime };
      }

      return this.updateOne(updates);
    };

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

This method is called every time a login attempt fails. Once the attempt count
reaches five, the lockUntil field is set to two hours in the future. The
isLocked virtual property checks this field on every login request.

─────────────────────────────────────────────────────────────────────────────

5.4.2 Complaint Submission Module

The complaint submission module allows citizens to submit a complaint with a
title, description, location, category, and an optional image. The image is
uploaded using Multer middleware and then passed to the AI classification
module for validation.

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
Code Snippet 5.4: Complaint Submission API Endpoint (Node.js / Express)
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    // POST /api/tweets  -  Submit a new complaint
    router.post("/", authMiddleware, upload.single("image"),
      validateTweet, asyncHandler(async (req, res) => {

      const { title, description, location, category } = req.body;
      const imageFile = req.file;

      // If image uploaded, run AI classification
      let aiCategory = category;
      if (imageFile) {
        const result = await classifyImage(imageFile.path);
        if (!result.valid) {
          return res.status(400).json({
            success: false,
            message: "Image does not appear to be a valid civic issue."
          });
        }
        aiCategory = result.class;
      }

      const tweet = new Tweet({
        title, description, location,
        category: aiCategory,
        image: imageFile ? imageFile.filename : null,
        user: req.user.id,
      });

      await tweet.save();
      res.status(201).json({ success: true, tweet });
    }));

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

The above endpoint accepts a multipart/form-data request. The Multer middleware
processes the uploaded image and saves it to the uploads/ directory. The AI
classification function then validates whether the image is a genuine civic
complaint before saving the record to the database.

─────────────────────────────────────────────────────────────────────────────

5.4.3 AI Image Classification Module

The AI module uses a Convolutional Neural Network (CNN) model trained on civic
complaint images. The model is saved as a .h5 file and loaded using TensorFlow
Keras. The Python script classify_image.py is called from the Node.js backend
using a child process.

The model classifies images into seven categories:
  drainage, garbage, potholes, public washroom, streetlight,
  water_leakage, others

Images classified as "others" are rejected as non-civic content.

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
Code Snippet 5.5: Image Preprocessing and CNN Prediction (Python)
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    from tensorflow.keras.models import load_model
    from tensorflow.keras.preprocessing import image
    import numpy as np

    MODEL_PATH = "civicmate_image_model.h5"
    model = load_model(MODEL_PATH, compile=False)

    CONFIDENCE_THRESHOLD = 0.30

    def predict_image(img_path):
        img = image.load_img(img_path, target_size=(224, 224))
        img_array = image.img_to_array(img)
        img_array = img_array / 255.0                        # Normalize
        img_array = np.expand_dims(img_array, axis=0)        # Add batch dim

        predictions = model.predict(img_array, verbose=0)
        confidence = float(np.max(predictions))
        class_index = int(np.argmax(predictions))
        return CLASS_NAMES[class_index], confidence

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

The image is resized to 224x224 pixels (standard input size for CNN models),
normalized to a 0-1 range, and passed to the model. The class with the highest
probability score is selected as the predicted category. If the confidence
score is below 0.30, the image is rejected.

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
Code Snippet 5.6: Validation and JSON Output (Python)
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    predicted_class, confidence = predict_image(img_path)

    # Reject "others" class - indicates non-civic image
    if predicted_class == "others":
        is_valid = False
    elif predicted_class in VALID_CIVIC_CLASSES:
        is_valid = confidence >= CONFIDENCE_THRESHOLD
    else:
        is_valid = False

    print(json.dumps({
        "valid": is_valid,
        "class": predicted_class,
        "confidence": confidence,
        "error": None
    }))

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

The result is printed as a JSON string to stdout, which is then read by the
Node.js backend using a child process. This design keeps the Python AI module
decoupled from the Node.js server.

─────────────────────────────────────────────────────────────────────────────

5.4.4 Notification Module

The notification module sends real-time in-app notifications to users when
their complaint status changes. It uses Socket.io for real-time delivery and
MongoDB to persist notification records.

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
Code Snippet 5.7: Creating and Emitting a Notification
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    // Static method on Notification model
    NotificationSchema.statics.createNotification = async function (data) {
      const notification = new this(data);
      await notification.save();

      // Emit real-time notification via Socket.io
      const { notifyUser, notifyUnreadCount } = require('../utils/socketEvents');
      notifyUser(data.user.toString(), notification);

      // Update unread count badge
      const unreadCount = await this.countDocuments({
        user: data.user,
        read: false
      });
      notifyUnreadCount(data.user.toString(), unreadCount);

      return notification;
    };

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

When an admin updates a complaint status, this method is called with the
relevant user ID and message. The notification is saved to the database and
simultaneously pushed to the user's browser via Socket.io, providing an
instant update without requiring a page refresh.

─────────────────────────────────────────────────────────────────────────────

5.5 Database Implementation

The system uses MongoDB as the primary database, accessed through the Mongoose
ODM (Object Document Mapper). MongoDB was chosen for its flexible schema
design, which is well-suited for civic complaint data that may vary in
structure across different categories.

─────────────────────────────────────────────────────────────────────────────

5.5.1 User Schema

The User schema stores all registered user information including credentials,
location details, and account security fields.

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
Code Snippet 5.8: User Schema (MongoDB / Mongoose)
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    const UserSchema = new mongoose.Schema({
      username:      { type: String, required: true, unique: true, minlength: 3 },
      email:         { type: String, required: true, unique: true, lowercase: true },
      password:      { type: String, required: true },
      firstname:     { type: String, required: true },
      lastname:      { type: String, required: true },
      city:          { type: String },
      state:         { type: String },
      pincode:       { type: String, match: /^[0-9]{6}$/ },
      role:          { type: String, enum: ["admin", "user"], default: "user" },
      loginAttempts: { type: Number, default: 0 },
      lockUntil:     { type: Date },
      lastLogin:     { type: Date },
    }, { timestamps: true });

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

The timestamps option automatically adds createdAt and updatedAt fields to
every document. The pincode field uses a regex validator to ensure only valid
six-digit Indian pincodes are accepted.

─────────────────────────────────────────────────────────────────────────────

5.5.2 Complaint (Tweet) Schema

The complaint schema is the central data model of the system. It stores all
complaint details including the multi-step workflow tracking state.

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
Code Snippet 5.9: Complaint Schema (MongoDB / Mongoose)
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    const TweetSchema = new mongoose.Schema({
      title:       { type: String, required: true },
      description: { type: String, required: true },
      location:    { type: String, required: true },
      image:       { type: String },
      category: {
        type: String,
        enum: ["drainage","garbage","potholes","public washroom",
               "streetlight","water_leakage","others"],
        default: "others"
      },
      completed: {
        type: String,
        enum: ["submitted","assigned","in-progress","under-review",
               "resolved","verified","completed","rejected"],
        default: "submitted"
      },
      user:     { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      upvotes:  { type: [mongoose.Schema.Types.ObjectId], ref: "User" },
      priority: { type: Number, default: 0 },
      comments: [{ user: ObjectId, text: String, date: Date }],
      history:  [{ status: String, changedBy: ObjectId, date: Date, note: String }],
    }, { timestamps: true });

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

The history array records every status change with the responsible user and
timestamp. This provides a complete audit trail for each complaint. The
priority field is automatically calculated based on upvotes, complaint age,
and category urgency using a pre-save hook.

─────────────────────────────────────────────────────────────────────────────

5.5.3 Notification Schema

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
Code Snippet 5.10: Notification Schema (MongoDB / Mongoose)
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    const NotificationSchema = new mongoose.Schema({
      user:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      type:    { type: String,
                 enum: ["status_change","comment","upvote","assignment",
                        "completion","feedback_request","system"] },
      title:   { type: String, required: true, maxlength: 100 },
      message: { type: String, required: true, maxlength: 500 },
      link:    { type: String },
      relatedTweet: { type: mongoose.Schema.Types.ObjectId, ref: "Tweet" },
      read:    { type: Boolean, default: false },
      readAt:  { type: Date },
      priority:{ type: String, enum: ["low","medium","high"], default: "medium" }
    }, { timestamps: true });

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

Compound indexes are created on { user, read, createdAt } to ensure fast
retrieval of unread notifications for a specific user.

─────────────────────────────────────────────────────────────────────────────

5.6 API Implementation

The backend exposes a RESTful API built with Express.js. All API routes are
prefixed with /api/ and are documented using Swagger UI, accessible at
/api-docs. The following table summarizes the key API endpoints:

  Method  | Endpoint                    | Description
  --------|-----------------------------|---------------------------------
  POST    | /api/auth/register          | Register a new user
  POST    | /api/auth/login             | Login and receive JWT tokens
  POST    | /api/auth/logout            | Logout and revoke refresh token
  POST    | /api/auth/forgot-password   | Send password reset email
  GET     | /api/tweets                 | Get all complaints (paginated)
  POST    | /api/tweets                 | Submit a new complaint
  GET     | /api/tweets/:id             | Get a specific complaint
  PATCH   | /api/tweets/:id/status      | Update complaint status (admin)
  POST    | /api/tweets/:id/upvote      | Upvote a complaint
  GET     | /api/notifications          | Get user notifications
  GET     | /api/tracking/:id           | Get complaint tracking timeline
  GET     | /api/analytics/summary      | Get dashboard analytics (admin)
  POST    | /api/chatbot/message        | Send message to AI chatbot

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
Code Snippet 5.11: JWT Authentication Middleware
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    const authMiddleware = (req, res, next) => {
      const authHeader = req.headers["authorization"];
      const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

      if (!token) {
        return res.status(401).json({ message: "Access token required" });
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
      } catch (error) {
        return res.status(403).json({ message: "Invalid or expired token" });
      }
    };

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

This middleware is applied to all protected routes. It extracts the Bearer
token from the Authorization header, verifies it using the JWT secret, and
attaches the decoded user object to the request. If the token is missing or
invalid, the request is rejected with a 401 or 403 status code.

─────────────────────────────────────────────────────────────────────────────

5.7 Security Implementation

Security is a critical aspect of the CivicMate system, as it handles personal
user data and civic complaint information. The following security measures have
been implemented to protect the system from common web vulnerabilities.

─────────────────────────────────────────────────────────────────────────────

5.7.1 Password Hashing

Storing plain-text passwords in a database is a serious security risk. If the
database is compromised, all user passwords would be exposed. To prevent this,
CivicMate uses bcrypt, a widely accepted password hashing algorithm.

bcrypt applies a one-way hashing function with a configurable cost factor
(salt rounds). This means the original password cannot be recovered from the
stored hash. Even if two users have the same password, their hashes will be
different because bcrypt automatically generates a unique salt for each hash.

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
Code Snippet 5.12: bcrypt Hashing and Comparison
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    const bcrypt = require("bcryptjs");

    // During Registration: Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(plainTextPassword, saltRounds);
    // Result: "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"

    // During Login: Compare entered password with stored hash
    const isMatch = await bcrypt.compare(enteredPassword, storedHash);
    // Returns: true (if match) or false (if no match)

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

As shown above, the hash stored in the database looks like a random string.
The bcrypt.compare() function internally extracts the salt from the stored
hash and re-hashes the entered password to check for a match. This process
ensures that the original password is never stored or transmitted.

─────────────────────────────────────────────────────────────────────────────

5.7.2 Input Validation and Sanitization

All user inputs are validated on the server side before being processed or
stored. The validation middleware checks for required fields, data types,
length limits, and format patterns.

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
Code Snippet 5.13: Input Validation Middleware (Registration)
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    const validateRegister = (req, res, next) => {
      const { username, email, password, firstname, lastname } = req.body;
      const errors = [];

      if (!username || username.length < 3)
        errors.push("Username must be at least 3 characters");

      if (!email || !validator.isEmail(email))
        errors.push("Valid email is required");

      if (!password || password.length < 8)
        errors.push("Password must be at least 8 characters");

      if (errors.length > 0)
        return res.status(400).json({ success: false, errors });

      // Sanitize inputs before processing
      req.body.username = validator.escape(validator.trim(username));
      req.body.email    = validator.normalizeEmail(email);
      next();
    };

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

Input sanitization removes potentially harmful characters from user input,
preventing Cross-Site Scripting (XSS) attacks. The validator library is used
to normalize and escape all string inputs before they are stored in the
database or returned in API responses.

─────────────────────────────────────────────────────────────────────────────

5.7.3 Rate Limiting

To prevent brute force attacks and API abuse, rate limiting is applied to all
authentication endpoints. The express-rate-limit middleware restricts the
number of requests a client can make within a defined time window.

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
Code Snippet 5.14: Rate Limiter Configuration
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    const rateLimit = require("express-rate-limit");

    const authLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,   // 15-minute window
      max: 10,                     // Max 10 requests per window
      message: {
        success: false,
        message: "Too many attempts. Please try again after 15 minutes."
      },
      standardHeaders: true,
      legacyHeaders: false,
    });

    // Apply to login and register routes
    router.post("/login", authLimiter, validateLogin, loginHandler);
    router.post("/register", authLimiter, validateRegister, registerHandler);

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

If a client exceeds 10 login attempts within 15 minutes, all further requests
from that IP address are blocked until the window resets. This significantly
reduces the risk of automated brute force attacks.

─────────────────────────────────────────────────────────────────────────────

5.7.4 Secure API Handling

  - All sensitive configuration values (JWT secret, database URI, API keys)
    are stored in environment variables using a .env file and never hardcoded
    in the source code.

  - CORS (Cross-Origin Resource Sharing) is configured to allow requests only
    from the trusted frontend origin, blocking unauthorized cross-origin calls.

  - The HTTP security headers are set using the Helmet.js middleware, which
    protects against common vulnerabilities such as clickjacking, MIME
    sniffing, and content injection.

  - All API responses use consistent status codes (200, 201, 400, 401, 403,
    404, 500) to avoid leaking internal system information.

  - Passwords and sensitive fields are excluded from all API responses using
    Mongoose's .select("-password") method.

─────────────────────────────────────────────────────────────────────────────

5.8 Challenges Faced

During the implementation of CivicMate, several technical and non-technical
challenges were encountered. The following describes the major challenges and
how they were resolved.

1. Duplicate Function Declarations in Middleware
   During development, the validation.js middleware file was modified multiple
   times by different team members, resulting in duplicate function
   declarations. This caused a SyntaxError at server startup. The issue was
   resolved by consolidating all validation functions into a single, clean
   version of the file.

2. Node.js PATH Configuration on Windows
   The Node.js executable was not available in the system PATH for PowerShell,
   which prevented the server from starting via standard npm commands. This was
   resolved by using the full absolute path to the node.exe binary in the
   startup scripts.

3. AI Model Integration with Node.js Backend
   Integrating the Python-based CNN model with the Node.js backend required
   inter-process communication. The solution was to invoke the Python script
   as a child process from Node.js and parse the JSON output returned via
   stdout. This kept the two environments decoupled.

4. Real-Time Notification Delivery
   Ensuring that Socket.io notifications were delivered reliably required
   careful management of user socket connections. A user-to-socket mapping
   was maintained in memory on the server to route notifications to the
   correct connected client.

5. Image Validation for Non-Civic Content
   The initial CNN model had difficulty distinguishing between civic and
   non-civic images. This was addressed by adding a confidence threshold of
   0.30 and explicitly rejecting the "others" class, which the model uses
   for unrecognized content.

6. MongoDB Atlas Connection Stability
   Occasional connection timeouts to MongoDB Atlas were observed during
   development. This was resolved by configuring connection pooling and
   adding retry logic in the database connection module.

─────────────────────────────────────────────────────────────────────────────

5.9 Summary

This chapter presented the complete implementation of the CivicMate system.
The system is implemented using Node.js and Express.js for the backend, React.js
for the frontend, and MongoDB for the database. A Python-based CNN model is
integrated for AI image classification of civic complaint images.

Key security measures including bcrypt password hashing, JWT-based
authentication, input validation, rate limiting, and account lockout have been
implemented to protect user data and prevent unauthorized access.

The modular architecture of the system ensures that each component can be
developed, tested, and maintained independently. The use of Socket.io enables
real-time notifications, providing citizens with instant updates on their
complaint status.

The implementation successfully demonstrates the feasibility of an AI-driven
civic grievance system that can automate complaint categorization, track
resolution progress, and improve communication between citizens and municipal
authorities.

─────────────────────────────────────────────────────────────────────────────
                              END OF CHAPTER 5
─────────────────────────────────────────────────────────────────────────────
