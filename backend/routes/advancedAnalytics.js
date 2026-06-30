/**
 * Advanced Analytics Dashboard Routes
 * Provides comprehensive analytics and insights for admins
 */

const express = require('express');
const router = express.Router();
const Tweet = require('../models/Tweet');
const User = require('../models/User');
const Feedback = require('../models/Feedback');
const { protect, adminOnly } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const {
  predictResolutionTime,
  predictComplaintPriority,
  predictDepartment,
  predictUserSatisfaction,
  predictComplaintTrends,
  predictStaffAllocation
} = require('../utils/mlPredictions');

/**
 * @route   GET /api/advanced-analytics/dashboard
 * @desc    Get comprehensive dashboard data
 * @access  Admin
 */
router.get('/dashboard', protect, adminOnly, asyncHandler(async (req, res) => {
  const { timeRange = '30' } = req.query;
  const days = parseInt(timeRange);
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Parallel data fetching for performance
  const [
    totalComplaints,
    pendingComplaints,
    inProgressComplaints,
    completedComplaints,
    totalUsers,
    activeUsers,
    avgResolutionTime,
    categoryBreakdown,
    priorityBreakdown,
    satisfactionData,
    trendData
  ] = await Promise.all([
    Tweet.countDocuments(),
    Tweet.countDocuments({ completed: false, status: 'pending' }),
    Tweet.countDocuments({ status: 'in-progress' }),
    Tweet.countDocuments({ completed: true }),
    User.countDocuments(),
    User.countDocuments({ lastLogin: { $gte: startDate } }),
    calculateAvgResolutionTime(days),
    getCategoryBreakdown(days),
    getPriorityBreakdown(),
    getSatisfactionData(),
    predictComplaintTrends(days)
  ]);

  // Calculate key metrics
  const completionRate = totalComplaints > 0 
    ? Math.round((completedComplaints / totalComplaints) * 100) 
    : 0;

  const responseRate = (pendingComplaints + inProgressComplaints + completedComplaints) > 0
    ? Math.round((inProgressComplaints + completedComplaints) / (pendingComplaints + inProgressComplaints + completedComplaints) * 100)
    : 0;

  res.json({
    success: true,
    data: {
      overview: {
        totalComplaints,
        pendingComplaints,
        inProgressComplaints,
        completedComplaints,
        completionRate,
        responseRate,
        totalUsers,
        activeUsers,
        avgResolutionTime
      },
      categoryBreakdown,
      priorityBreakdown,
      satisfactionData,
      trends: trendData,
      timeRange: days
    }
  });
}));

/**
 * @route   GET /api/advanced-analytics/performance-metrics
 * @desc    Get detailed performance metrics
 * @access  Admin
 */
