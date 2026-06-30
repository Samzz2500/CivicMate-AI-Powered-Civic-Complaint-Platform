const express = require("express");
const router = express.Router();
const Feedback = require("../models/Feedback");
const Tweet = require("../models/Tweet");
const { authMiddleware } = require("../middleware/auth");
const { asyncHandler, AppError } = require("../middleware/errorHandler");
const logger = require("../utils/logger");

// ================== Submit Feedback ==================
router.post("/", authMiddleware, asyncHandler(async (req, res) => {
  const { tweetId, rating, comment } = req.body;

  // Validate rating
  if (!rating || rating < 1 || rating > 5) {
    throw new AppError("Rating must be between 1 and 5", 400);
  }

  // Check if tweet exists and is completed
  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new AppError("Tweet not found", 404);
  }

  // Only allow feedback for completed complaints
  if (tweet.completed !== 'completed') {
    throw new AppError("Can only rate completed complaints", 400);
  }

  // Check if user is the complaint owner
  if (tweet.user.toString() !== req.user.id) {
    throw new AppError("You can only rate your own complaints", 403);
  }

  // Check if feedback already exists
  const existingFeedback = await Feedback.findOne({ 
    tweet: tweetId, 
    user: req.user.id 
  });

  if (existingFeedback) {
    throw new AppError("You have already submitted feedback for this complaint", 400);
  }

  // Create feedback
  const feedback = new Feedback({
    tweet: tweetId,
    user: req.user.id,
    rating,
    comment: comment || ""
  });

  await feedback.save();

  // Mark tweet as feedback submitted
  tweet.feedbackSubmitted = true;
  await tweet.save();

  logger.info("Feedback submitted", { 
    feedbackId: feedback._id, 
    tweetId, 
    userId: req.user.id,
    rating 
  });

  res.status(201).json({ 
    success: true, 
    feedback,
    message: "Thank you for your feedback!" 
  });
}));

// ================== Get Feedback for a Tweet ==================
router.get("/:tweetId", asyncHandler(async (req, res) => {
  const feedback = await Feedback.find({ tweet: req.params.tweetId })
    .populate("user", "username")
    .sort({ createdAt: -1 });

  // Calculate average rating
  const avgRating = feedback.length > 0
    ? (feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length).toFixed(1)
    : 0;

  res.json({ 
    success: true, 
    feedback, 
    avgRating: parseFloat(avgRating),
    count: feedback.length
  });
}));

// ================== Get All Feedback (Admin) ==================
router.get("/", authMiddleware, asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;

  const feedback = await Feedback.find()
    .populate("user", "username")
    .populate("tweet", "title category")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Feedback.countDocuments();

  // Calculate overall statistics
  const stats = await Feedback.aggregate([
    {
      $group: {
        _id: null,
        avgRating: { $avg: "$rating" },
        totalFeedback: { $sum: 1 },
        ratingDistribution: {
          $push: "$rating"
        }
      }
    }
  ]);

  res.json({ 
    success: true, 
    feedback,
    stats: stats[0] || { avgRating: 0, totalFeedback: 0 },
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

// ================== Get User's Feedback ==================
router.get("/user/my-feedback", authMiddleware, asyncHandler(async (req, res) => {
  const feedback = await Feedback.find({ user: req.user.id })
    .populate("tweet", "title category completed")
    .sort({ createdAt: -1 });

  res.json({ 
    success: true, 
    feedback,
    count: feedback.length
  });
}));

module.exports = router;
