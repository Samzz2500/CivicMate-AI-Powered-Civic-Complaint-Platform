const mongoose = require("mongoose");

const TweetSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        index: '2dsphere'
      }
    },
    image: {
      type: String,
    },
    category: {
      type: String,
      enum: ["drainage", "garbage", "potholes", "public washroom", "streetlight", "water_leakage", "others"],
      default: "others",
    },
    completed: {
      type: String,
      enum: ["submitted", "assigned", "in-progress", "under-review", "resolved", "verified", "completed", "rejected"],
      default: "submitted",
    },
    // Tracking Workflow (Amazon-style tracking)
    workflow: {
      submitted: {
        status: { type: Boolean, default: true },
        timestamp: { type: Date, default: Date.now },
        completedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        note: String
      },
      assigned: {
        status: { type: Boolean, default: false },
        timestamp: Date,
        completedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        department: String,
        assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        note: String
      },
      inProgress: {
        status: { type: Boolean, default: false },
        timestamp: Date,
        completedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        note: String,
        progressPercentage: { type: Number, default: 0 }
      },
      underReview: {
        status: { type: Boolean, default: false },
        timestamp: Date,
        completedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        note: String
      },
      resolved: {
        status: { type: Boolean, default: false },
        timestamp: Date,
        completedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        note: String,
        resolutionDetails: String
      },
      verified: {
        status: { type: Boolean, default: false },
        timestamp: Date,
        completedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        verifiedBy: String, // Officer name
        note: String
      },
      completed: {
        status: { type: Boolean, default: false },
        timestamp: Date,
        completedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        note: String
      }
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      description: "Admin/staff assigned to handle this complaint"
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      description: "Department responsible for handling"
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      description: "Main officer who verified the completion"
    },
    rejectionReason: {
      type: String,
      description: "Reason if complaint is rejected"
    },
    estimatedResolutionDate: {
      type: Date,
      description: "Expected resolution date"
    },
    actualResolutionDate: {
      type: Date,
      description: "Actual completion date"
    },
    comments: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        text: {
          type: String,
          required: true,
        },
        date: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    internalNotes: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        note: {
          type: String,
          required: true,
        },
        date: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    history: [
      {
        status: {
          type: String,
          required: true
        },
        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true
        },
        date: {
          type: Date,
          default: Date.now
        },
        note: String
      }
    ],
    likes: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },
    upvotes: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: [],
      index: true
    },
    priority: {
      type: Number,
      default: 0,
      index: true
    },
    views: {
      type: Number,
      default: 0
    },
    shares: {
      type: Number,
      default: 0
    },
    feedbackSubmitted: {
      type: Boolean,
      default: false,
    },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for performance
TweetSchema.index({ createdAt: -1 });
TweetSchema.index({ category: 1, completed: 1 });
TweetSchema.index({ completed: 1, priority: -1 });
TweetSchema.index({ priority: -1, createdAt: -1 });
TweetSchema.index({ 'coordinates.coordinates': '2dsphere' });

// Virtual for upvote count
TweetSchema.virtual('upvoteCount').get(function() {
  return this.upvotes.length;
});

// Virtual for age in days
TweetSchema.virtual('ageInDays').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Method to calculate priority
TweetSchema.methods.calculatePriority = function() {
  const categoryWeights = {
    'drainage': 9,
    'water_leakage': 9,
    'potholes': 8,
    'garbage': 7,
    'streetlight': 6,
    'public washroom': 5,
    'others': 3
  };

  const statusWeights = {
    'pending': 5,
    'in-progress': 0,
    'completed': 0
  };

  const upvoteScore = this.upvotes.length * 10;
  const ageScore = this.ageInDays * 2;
  const categoryScore = categoryWeights[this.category] || 3;
  const statusScore = statusWeights[this.completed] || 0;

  this.priority = upvoteScore + ageScore + categoryScore + statusScore;
  return this.priority;
};

// Pre-save hook to update priority
TweetSchema.pre('save', function(next) {
  if (this.isModified('upvotes') || this.isModified('completed') || this.isNew) {
    this.calculatePriority();
  }
  next();
});

module.exports = mongoose.model("Tweet", TweetSchema);