router.get('/performance-metrics', protect, adminOnly, asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days));

  // Resolution time by category
  const resolutionByCategory = await Tweet.aggregate([
    {
      $match: {
        completed: true,
        actualResolutionDate: { $exists: true },
        createdAt: { $gte: startDate }
      }
    },
    {
      $project: {
        category: 1,
        resolutionDays: {
          $divide: [
            { $subtract: ['$actualResolutionDate', '$createdAt'] },
            1000 * 60 * 60 * 24
          ]
        }
      }
    },
    {
      $group: {
        _id: '$category',
        avgResolutionDays: { $avg: '$resolutionDays' },
        minResolutionDays: { $min: '$resolutionDays' },
        maxResolutionDays: { $max: '$resolutionDays' },
        count: { $sum: 1 }
      }
    },
    { $sort: { avgResolutionDays: 1 } }
  ]);

  // Response time (time to first admin action)
  const responseTimeData = await Tweet.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate },
        'history.0': { $exists: true }
      }
    },
    {
      $project: {
        responseHours: {
          $divide: [
            { $subtract: [{ $arrayElemAt: ['$history.date', 0] }, '$createdAt'] },
            1000 * 60 * 60
          ]
        }
      }
    },
    {
      $group: {
        _id: null,
        avgResponseHours: { $avg: '$responseHours' },
        minResponseHours: { $min: '$responseHours' },
        maxResponseHours: { $max: '$responseHours' }
      }
    }
  ]);

  // User engagement metrics
  const engagementMetrics = await Tweet.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: null,
        avgUpvotes: { $avg: { $size: '$upvotes' } },
        avgComments: { $avg: { $size: '$comments' } },
        totalUpvotes: { $sum: { $size: '$upvotes' } },
        totalComments: { $sum: { $size: '$comments' } }
      }
    }
  ]);

  // SLA compliance (assuming 7 days SLA)
  const slaCompliance = await Tweet.aggregate([
    {
      $match: {
        completed: true,
        actualResolutionDate: { $exists: true },
        createdAt: { $gte: startDate }
      }
    },
    {
      $project: {
        withinSLA: {
          $lte: [
            { $divide: [{ $subtract: ['$actualResolutionDate', '$createdAt'] }, 1000 * 60 * 60 * 24] },
            7
          ]
        }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        withinSLA: { $sum: { $cond: ['$withinSLA', 1, 0] } }
      }
    },
    {
      $project: {
        complianceRate: {
          $multiply: [{ $divide: ['$withinSLA', '$total'] }, 100]
        },
        total: 1,
        withinSLA: 1
      }
    }
  ]);

  res.json({
    success: true,
    data: {
      resolutionByCategory: resolutionByCategory.map(cat => ({
        category: cat._id,
        avgDays: Math.round(cat.avgResolutionDays * 10) / 10,
        minDays: Math.round(cat.minResolutionDays * 10) / 10,
        maxDays: Math.round(cat.maxResolutionDays * 10) / 10,
        count: cat.count
      })),
      responseTime: responseTimeData[0] ? {
        avgHours: Math.round(responseTimeData[0].avgResponseHours * 10) / 10,
        minHours: Math.round(responseTimeData[0].minResponseHours * 10) / 10,
        maxHours: Math.round(responseTimeData[0].maxResponseHours * 10) / 10
      } : null,
      engagement: engagementMetrics[0] || {},
      slaCompliance: slaCompliance[0] || { complianceRate: 0, total: 0, withinSLA: 0 }
    }
  });
}));

/**
 * @route   GET /api/advanced-analytics/heatmap-data
 * @desc    Get geographic heatmap data with intensity
 * @access  Admin
 */
router.get('/heatmap-data', protect, adminOnly, asyncHandler(async (req, res) => {
  const { category, status, days = 30 } = req.query;
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days));

  const query = {
    'coordinates.coordinates': { $exists: true },
    createdAt: { $gte: startDate }
  };

  if (category) query.category = category;
  if (status) {
    if (status === 'completed') query.completed = true;
    else if (status === 'pending') query.status = 'pending';
    else if (status === 'in-progress') query.status = 'in-progress';
  }

  const complaints = await Tweet.find(query)
    .select('coordinates priority category status location')
    .lean();

  // Group nearby complaints (within 0.01 degrees ~1km)
  const heatmapPoints = [];
  const processed = new Set();

  complaints.forEach((complaint, index) => {
    if (processed.has(index)) return;

    const [lng, lat] = complaint.coordinates.coordinates;
    let intensity = complaint.priority || 5;
    let count = 1;

    // Find nearby complaints
    complaints.forEach((other, otherIndex) => {
      if (index === otherIndex || processed.has(otherIndex)) return;

      const [otherLng, otherLat] = other.coordinates.coordinates;
      const distance = Math.sqrt(
        Math.pow(lat - otherLat, 2) + Math.pow(lng - otherLng, 2)
      );

      if (distance < 0.01) { // ~1km radius
        intensity += other.priority || 5;
        count++;
        processed.add(otherIndex);
      }
    });

    heatmapPoints.push({
      lat,
      lng,
      intensity: Math.round(intensity / count),
      count,
      category: complaint.category,
      location: complaint.location
    });

    processed.add(index);
  });

  // Sort by intensity
  heatmapPoints.sort((a, b) => b.intensity - a.intensity);

  res.json({
    success: true,
    data: {
      points: heatmapPoints,
      totalPoints: heatmapPoints.length,
      totalComplaints: complaints.length,
      hotspots: heatmapPoints.slice(0, 10) // Top 10 hotspots
    }
  });
}));

/**
 * @route   GET /api/advanced-analytics/predictions
 * @desc    Get ML predictions and insights
 * @access  Admin
 */
