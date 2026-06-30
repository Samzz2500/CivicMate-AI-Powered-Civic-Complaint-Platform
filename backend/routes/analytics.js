const express = require("express");
const router = express.Router();
const Tweet = require("../models/Tweet");
const Feedback = require("../models/Feedback");
const User = require("../models/User");
const { authMiddleware, adminMiddleware } = require("../middleware/auth");
const { asyncHandler } = require("../middleware/errorHandler");

/**
 * @swagger
 * /api/analytics/overview:
 *   get:
 *     summary: Get platform overview statistics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Overview statistics
 */
router.get("/overview", authMiddleware, adminMiddleware, asyncHandler(async (req, res) => {
  const [
    totalComplaints,
    pendingComplaints,
    inProgressComplaints,
    completedComplaints,
    totalUsers,
    totalFeedback,
    avgRating
  ] = await Promise.all([
    Tweet.countDocuments(),
    Tweet.countDocuments({ completed: 'pending' }),
    Tweet.countDocuments({ completed: 'in-progress' }),
    Tweet.countDocuments({ completed: 'completed' }),
    User.countDocuments({ role: 'user' }),
    Feedback.countDocuments(),
    Feedback.aggregate([
      { $group: { _id: null, avgRating: { $avg: '$rating' } } }
    ])
  ]);

  const completionRate = totalComplaints > 0 
    ? ((completedComplaints / totalComplaints) * 100).toFixed(2)
    : 0;

  res.json({
    success: true,
    overview: {
      totalComplaints,
      pendingComplaints,
      inProgressComplaints,
      completedComplaints,
      completionRate: parseFloat(completionRate),
      totalUsers,
      totalFeedback,
      averageRating: avgRating[0]?.avgRating?.toFixed(2) || 0
    }
  });
}));

/**
 * @swagger
 * /api/analytics/trends:
 *   get:
 *     summary: Get complaint trends over time
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *     responses:
 *       200:
 *         description: Trend data
 */
router.get("/trends", authMiddleware, adminMiddleware, asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days) || 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const trends = await Tweet.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
        },
        count: { $sum: 1 },
        pending: {
          $sum: { $cond: [{ $eq: ['$completed', 'pending'] }, 1, 0] }
        },
        inProgress: {
          $sum: { $cond: [{ $eq: ['$completed', 'in-progress'] }, 1, 0] }
        },
        completed: {
          $sum: { $cond: [{ $eq: ['$completed', 'completed'] }, 1, 0] }
        }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  res.json({
    success: true,
    trends,
    period: `${days} days`
  });
}));

/**
 * @swagger
 * /api/analytics/category-stats:
 *   get:
 *     summary: Get statistics by category
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Category statistics
 */
router.get("/category-stats", authMiddleware, adminMiddleware, asyncHandler(async (req, res) => {
  const categoryStats = await Tweet.aggregate([
    {
      $group: {
        _id: '$category',
        total: { $sum: 1 },
        pending: {
          $sum: { $cond: [{ $eq: ['$completed', 'pending'] }, 1, 0] }
        },
        inProgress: {
          $sum: { $cond: [{ $eq: ['$completed', 'in-progress'] }, 1, 0] }
        },
        completed: {
          $sum: { $cond: [{ $eq: ['$completed', 'completed'] }, 1, 0] }
        },
        avgPriority: { $avg: '$priority' },
        totalUpvotes: { $sum: { $size: '$upvotes' } }
      }
    },
    {
      $project: {
        category: '$_id',
        total: 1,
        pending: 1,
        inProgress: 1,
        completed: 1,
        avgPriority: { $round: ['$avgPriority', 2] },
        totalUpvotes: 1,
        completionRate: {
          $round: [
            { $multiply: [{ $divide: ['$completed', '$total'] }, 100] },
            2
          ]
        }
      }
    },
    { $sort: { total: -1 } }
  ]);

  res.json({
    success: true,
    categoryStats
  });
}));

/**
 * @swagger
 * /api/analytics/response-times:
 *   get:
 *     summary: Get average response and resolution times
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Response time statistics
 */
