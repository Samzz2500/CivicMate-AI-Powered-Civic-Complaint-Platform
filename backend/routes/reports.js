/**
 * Advanced Reporting Routes
 * Provides comprehensive reporting and data export capabilities
 */

const express = require('express');
const router = express.Router();
const Tweet = require('../models/Tweet');
const User = require('../models/User');
const Feedback = require('../models/Feedback');
const { protect, adminOnly } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { translate } = require('../utils/i18n');

/**
 * @route   GET /api/reports/generate
 * @desc    Generate comprehensive report
 * @access  Admin
 */
router.get('/generate', protect, adminOnly, asyncHandler(async (req, res) => {
  const {
    type = 'summary',
    startDate,
    endDate,
    category,
    status,
    format = 'json'
  } = req.query;

  const query = {};
  if (startDate) query.createdAt = { $gte: new Date(startDate) };
  if (endDate) query.createdAt = { ...query.createdAt, $lte: new Date(endDate) };
  if (category) query.category = category;
  if (status) {
    if (status === 'completed') query.completed = true;
    else query.status = status;
  }

  let reportData;

  switch (type) {
    case 'summary':
      reportData = await generateSummaryReport(query);
      break;
    case 'detailed':
      reportData = await generateDetailedReport(query);
      break;
    case 'performance':
      reportData = await generatePerformanceReport(query);
      break;
    case 'satisfaction':
      reportData = await generateSatisfactionReport(query);
      break;
    default:
      reportData = await generateSummaryReport(query);
  }

  if (format === 'csv') {
    const csv = convertToCSV(reportData);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=report-${Date.now()}.csv`);
    return res.send(csv);
  }

  res.json({ success: true, report: reportData });
}));


/**
 * @route   GET /api/reports/export-csv
 * @desc    Export data to CSV
 * @access  Admin
 */
router.get('/export-csv', protect, adminOnly, asyncHandler(async (req, res) => {
  const { startDate, endDate, category, status } = req.query;

  const query = {};
  if (startDate) query.createdAt = { $gte: new Date(startDate) };
  if (endDate) query.createdAt = { ...query.createdAt, $lte: new Date(endDate) };
  if (category) query.category = category;
  if (status) {
    if (status === 'completed') query.completed = true;
    else query.status = status;
  }

  const complaints = await Tweet.find(query)
    .populate('user', 'username name email')
    .lean();

  const csvData = complaints.map(c => ({
    ID: c._id,
    Title: c.title,
    Description: c.description,
    Category: c.category,
    Status: c.status,
    Priority: c.priority,
    Location: c.location,
    User: c.user?.username || 'N/A',
    Upvotes: c.upvotes?.length || 0,
    Comments: c.comments?.length || 0,
    Created: new Date(c.createdAt).toLocaleDateString(),
    Completed: c.completed ? 'Yes' : 'No'
  }));

  const csv = convertToCSV(csvData);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=complaints-${Date.now()}.csv`);
  res.send(csv);
}));

// Helper functions
const generateSummaryReport = async (query) => {
  const [total, completed, pending, inProgress, byCategory, byPriority] = await Promise.all([
    Tweet.countDocuments(query),
    Tweet.countDocuments({ ...query, completed: true }),
    Tweet.countDocuments({ ...query, status: 'pending' }),
    Tweet.countDocuments({ ...query, status: 'in-progress' }),
    Tweet.aggregate([
      { $match: query },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]),
    Tweet.aggregate([
      { $match: { ...query, completed: false } },
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ])
  ]);

  return {
    summary: { total, completed, pending, inProgress },
    byCategory,
    byPriority,
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
  };
};

const generateDetailedReport = async (query) => {
  const complaints = await Tweet.find(query)
    .populate('user', 'username name')
    .select('-__v')
    .lean();

  return { complaints, count: complaints.length };
};

const generatePerformanceReport = async (query) => {
  const resolutionTimes = await Tweet.aggregate([
    { $match: { ...query, completed: true, actualResolutionDate: { $exists: true } } },
    {
      $project: {
        category: 1,
        days: {
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
        avgDays: { $avg: '$days' },
        minDays: { $min: '$days' },
        maxDays: { $max: '$days' }
      }
    }
  ]);

  return { resolutionTimes };
};

const generateSatisfactionReport = async (query) => {
  const complaints = await Tweet.find(query).select('_id').lean();
  const complaintIds = complaints.map(c => c._id);

  const ratings = await Feedback.aggregate([
    { $match: { tweet: { $in: complaintIds } } },
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

  return { ratings, avgRating: Math.round(avgRating * 10) / 10, total };
};

const convertToCSV = (data) => {
  if (!data || data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];

  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header];
      return typeof value === 'string' && value.includes(',')
        ? `"${value}"`
        : value;
    });
    csvRows.push(values.join(','));
  });

  return csvRows.join('\n');
};

module.exports = router;