router.get('/predictions', protect, adminOnly, asyncHandler(async (req, res) => {
  const [trendPrediction, staffAllocation] = await Promise.all([
    predictComplaintTrends(30),
    predictStaffAllocation()
  ]);

  // Get recent complaints for priority prediction
  const recentComplaints = await Tweet.find({ completed: false })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  const complaintPredictions = await Promise.all(
    recentComplaints.map(async (complaint) => {
      const [priorityPred, deptPred, resolutionPred] = await Promise.all([
        predictComplaintPriority(complaint),
        predictDepartment(complaint),
        predictResolutionTime(complaint)
      ]);

      return {
        complaintId: complaint._id,
        title: complaint.title,
        currentPriority: complaint.priority,
        predictions: {
          priority: priorityPred,
          department: deptPred,
          resolutionTime: resolutionPred
        }
      };
    })
  );

  res.json({
    success: true,
    data: {
      trends: trendPrediction,
      staffAllocation,
      recentComplaintPredictions: complaintPredictions
    }
  });
}));

/**
 * @route   GET /api/advanced-analytics/time-series
 * @desc    Get time series data for charts
 * @access  Admin
 */
router.get('/time-series', protect, adminOnly, asyncHandler(async (req, res) => {
  const { days = 30, interval = 'daily' } = req.query;
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days));

  let groupBy;
  if (interval === 'hourly') {
    groupBy = {
      year: { $year: '$createdAt' },
      month: { $month: '$createdAt' },
      day: { $dayOfMonth: '$createdAt' },
      hour: { $hour: '$createdAt' }
    };
  } else if (interval === 'daily') {
    groupBy = {
      year: { $year: '$createdAt' },
      month: { $month: '$createdAt' },
      day: { $dayOfMonth: '$createdAt' }
    };
  } else { // weekly
    groupBy = {
      year: { $year: '$createdAt' },
      week: { $week: '$createdAt' }
    };
  }

  const timeSeriesData = await Tweet.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: groupBy,
        total: { $sum: 1 },
        completed: { $sum: { $cond: ['$completed', 1, 0] } },
        pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
        inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] } }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1 } }
  ]);

  res.json({
    success: true,
    data: {
      series: timeSeriesData,
      interval,
      days: parseInt(days)
    }
  });
}));

/**
 * @route   GET /api/advanced-analytics/user-insights
 * @desc    Get user behavior insights
 * @access  Admin
 */
router.get('/user-insights', protect, adminOnly, asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days));

  // Most active users
  const activeUsers = await Tweet.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    { $group: { _id: '$user', complaintCount: { $sum: 1 } } },
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
    { $unwind: '$userInfo' },
    {
      $project: {
        username: '$userInfo.username',
        name: '$userInfo.name',
        complaintCount: 1
      }
    }
  ]);

  // User retention (users who filed multiple complaints)
  const retentionData = await User.aggregate([
    {
      $lookup: {
        from: 'tweets',
        localField: '_id',
        foreignField: 'user',
        as: 'complaints'
      }
    },
    {
      $project: {
        complaintCount: { $size: '$complaints' },
        firstComplaint: { $min: '$complaints.createdAt' },
        lastComplaint: { $max: '$complaints.createdAt' }
      }
    },
    {
      $group: {
        _id: null,
        oneTime: { $sum: { $cond: [{ $eq: ['$complaintCount', 1] }, 1, 0] } },
        returning: { $sum: { $cond: [{ $gt: ['$complaintCount', 1] }, 1, 0] } },
        avgComplaints: { $avg: '$complaintCount' }
      }
    }
  ]);

  // Peak usage times
  const peakTimes = await Tweet.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: { hour: { $hour: '$createdAt' } },
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);

  res.json({
    success: true,
    data: {
      activeUsers,
      retention: retentionData[0] || { oneTime: 0, returning: 0, avgComplaints: 0 },
      peakTimes: peakTimes.map(pt => ({
        hour: pt._id.hour,
        count: pt.count,
        label: `${pt._id.hour}:00 - ${pt._id.hour + 1}:00`
      }))
    }
  });
}));

/**
 * @route   GET /api/advanced-analytics/comparative-analysis
 * @desc    Compare current period with previous period
 * @access  Admin
 */
