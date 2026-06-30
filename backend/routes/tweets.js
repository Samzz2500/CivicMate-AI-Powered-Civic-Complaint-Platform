/*const express = require("express");
const Tweet = require("../models/Tweet");
const { authMiddleware } = require("../middleware/auth");
const fs = require("fs");
const { exec } = require("child_process");
const path = require("path");
const router = express.Router();

module.exports = (upload) => {
  // ================== NSFW Verification Middleware ==================
  const verifyImage = (req, res, next) => {
    if (!req.file) return next();

    const imagePath = req.file.path;
    // Fix 1: Correct path resolution for Windows
    const pythonScript = path.resolve(
      __dirname, 
      "..", // Go up from routes directory
      "utils", 
      "verify_image.py"
    );

    // Fix 2: Explicit Python path for your installation
    const pythonExecutable = process.env.PYTHON_PATH || 
      "C:\\Users\\patil\\AppData\\Local\\Programs\\Python\\Python39\\python.exe";

    exec(
      // Fix 3: Use properly escaped Windows path
      `"${pythonExecutable}" "${pythonScript.replace(/\\/g, '\\\\')}" "${imagePath.replace(/\\/g, '\\\\')}"`,
      (error, stdout, stderr) => {
        const cleanup = () => {
          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
            req.file = null;
          }
        };

        // Fix 4: Enhanced error logging
        if (error) {
          console.error("Python Execution Paths:", {
            pythonExecutable,
            pythonScript,
            imagePath
          });
          cleanup();
          return res.status(500).json({ 
            error: "Content safety check failed",
            details: `Command: ${pythonExecutable} | Error: ${stderr || error.message}`
          });
        }

        try {
          const result = JSON.parse(stdout);
          
          if (typeof result.nsfw !== 'boolean' || typeof result.unsafe !== 'number') {
            throw new Error("Invalid verification response format");
          }

          if (result.nsfw || result.unsafe >= 0.3) {
            cleanup();
            return res.status(403).json({
              error: "Content violates safety policy",
              score: result.unsafe,
              detected: result.detections || []
            });
          }

          next();
        } catch (parseError) {
          cleanup();
          res.status(500).json({
            error: "Safety verification failed",
            details: parseError.message
          });
        }
      }
    );
  };

    // ================== Tweet Creation Endpoint ==================
    router.post(
      "/",
      authMiddleware,
      upload.single("image"),
      verifyImage,
      async (req, res) => {
        try {
          const newTweet = new Tweet({
            title: req.body.title,
            description: req.body.description,
            location: req.body.location,
            image: req.file?.path || null,
            completed: req.body.completed || "pending",
            user: req.user.id,
          });

          const savedTweet = await newTweet.save();
          res.status(201).json(savedTweet);
        } catch (error) {
          if (req.file?.path) fs.unlinkSync(req.file.path);
          res.status(500).json({
            message: "Tweet creation failed",
            error: error.message
          });
        }
      }
    );

    // ================== Get Tweets with Search ==================
    router.get("/", async (req, res) => {
      let { query } = req.query;

      try {
        // SECURITY FIX #3: Add length validation to prevent DoS
        if (query && query.length > 100) {
          return res.status(400).json({ 
            success: false, 
            message: "Search query too long (max 100 characters)" 
          });
        }
        
        // SECURITY FIX #2: Validate query type
        if (query && typeof query !== 'string') {
          return res.status(400).json({ 
            success: false, 
            message: "Invalid query format" 
          });
        }

        if (query) {
          // SECURITY FIX #2: Properly escape regex special characters to prevent ReDoS
          const sanitizedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          
          const tweets = await Tweet.find({
            $or: [
              { title: { $regex: sanitizedQuery, $options: "i" } },
              { description: { $regex: sanitizedQuery, $options: "i" } },
              { location: { $regex: sanitizedQuery, $options: "i" } },
            ],
          }).populate("user", "username").limit(100); // Limit results
          return res.json(tweets);
        }

        const tweets = await Tweet.find().populate("user", "username").limit(100);
        res.json(tweets);
      } catch (error) {
        console.error("Error fetching tweets:", error);
        res.status(500).json({ message: "Server error" });
      }
    });

    // ================== Get User-Specific Tweets ==================
    router.get("/user", authMiddleware, async (req, res) => {
      try {
        const tweets = await Tweet.find({ user: req.user.id })
          .populate("user", "username");
        res.json(tweets);
      } catch (error) {
        res.status(500).json({ message: "Server error" });
      }
    });

    // ================== Add Comment to Tweet ==================
    router.post("/:tweetId/comment", authMiddleware, async (req, res) => {
      const { tweetId } = req.params;
      const { text } = req.body;

      try {
        const tweet = await Tweet.findById(tweetId);
        if (!tweet) return res.status(404).json({ message: "Tweet not found" });

        tweet.comments.push({
          user: req.user.id,
          text,
        });

        await tweet.save();
        res.status(201).json(tweet);
      } catch (error) {
        res.status(500).json({ message: "Server error" });
      }
    });

    // ================== Like a Tweet ==================
    router.post("/:tweetId/like", authMiddleware, async (req, res) => {
      const { tweetId } = req.params;
      const userId = req.user.id;

      try {
        const tweet = await Tweet.findById(tweetId);
        if (!tweet) return res.status(404).json({ message: "Tweet not found" });

        if (tweet.likes.includes(userId)) {
          return res.status(400).json({ message: "Already liked this tweet" });
        }

        tweet.likes.push(userId);
        await tweet.save();
        res.status(200).json(tweet);
      } catch (error) {
        res.status(500).json({ message: "Server error" });
      }
    });

    // ================== Recent Tweets ==================
    router.get("/recent", async (req, res) => {
      try {
        const recentTweets = await Tweet.find()
          .sort({ createdAt: -1 })
          .limit(10);
        res.json(recentTweets);
      } catch (error) {
        console.error(error.message);
        res.status(500).send("Server Error");
      }
    });

    // ================== Top Tweets ==================
    router.get("/top", async (req, res) => {
      try {
        const topTweets = await Tweet.find()
          .sort({ likes: -1 })
          .limit(10);
        res.json(topTweets);
      } catch (error) {
        console.error(error.message);
        res.status(500).send("Server Error");
      }
    });

    return router;
  };
  
*/

