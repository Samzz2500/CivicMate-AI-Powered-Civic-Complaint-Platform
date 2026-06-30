/**
 * Mobile API Routes - Optimized for Mobile Apps
 * Provides lightweight, optimized endpoints for mobile applications
 */

const express = require('express');
const router = express.Router();
const Tweet = require('../models/Tweet');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Feedback = require('../models/Feedback');
const { protect } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { get, set } = require('../utils/cacheService');

/**
 * @route   GET /api/mobile/feed
 * @desc    Get optimized complaint feed for mobile
 * @access  Public
 */
router.get('/feed', asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, category, status, lat, lng, radius = 10 } = req.query;
  
  const cacheKey = `mobile:feed:${page}:${limit}:${category}:${status}:${lat}:${lng}`;
  const cached = await get(cacheKey);
  if (cached) {
    return res.json({ success: true, ...JSON.parse(cached), cached: true });
  }

  const query = {};
  if (category) query.category = category;
  if (status) {
    if (status === 'completed') query.completed = true;
    else query.status = status;
  }

  // Location-based filtering
  if (lat && lng) {
    query['coordinates.coordinates'] = {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [parseFloat(lng), parseFloat(lat)]
        },
        $maxDistance: parseFloat(radius) * 1000 // Convert km to meters
      }
    };
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [complaints, total] = await Promise.all([
    Tweet.find(query)
      .select('title category status priority location image upvotes createdAt completed')
      .populate('user', 'username name')
      .sort({ priority: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Tweet.countDocuments(query)
  ]);

  // Optimize data for mobile
  const optimizedComplaints = complaints.map(c => ({
    id: c._id,
    title: c.title,
    category: c.category,
    status: c.status,
    priority: c.priority,
    location: c.location,
    image: c.image ? `/uploads/${c.image.split('/').pop()}` : null,
    upvoteCount: c.upvotes?.length || 0,
    createdAt: c.createdAt,
    completed: c.completed,
    user: {
      username: c.user?.username,
      name: c.user?.name
    }
  }));

  const response = {
    complaints: optimizedComplaints,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
      hasMore: skip + optimizedComplaints.length < total
    }
  };

  // Cache for 2 minutes
  await set(cacheKey, JSON.stringify(response), 120);

  res.json({ success: true, ...response });
}));

/**
 * @route   GET /api/mobile/complaint/:id
 * @desc    Get single complaint with minimal data
 * @access  Public
 */
router.get('/complaint/:id', asyncHandler(async (req, res) => {
  const complaint = await Tweet.findById(req.params.id)
    .populate('user', 'username name')
    .populate('comments.user', 'username name')
    .lean();

  if (!complaint) {
    return res.status(404).json({ success: false, error: 'Complaint not found' });
  }

  // Optimize for mobile
  const optimized = {
    id: complaint._id,
    title: complaint.title,
    description: complaint.description,
    category: complaint.category,
    status: complaint.status,
    priority: complaint.priority,
    location: complaint.location,
    image: complaint.image,
    upvoteCount: complaint.upvotes?.length || 0,
    commentCount: complaint.comments?.length || 0,
    completed: complaint.completed,
    createdAt: complaint.createdAt,
    updatedAt: complaint.updatedAt,
    user: {
      username: complaint.user?.username,
      name: complaint.user?.name
    },
    comments: complaint.comments?.slice(0, 5).map(c => ({
      id: c._id,
      text: c.text,
      user: {
        username: c.user?.username,
        name: c.user?.name
      },
      isAdmin: c.isAdmin,
      createdAt: c.createdAt
    })) || []
  };

  res.json({ success: true, complaint: optimized });
}));

/**
 * @route   GET /api/mobile/notifications
 * @desc    Get optimized notifications for mobile
 * @access  Private
 */
router.get('/notifications', protect, asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [notifications, unreadCount] = await Promise.all([
    Notification.find({ user: req.user._id })
      .select('type title message read createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Notification.countDocuments({ user: req.user._id, read: false })
  ]);

  res.json({
    success: true,
    notifications: notifications.map(n => ({
      id: n._id,
      type: n.type,
      title: n.title,
      message: n.message,
      read: n.read,
      createdAt: n.createdAt
    })),
    unreadCount,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      hasMore: notifications.length === parseInt(limit)
    }
  });
}));

/**
 * @route   GET /api/mobile/profile
 * @desc    Get user profile with stats (optimized)
 * @access  Private
 */
router.get('/profile', protect, asyncHandler(async (req, res) => {
  const [user, stats] = await Promise.all([
    User.findById(req.user._id)
      .select('username name email phone role createdAt')
      .lean(),
    Tweet.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: { $sum: { $cond: ['$completed', 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] } }
        }
      }
    ])
  ]);

  res.json({
    success: true,
    user: {
      id: user._id,
      username: user.username,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      memberSince: user.createdAt
    },
    stats: stats[0] || { total: 0, completed: 0, pending: 0, inProgress: 0 }
  });
}));

/**
 * @route   GET /api/mobile/categories
 * @desc    Get categories with complaint counts
 * @access  Public
 */
router.get('/categories', asyncHandler(async (req, res) => {
  const cacheKey = 'mobile:categories';
  const cached = await get(cacheKey);
  if (cached) {
    return res.json({ success: true, categories: JSON.parse(cached), cached: true });
  }

  const categories = await Tweet.aggregate([
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } }
      }
    },
    { $sort: { count: -1 } }
  ]);

  const categoryData = categories.map(cat => ({
    name: cat._id,
    label: getCategoryLabel(cat._id),
    icon: getCategoryIcon(cat._id),
    count: cat.count,
    pending: cat.pending
  }));

  // Cache for 5 minutes
  await set(cacheKey, JSON.stringify(categoryData), 300);

  res.json({ success: true, categories: categoryData });
}));