router.get('/comparative-analysis', protect, adminOnly, asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;
  const period = parseInt(days);

  const currentEnd = new Date();
  const currentStart = new Date();
  currentStart.setDate(currentStart.getDate() - period);

  const previousEnd = new Date(currentStart);
  const previousStart = new Date(previousEnd);
  previousStart.setDate(previousStart.getDate() - period);

  const [currentData, previousData] = await Promise.all([
    getPerformanceData(currentStart, currentEnd),
    getPerformanceData(previousStart, previousEnd)
  ]);

  const comparison = {
    complaints: {
      current: currentData.total,
      previous: previousData.total,
      change: calculateChange(currentData.total, previousData.total),
      trend: currentData.total > previousData.total ? 'up' : 'down'
    },
    completionRate: {
      current: currentData.completionRate,
      previous: previousData.completionRate,
      change: calculateChange(currentData.completionRate, previousData.completionRate),
      trend: currentData.completionRate > previousData.completionRate ? 'up' : 'down'
    },
    avgResolutionTime: {
      current: currentData.avgResolutionTime,
      previous: previousData.avgResolutionTime,
      change: calculateChange(previousData.avgResolutionTime, currentData.avgResolutionTime), // Lower is better
      trend: currentData.avgResolutionTime < previousData.avgResolutionTime ? 'up' : 'down'
    },
    userSatisfaction: {
      current: currentData.avgRating,
      previous: previousData.avgRating,
      change: calculateChange(currentData.avgRating, previousData.avgRating),
      trend: currentData.avgRating > previousData.avgRating ? 'up' : 'down'
    }
  };

  res.json({
    success: true,
    data: {
      comparison,
      currentPeriod: { start: currentStart, end: currentEnd },
      previousPeriod: { start: previousStart, end: previousEnd }
    }
  });
}));

// Helper functions
const calculateAvgResolutionTime = async (days) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const result = await Tweet.aggregate([
    {
      $match: {
        completed: true,
        actualResolutionDate: { $exists: true },
        createdAt: { $gte: startDate }
      }
    },
    {
      $project: {
        resolutionDays: {
          $divide: [
            { $subtract: ['$actualResolutionDate', '$createdAt'] },
            1000 * 60 * 60 * 24
          ]
        }
      }
    },
    {
      $group: {
        _id: null,
        avgDays: { $avg: '$resolutionDays' }
      }
    }
  ]);

  return result[0] ? Math.round(result[0].avgDays * 10) / 10 : 0;
};

const getCategoryBreakdown = async (days) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const breakdown = await Tweet.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: '$category',
        total: { $sum: 1 },
        completed: { $sum: { $cond: ['$completed', 1, 0] } },
        pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } }
      }
    },
    { $sort: { total: -1 } }
  ]);

  return breakdown.map(cat => ({
    category: cat._id,
    total: cat.total,
    completed: cat.completed,
    pending: cat.pending,
    completionRate: Math.round((cat.completed / cat.total) * 100)
  }));
};

const getPriorityBreakdown = async () => {
  const breakdown = await Tweet.aggregate([
    { $match: { completed: false } },
    { $group: { _id: '$priority', count: { $sum: 1 } } },
    { $sort: { _id: -1 } }
  ]);

  return breakdown.map(p => ({
    priority: p._id,
    count: p.count
  }));
};

const getSatisfactionData = async () => {
  const ratings = await Feedback.aggregate([
    {
      $group: {
        _id: '$rating',
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const total = ratings.reduce((sum, r) => sum + r.count, 0);
  const avgRating = total > 0
    ? ratings.reduce((sum, r) => sum + (r._id * r.count), 0) / total
    : 0;

  return {
    distribution: ratings.map(r => ({ rating: r._id, count: r.count })),
    average: Math.round(avgRating * 10) / 10,
    total
  };
};

const getPerformanceData = async (startDate, endDate) => {
  const [complaints, completed, avgResTime, ratings] = await Promise.all([
    Tweet.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } }),
    Tweet.countDocuments({ createdAt: { $gte: startDate, $lte: endDate }, completed: true }),
    calculateAvgResolutionTime(Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))),
    Feedback.aggregate([
      {
        $lookup: {
          from: 'tweets',
          localField: 'tweet',
          foreignField: '_id',
          as: 'complaint'
        }
      },
      { $unwind: '$complaint' },
      { $match: { 'complaint.createdAt': { $gte: startDate, $lte: endDate } } },
      { $group: { _id: null, avgRating: { $avg: '$rating' } } }
    ])
  ]);

  return {
    total: complaints,
    completed,
    completionRate: complaints > 0 ? Math.round((completed / complaints) * 100) : 0,
    avgResolutionTime: avgResTime,
    avgRating: ratings[0] ? Math.round(ratings[0].avgRating * 10) / 10 : 0
  };
};

const calculateChange = (current, previous) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
};

module.exports = router;