router.get("/response-times", authMiddleware, adminMiddleware, asyncHandler(async (req, res) => {
  const completedComplaints = await Tweet.find({
    completed: 'completed',
    actualResolutionDate: { $exists: true }
  }).select('createdAt actualResolutionDate category');

  const stats = completedComplaints.reduce((acc, complaint) => {
    const resolutionTime = (complaint.actualResolutionDate - complaint.createdAt) / (1000 * 60 * 60); // hours
    
    if (!acc[complaint.category]) {
      acc[complaint.category] = {
        category: complaint.category,
        count: 0,
        totalTime: 0,
        avgTime: 0
      };
    }
    
    acc[complaint.category].count++;
    acc[complaint.category].totalTime += resolutionTime;
    acc[complaint.category].avgTime = acc[complaint.category].totalTime / acc[complaint.category].count;
    
    return acc;
  }, {});

  const responseTimeStats = Object.values(stats).map(stat => ({
    category: stat.category,
    count: stat.count,
    avgResolutionTimeHours: stat.avgTime.toFixed(2),
    avgResolutionTimeDays: (stat.avgTime / 24).toFixed(2)
  }));

  res.json({
    success: true,
    responseTimeStats
  });
}));

/**
 * @swagger
 * /api/analytics/geographic-distribution:
 *   get:
 *     summary: Get geographic distribution of complaints
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Geographic distribution
 */
router.get("/geographic-distribution", authMiddleware, adminMiddleware, asyncHandler(async (req, res) => {
  // Group by location (simplified - in production, use proper geocoding)
  const locationStats = await Tweet.aggregate([
    {
      $group: {
        _id: '$location',
        count: { $sum: 1 },
        pending: {
          $sum: { $cond: [{ $eq: ['$completed', 'pending'] }, 1, 0] }
        },
        completed: {
          $sum: { $cond: [{ $eq: ['$completed', 'completed'] }, 1, 0] }
        }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 20 }
  ]);

  res.json({
    success: true,
    locationStats
  });
}));

/**
 * @swagger
 * /api/analytics/user-engagement:
 *   get:
 *     summary: Get user engagement metrics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User engagement statistics
 */
router.get("/user-engagement", authMiddleware, adminMiddleware, asyncHandler(async (req, res) => {
  const [
    activeUsers,
    topContributors,
    totalUpvotes,
    totalComments
  ] = await Promise.all([
    User.countDocuments({ 
      lastLogin: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    }),
    Tweet.aggregate([
      {
        $group: {
          _id: '$user',
          complaintCount: { $sum: 1 }
        }
      },
      { $sort: { complaintCount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      {
        $project: {
          userId: '$_id',
          username: { $arrayElemAt: ['$userInfo.username', 0] },
          complaintCount: 1
        }
      }
    ]),
    Tweet.aggregate([
      { $unwind: '$upvotes' },
      { $count: 'total' }
    ]),
    Tweet.aggregate([
      { $unwind: '$comments' },
      { $count: 'total' }
    ])
  ]);

  res.json({
    success: true,
    engagement: {
      activeUsers,
      topContributors,
      totalUpvotes: totalUpvotes[0]?.total || 0,
      totalComments: totalComments[0]?.total || 0
    }
  });
}));

/**
 * @swagger
 * /api/analytics/satisfaction:
 *   get:
 *     summary: Get satisfaction ratings analysis
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Satisfaction statistics
 */
router.get("/satisfaction", authMiddleware, adminMiddleware, asyncHandler(async (req, res) => {
  const satisfactionStats = await Feedback.aggregate([
    {
      $group: {
        _id: '$rating',
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const totalFeedback = satisfactionStats.reduce((sum, stat) => sum + stat.count, 0);
  const avgRating = satisfactionStats.reduce((sum, stat) => sum + (stat._id * stat.count), 0) / totalFeedback;

  const distribution = satisfactionStats.map(stat => ({
    rating: stat._id,
    count: stat.count,
    percentage: ((stat.count / totalFeedback) * 100).toFixed(2)
  }));

  res.json({
    success: true,
    satisfaction: {
      averageRating: avgRating.toFixed(2),
      totalFeedback,
      distribution
    }
  });
}));

module.exports = router;
