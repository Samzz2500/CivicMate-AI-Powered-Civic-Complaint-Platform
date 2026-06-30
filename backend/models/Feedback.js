const mongoose = require("mongoose");

const FeedbackSchema = new mongoose.Schema({
  tweet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tweet",
    required: true,
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    maxlength: 500,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to prevent duplicate feedback
FeedbackSchema.index({ tweet: 1, user: 1 }, { unique: true });

module.exports = mongoose.model("Feedback", FeedbackSchema);
