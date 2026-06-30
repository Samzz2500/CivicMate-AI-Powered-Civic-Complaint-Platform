// Extended tweet routes for edit, unlike, comment management
const express = require("express");
const Tweet = require("../models/Tweet");
const { authMiddleware } = require("../middleware/auth");
const { asyncHandler, AppError } = require("../middleware/errorHandler");
const { validateTweet, validateComment, sanitizeString } = require("../middleware/validation");
const logger = require("../utils/logger");
const router = express.Router();

// Edit tweet (owner only)
router.patch("/:tweetId", authMiddleware, validateTweet, asyncHandler(async (req, res) => {
  const tweet = await Tweet.findById(req.params.tweetId);

  if (!tweet) {
    throw new AppError("Tweet not found", 404);
  }

  if (tweet.user.toString() !== req.user.id) {
    throw new AppError("Not authorized to edit this tweet", 403);
  }

  const { title, description, location, category } = req.body;
  
  if (title) tweet.title = sanitizeString(title);
  if (description) tweet.description = sanitizeString(description);
  if (location) tweet.location = sanitizeString(location);
  if (category) tweet.category = category;

  await tweet.save();

  logger.info("Tweet updated", { tweetId: req.params.tweetId, userId: req.user.id });
  res.json({ success: true, tweet });
}));

// Unlike tweet (toggle like)
router.delete("/:tweetId/like", authMiddleware, asyncHandler(async (req, res) => {
  const tweet = await Tweet.findById(req.params.tweetId);

  if (!tweet) {
    throw new AppError("Tweet not found", 404);
  }

  const likeIndex = tweet.likes.indexOf(req.user.id);
  
  if (likeIndex === -1) {
    throw new AppError("You haven't liked this tweet", 400);
  }

  tweet.likes.splice(likeIndex, 1);
  await tweet.save();

  logger.info("Tweet unliked", { tweetId: req.params.tweetId, userId: req.user.id });
  res.json({ success: true, tweet });
}));

// Edit comment (owner only)
router.patch("/:tweetId/comment/:commentId", authMiddleware, validateComment, asyncHandler(async (req, res) => {
  const tweet = await Tweet.findById(req.params.tweetId);

  if (!tweet) {
    throw new AppError("Tweet not found", 404);
  }

  const comment = tweet.comments.id(req.params.commentId);

  if (!comment) {
    throw new AppError("Comment not found", 404);
  }

  if (comment.user.toString() !== req.user.id) {
    throw new AppError("Not authorized to edit this comment", 403);
  }

  comment.text = sanitizeString(req.body.text);
  await tweet.save();

  logger.info("Comment updated", { tweetId: req.params.tweetId, commentId: req.params.commentId });
  res.json({ success: true, tweet });
}));

// Delete comment (owner only)
router.delete("/:tweetId/comment/:commentId", authMiddleware, asyncHandler(async (req, res) => {
  const tweet = await Tweet.findById(req.params.tweetId);

  if (!tweet) {
    throw new AppError("Tweet not found", 404);
  }

  const comment = tweet.comments.id(req.params.commentId);

  if (!comment) {
    throw new AppError("Comment not found", 404);
  }

  if (comment.user.toString() !== req.user.id) {
    throw new AppError("Not authorized to delete this comment", 403);
  }

  comment.remove();
  await tweet.save();

  logger.info("Comment deleted", { tweetId: req.params.tweetId, commentId: req.params.commentId });
  res.json({ success: true, message: "Comment deleted" });
}));

module.exports = router;