/**
 * @route   POST /api/mobile/quick-action
 * @desc    Quick actions for mobile (upvote, bookmark, etc.)
 * @access  Private
 */
router.post('/quick-action', protect, asyncHandler(async (req, res) => {
  const { action, complaintId } = req.body;

  const complaint = await Tweet.findById(complaintId);
  if (!complaint) {
    return res.status(404).json({ success: false, error: 'Complaint not found' });
  }

  let result = {};

  switch (action) {
    case 'upvote':
      const hasUpvoted = complaint.upvotes.includes(req.user._id);
      if (hasUpvoted) {
        complaint.upvotes = complaint.upvotes.filter(id => !id.equals(req.user._id));
        result.upvoted = false;
      } else {
        complaint.upvotes.push(req.user._id);
        result.upvoted = true;
      }
      await complaint.save();
      result.upvoteCount = complaint.upvotes.length;
      break;

    case 'bookmark':
      // Implement bookmark logic (add to user's bookmarks)
      result.bookmarked = true;
      break;

    case 'share':
      // Generate share link
      result.shareLink = `${process.env.FRONTEND_URL}/complaint/${complaintId}`;
      break;

    default:
      return res.status(400).json({ success: false, error: 'Invalid action' });
  }

  res.json({ success: true, action, result });
}));

/**
 * @route   GET /api/mobile/search
 * @desc    Optimized search for mobile
 * @access  Public
 */
router.get('/search', asyncHandler(async (req, res) => {
  const { q, limit = 10 } = req.query;

  if (!q || q.length < 2) {
    return res.json({ success: true, results: [] });
  }

  const searchRegex = new RegExp(q, 'i');

  const results = await Tweet.find({
    $or: [
      { title: searchRegex },
      { description: searchRegex },
      { location: searchRegex }
    ]
  })
    .select('title category status location createdAt')
    .limit(parseInt(limit))
    .lean();

  res.json({
    success: true,
    results: results.map(r => ({
      id: r._id,
      title: r.title,
      category: r.category,
      status: r.status,
      location: r.location,
      createdAt: r.createdAt
    })),
    query: q
  });
}));

/**
 * @route   GET /api/mobile/stats
 * @desc    Get platform statistics (lightweight)
 * @access  Public
 */
router.get('/stats', asyncHandler(async (req, res) => {
  const cacheKey = 'mobile:stats';
  const cached = await get(cacheKey);
  if (cached) {
    return res.json({ success: true, stats: JSON.parse(cached), cached: true });
  }

  const [total, completed, pending, users] = await Promise.all([
    Tweet.countDocuments(),
    Tweet.countDocuments({ completed: true }),
    Tweet.countDocuments({ status: 'pending' }),
    User.countDocuments()
  ]);

  const stats = {
    totalComplaints: total,
    completedComplaints: completed,
    pendingComplaints: pending,
    totalUsers: users,
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
  };

  // Cache for 5 minutes
  await set(cacheKey, JSON.stringify(stats), 300);

  res.json({ success: true, stats });
}));

/**
 * @route   POST /api/mobile/feedback
 * @desc    Submit feedback (optimized)
 * @access  Private
 */
router.post('/feedback', protect, asyncHandler(async (req, res) => {
  const { complaintId, rating, comment } = req.body;

  // Check if already submitted
  const existing = await Feedback.findOne({
    tweet: complaintId,
    user: req.user._id
  });

  if (existing) {
    return res.status(400).json({
      success: false,
      error: 'You have already submitted feedback for this complaint'
    });
  }

  const feedback = await Feedback.create({
    tweet: complaintId,
    user: req.user._id,
    rating,
    comment
  });

  res.status(201).json({
    success: true,
    message: 'Feedback submitted successfully',
    feedback: {
      id: feedback._id,
      rating: feedback.rating
    }
  });
}));

/**
 * @route   GET /api/mobile/nearby
 * @desc    Get nearby complaints (optimized for maps)
 * @access  Public
 */
router.get('/nearby', asyncHandler(async (req, res) => {
  const { lat, lng, radius = 5, limit = 50 } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ success: false, error: 'Latitude and longitude required' });
  }

  const complaints = await Tweet.find({
    'coordinates.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [parseFloat(lng), parseFloat(lat)]
        },
        $maxDistance: parseFloat(radius) * 1000
      }
    }
  })
    .select('title category status priority coordinates location')
    .limit(parseInt(limit))
    .lean();

  // Optimize for map markers
  const markers = complaints.map(c => ({
    id: c._id,
    title: c.title,
    category: c.category,
    status: c.status,
    priority: c.priority,
    lat: c.coordinates.coordinates[1],
    lng: c.coordinates.coordinates[0],
    location: c.location
  }));

  res.json({ success: true, markers, count: markers.length });
}));

// Helper functions
const getCategoryLabel = (category) => {
  const labels = {
    'potholes': 'Potholes',
    'streetlights': 'Street Lights',
    'garbage': 'Garbage',
    'water-supply': 'Water Supply',
    'sewage': 'Sewage',
    'roads': 'Roads',
    'parks': 'Parks',
    'public-toilets': 'Public Toilets',
    'other': 'Other'
  };
  return labels[category] || category;
};

const getCategoryIcon = (category) => {
  const icons = {
    'potholes': '🚧',
    'streetlights': '💡',
    'garbage': '🗑️',
    'water-supply': '💧',
    'sewage': '🚰',
    'roads': '🛣️',
    'parks': '🌳',
    'public-toilets': '🚻',
    'other': '📋'
  };
  return icons[category] || '📋';
};

module.exports = router;