const express = require("express");
const Tweet = require("../models/Tweet");
const { authMiddleware } = require("../middleware/auth");
const { validateTweet, validateComment } = require("../middleware/validation");
const { asyncHandler } = require("../middleware/errorHandler");
const logger = require("../utils/logger");
const fs = require("fs");
const { exec } = require("child_process");
const path = require("path");

// Enable node-fetch for translation API
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const router = express.Router();

module.exports = (upload, verifyImage) => {
  // verifyImage is provided by server.js and uses PYTHON_PATH or python on PATH

  // ================== Tweet Creation Endpoint ==================
  router.post("/", authMiddleware, upload.single("image"), verifyImage, validateTweet, asyncHandler(async (req, res) => {
    // Use manual category if provided, otherwise use AI prediction
    const category =
      req.body.category ||
      req.civicPrediction?.category ||
      req.civicPrediction?.class ||
      "others";
    
    const newTweet = new Tweet({
      title: req.body.title,
      description: req.body.description,
      location: req.body.location,
      image: req.file?.path || null,
      category,
      completed: req.body.completed || "pending",
      user: req.user.id,
    });

    const savedTweet = await newTweet.save();
    logger.info("Tweet created", { tweetId: savedTweet._id, user: req.user.id });
    res.status(201).json({ success: true, tweet: savedTweet });
  }));

  // ================== Get Tweets with Search ==================
  router.get("/", asyncHandler(async (req, res) => {
    const { query, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    let filter = {};
    if (query) {
      // Sanitize regex to prevent ReDoS attacks
      const sanitizedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter = {
        $or: [
          { title: { $regex: sanitizedQuery, $options: "i" } },
          { description: { $regex: sanitizedQuery, $options: "i" } },
          { location: { $regex: sanitizedQuery, $options: "i" } },
        ],
      };
    }

    const tweets = await Tweet.find(filter)
      .populate("user", "username")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Tweet.countDocuments(filter);

    res.json({ 
      success: true, 
      tweets, 
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  }));

  // ================== Get User-Specific Tweets ==================
  router.get("/user", authMiddleware, asyncHandler(async (req, res) => {
    const tweets = await Tweet.find({ user: req.user.id })
      .populate("user", "username")
      .sort({ createdAt: -1 });
    res.json({ success: true, tweets });
  }));

  // ================== Add Comment to Tweet ==================
  router.post("/:tweetId/comment", authMiddleware, validateComment, asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const { text } = req.body;

    const tweet = await Tweet.findById(tweetId);
    if (!tweet) return res.status(404).json({ success: false, message: "Tweet not found" });

    tweet.comments.push({
      user: req.user.id,
      text,
    });

    await tweet.save();
    logger.info("Comment added", { tweetId, user: req.user.id });
    res.status(201).json({ success: true, tweet });
  }));

  // ================== Like a Tweet ==================
  router.post("/:tweetId/like", authMiddleware, asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const userId = req.user.id;

    const tweet = await Tweet.findById(tweetId);
    if (!tweet) return res.status(404).json({ success: false, message: "Tweet not found" });

    if (tweet.likes.includes(userId)) {
      return res.status(400).json({ success: false, message: "Already liked this tweet" });
    }

    tweet.likes.push(userId);
    await tweet.save();
    res.status(200).json({ success: true, tweet });
  }));

  // ================== Upvote a Tweet (Priority System) ==================
  router.post("/:tweetId/upvote", authMiddleware, asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const userId = req.user.id;

    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
      return res.status(404).json({ success: false, message: "Tweet not found" });
    }

    const upvoteIndex = tweet.upvotes.indexOf(userId);
    let upvoted = false;

    if (upvoteIndex > -1) {
      // Remove upvote
      tweet.upvotes.splice(upvoteIndex, 1);
      upvoted = false;
    } else {
      // Add upvote
      tweet.upvotes.push(userId);
      upvoted = true;
    }

    // Recalculate priority
    tweet.priority = calculatePriority(tweet);
    await tweet.save();

    logger.info("Tweet upvote toggled", { 
      tweetId, 
      userId, 
      upvotes: tweet.upvotes.length,
      priority: tweet.priority,
      action: upvoted ? 'added' : 'removed'
    });

    res.json({ 
      success: true, 
      tweet, 
      upvoted,
      upvoteCount: tweet.upvotes.length,
      priority: tweet.priority
    });
  }));

  // ================== Priority Calculation Function ==================
  function calculatePriority(tweet) {
    // Upvote weight: Each upvote adds 10 points
    const upvoteWeight = tweet.upvotes.length * 10;
    
    // Age weight: Older complaints get higher priority (2 points per day)
    const ageInDays = Math.floor((Date.now() - tweet.createdAt) / (1000 * 60 * 60 * 24));
    const ageWeight = ageInDays * 2;
    
    // Category weights (critical issues get higher priority)
    const categoryWeights = {
      'drainage': 9,
      'water_leakage': 9,
      'potholes': 8,
      'garbage': 7,
      'streetlight': 6,
      'public washroom': 5,
      'others': 3
    };
    
    const categoryWeight = categoryWeights[tweet.category] || 3;
    
    // Status weight (pending gets higher priority)
    const statusWeight = tweet.completed === 'pending' ? 5 : 0;
    
    return upvoteWeight + ageWeight + categoryWeight + statusWeight;
  }

  // ================== Get Priority Tweets (Admin) ==================
  router.get("/priority", authMiddleware, asyncHandler(async (req, res) => {
    const tweets = await Tweet.find({ completed: "pending" })
      .sort({ priority: -1, upvotes: -1, createdAt: 1 })
      .populate("user", "username")
      .limit(100);

    logger.info("Priority tweets fetched", { count: tweets.length, user: req.user.id });
    res.json({ success: true, tweets });
  }));

  // ================== Recent Tweets ==================
  router.get("/recent", asyncHandler(async (req, res) => {
    const recentTweets = await Tweet.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("user", "username");
    res.json({ success: true, tweets: recentTweets });
  }));

  // ================== Top Tweets ==================
  router.get("/top", asyncHandler(async (req, res) => {
    const topTweets = await Tweet.find()
      .sort({ likes: -1 })
      .limit(10)
      .populate("user", "username");
    res.json({ success: true, tweets: topTweets });
  }));

  // ================== Translate Tweet Text ==================
  router.post("/translate", asyncHandler(async (req, res) => {
    const { text } = req.body;

    if (!text) return res.status(400).json({ success: false, error: "Text is required" });

    const response = await fetch("https://libretranslate.de/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        q: text,
        source: "auto",
        target: "en",
        format: "text",
      }),
    });

    if (!response.ok) {
      throw new Error("Translation API failed");
    }

    const data = await response.json();
    res.json({ success: true, translated: data.translatedText });
  }));

  // ================== Get Stats for Dashboard ==================
  router.get("/stats", asyncHandler(async (req, res) => {
    const total = await Tweet.countDocuments();
    const pending = await Tweet.countDocuments({ completed: "Pending" });
    const inProgress = await Tweet.countDocuments({ completed: "In Progress" });
    const completed = await Tweet.countDocuments({ completed: "Completed" });

    res.json({
      success: true,
      total,
      pending,
      inProgress,
      completed,
    });
  }));

  return router;
};

 