/**
 * Machine Learning Predictions Service
 * Provides intelligent predictions and insights for civic complaints
 */

const Tweet = require('../models/Tweet');
const User = require('../models/User');
const Feedback = require('../models/Feedback');

/**
 * Predict complaint resolution time based on historical data
 */
const predictResolutionTime = async (complaint) => {
  try {
    const { category, priority, location } = complaint;

    // Get historical data for similar complaints
    const historicalComplaints = await Tweet.find({
      category,
      completed: true,
      actualResolutionDate: { $exists: true }
    }).limit(100).lean();

    if (historicalComplaints.length === 0) {
      // Default estimates by category (in days)
      const defaultEstimates = {
        'potholes': 7,
        'streetlights': 5,
        'garbage': 3,
        'water-supply': 10,
        'sewage': 14,
        'roads': 21,
        'parks': 14,
        'public-toilets': 7,
        'other': 10
      };
      return {
        estimatedDays: defaultEstimates[category] || 10,
        confidence: 'low',
        basedOn: 'default',
        message: 'Estimate based on category average'
      };
    }

    // Calculate average resolution time
    let totalDays = 0;
    historicalComplaints.forEach(c => {
      const days = Math.ceil(
        (new Date(c.actualResolutionDate) - new Date(c.createdAt)) / (1000 * 60 * 60 * 24)
      );
      totalDays += days;
    });

    const avgDays = Math.ceil(totalDays / historicalComplaints.length);

    // Adjust based on priority
    const priorityMultiplier = {
      'critical': 0.5,
      'high': 0.7,
      'medium': 1.0,
      'low': 1.3
    };

    const estimatedDays = Math.ceil(avgDays * (priorityMultiplier[priority] || 1.0));

    return {
      estimatedDays,
      confidence: historicalComplaints.length > 50 ? 'high' : 'medium',
      basedOn: 'historical',
      sampleSize: historicalComplaints.length,
      message: `Based on ${historicalComplaints.length} similar complaints`
    };
  } catch (error) {
    console.error('Resolution time prediction error:', error);
    return {
      estimatedDays: 10,
      confidence: 'low',
      basedOn: 'default',
      message: 'Using default estimate'
    };
  }
};

/**
 * Predict complaint priority based on multiple factors
 */
const predictComplaintPriority = async (complaint) => {
  try {
    const { category, description, upvotes = [], location } = complaint;

    let score = 0;
    const factors = [];

    // Factor 1: Category urgency
    const categoryUrgency = {
      'water-supply': 10,
      'sewage': 9,
      'potholes': 8,
      'streetlights': 7,
      'garbage': 6,
      'roads': 7,
      'public-toilets': 6,
      'parks': 4,
      'other': 5
    };
    score += categoryUrgency[category] || 5;
    factors.push({ factor: 'Category', impact: categoryUrgency[category] || 5 });

    // Factor 2: Keyword analysis
    const urgentKeywords = ['emergency', 'urgent', 'dangerous', 'accident', 'injury', 'broken', 'overflow', 'leak'];
    const descLower = description.toLowerCase();
    const urgentCount = urgentKeywords.filter(kw => descLower.includes(kw)).length;
    score += urgentCount * 3;
    if (urgentCount > 0) {
      factors.push({ factor: 'Urgent Keywords', impact: urgentCount * 3 });
    }

    // Factor 3: Community engagement (upvotes)
    const upvoteScore = Math.min(upvotes.length * 0.5, 10);
    score += upvoteScore;
    if (upvoteScore > 0) {
      factors.push({ factor: 'Community Upvotes', impact: upvoteScore });
    }

    // Factor 4: Similar complaints in area
    if (location) {
      const nearbyComplaints = await Tweet.countDocuments({
        location: new RegExp(location.split(',')[0], 'i'),
        completed: false,
        category
      });
      const areaScore = Math.min(nearbyComplaints * 0.3, 5);
      score += areaScore;
      if (areaScore > 0) {
        factors.push({ factor: 'Area Complaints', impact: areaScore });
      }
    }

    // Determine priority level
    let priority, confidence;
    if (score >= 25) {
      priority = 'critical';
      confidence = 'high';
    } else if (score >= 18) {
      priority = 'high';
      confidence = 'high';
    } else if (score >= 12) {
      priority = 'medium';
      confidence = 'medium';
    } else {
      priority = 'low';
      confidence = 'medium';
    }

    return {
      priority,
      score: Math.round(score),
      confidence,
      factors,
      recommendation: getPriorityRecommendation(priority)
    };
  } catch (error) {
    console.error('Priority prediction error:', error);
    return {
      priority: 'medium',
      score: 10,
      confidence: 'low',
      factors: [],
      recommendation: 'Standard processing'
    };
  }
};

/**
 * Predict best department for complaint
 */
const predictDepartment = async (complaint) => {
  try {
    const { category, description, location } = complaint;

    // Category to department mapping
    const categoryDepartments = {
      'potholes': 'Roads & Infrastructure',
      'roads': 'Roads & Infrastructure',
      'streetlights': 'Electrical & Lighting',
      'garbage': 'Sanitation & Waste Management',
      'water-supply': 'Water Supply Department',
      'sewage': 'Sewage & Drainage',
      'parks': 'Parks & Recreation',
      'public-toilets': 'Sanitation & Waste Management',
      'other': 'General Administration'
    };

    const primaryDept = categoryDepartments[category] || 'General Administration';

    // Check for keyword-based department override
    const descLower = description.toLowerCase();
    const deptKeywords = {
      'Roads & Infrastructure': ['road', 'pothole', 'pavement', 'bridge', 'highway'],
      'Electrical & Lighting': ['light', 'electricity', 'power', 'lamp', 'pole'],
      'Sanitation & Waste Management': ['garbage', 'waste', 'trash', 'toilet', 'clean'],
      'Water Supply Department': ['water', 'tap', 'pipe', 'supply', 'leak'],
      'Sewage & Drainage': ['sewage', 'drain', 'overflow', 'manhole', 'gutter']
    };

    let maxMatches = 0;
    let suggestedDept = primaryDept;

    for (const [dept, keywords] of Object.entries(deptKeywords)) {
      const matches = keywords.filter(kw => descLower.includes(kw)).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        suggestedDept = dept;
      }
    }

    return {
      department: suggestedDept,
      confidence: maxMatches > 0 ? 'high' : 'medium',
      alternativeDepartments: maxMatches === 0 ? [primaryDept] : [],
      reason: maxMatches > 0 ? 'Based on description keywords' : 'Based on category'
    };
  } catch (error) {
    console.error('Department prediction error:', error);
    return {
      department: 'General Administration',
      confidence: 'low',
      alternativeDepartments: [],
      reason: 'Default assignment'
    };
  }
};

/**
 * Predict user satisfaction based on complaint handling
 */
const predictUserSatisfaction = async (complaintId) => {
  try {
    const complaint = await Tweet.findById(complaintId);
    if (!complaint) {
      return { satisfaction: 'unknown', confidence: 'low' };
    }

    let score = 50; // Start at neutral

    // Factor 1: Resolution time
    if (complaint.completed && complaint.actualResolutionDate) {
      const resolutionDays = Math.ceil(
        (new Date(complaint.actualResolutionDate) - new Date(complaint.createdAt)) / (1000 * 60 * 60 * 24)
      );
      
      if (resolutionDays <= 3) score += 20;
      else if (resolutionDays <= 7) score += 10;
      else if (resolutionDays <= 14) score += 0;
      else if (resolutionDays <= 30) score -= 10;
      else score -= 20;
    }

    // Factor 2: Admin engagement (comments)
    const adminComments = complaint.comments?.filter(c => c.isAdmin) || [];
    score += Math.min(adminComments.length * 5, 15);

    // Factor 3: Status updates
    const statusUpdates = complaint.history?.length || 0;
    score += Math.min(statusUpdates * 3, 10);

    // Factor 4: Actual feedback if available
    const feedback = await Feedback.findOne({ tweet: complaintId });
    if (feedback) {
      score = feedback.rating * 20; // Override with actual rating
    }

    // Determine satisfaction level
    let satisfaction, confidence;
    if (score >= 80) {
      satisfaction = 'very-satisfied';
      confidence = feedback ? 'high' : 'medium';
    } else if (score >= 60) {
      satisfaction = 'satisfied';
      confidence = feedback ? 'high' : 'medium';
    } else if (score >= 40) {
      satisfaction = 'neutral';
      confidence = 'medium';
    } else if (score >= 20) {
      satisfaction = 'dissatisfied';
      confidence = 'medium';
    } else {
      satisfaction = 'very-dissatisfied';
      confidence = 'medium';
    }

    return {
      satisfaction,
      score: Math.round(score),
      confidence,
      hasFeedback: !!feedback,
      recommendation: getSatisfactionRecommendation(satisfaction)
    };
  } catch (error) {
    console.error('Satisfaction prediction error:', error);
    return {
      satisfaction: 'unknown',
      score: 50,
      confidence: 'low',
      hasFeedback: false
    };
  }
};

/**
 * Predict complaint trends for next period
 */
const predictComplaintTrends = async (days = 30) => {
  try {
    // Get historical data
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days * 2); // Look back twice the prediction period

    const complaints = await Tweet.find({
      createdAt: { $gte: startDate, $lte: endDate }
    }).lean();

    // Split into two periods
    const midDate = new Date(startDate.getTime() + (endDate.getTime() - startDate.getTime()) / 2);
    const period1 = complaints.filter(c => new Date(c.createdAt) < midDate);
    const period2 = complaints.filter(c => new Date(c.createdAt) >= midDate);

    // Calculate growth rate
    const growthRate = period1.length > 0 
      ? ((period2.length - period1.length) / period1.length) * 100 
      : 0;

    // Predict next period
    const predictedCount = Math.round(period2.length * (1 + growthRate / 100));

    // Category breakdown
    const categoryTrends = {};
    complaints.forEach(c => {
      categoryTrends[c.category] = (categoryTrends[c.category] || 0) + 1;
    });

    // Sort categories by frequency
    const topCategories = Object.entries(categoryTrends)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category, count]) => ({
        category,
        count,
        trend: growthRate > 0 ? 'increasing' : growthRate < 0 ? 'decreasing' : 'stable'
      }));

    return {
      predictedCount,
      growthRate: Math.round(growthRate * 10) / 10,
      trend: growthRate > 10 ? 'increasing' : growthRate < -10 ? 'decreasing' : 'stable',
      confidence: complaints.length > 50 ? 'high' : 'medium',
      topCategories,
      recommendation: getTrendRecommendation(growthRate)
    };
  } catch (error) {
    console.error('Trend prediction error:', error);
    return {
      predictedCount: 0,
      growthRate: 0,
      trend: 'unknown',
      confidence: 'low',
      topCategories: []
    };
  }
};

/**
 * Predict optimal staff allocation
 */
const predictStaffAllocation = async () => {
  try {
    // Get pending complaints by category
    const pendingByCategory = await Tweet.aggregate([
      { $match: { completed: false } },
      { $group: { _id: '$category', count: { $sum: 1 }, avgPriority: { $avg: '$priority' } } },
      { $sort: { count: -1 } }
    ]);

    // Calculate workload score (count * priority)
    const allocations = pendingByCategory.map(cat => {
      const workloadScore = cat.count * (cat.avgPriority || 5);
      const recommendedStaff = Math.ceil(workloadScore / 20); // 20 complaints per staff

      return {
        category: cat._id,
        pendingComplaints: cat.count,
        averagePriority: Math.round(cat.avgPriority || 5),
        workloadScore: Math.round(workloadScore),
        recommendedStaff,
        urgency: workloadScore > 100 ? 'high' : workloadScore > 50 ? 'medium' : 'low'
      };
    });

    const totalStaffNeeded = allocations.reduce((sum, a) => sum + a.recommendedStaff, 0);

    return {
      allocations,
      totalStaffNeeded,
      recommendation: `Allocate ${totalStaffNeeded} staff members across departments`,
      confidence: 'high'
    };
  } catch (error) {
    console.error('Staff allocation prediction error:', error);
    return {
      allocations: [],
      totalStaffNeeded: 0,
      confidence: 'low'
    };
  }
};

// Helper functions
const getPriorityRecommendation = (priority) => {
  const recommendations = {
    'critical': 'Immediate action required - assign within 1 hour',
    'high': 'High priority - assign within 4 hours',
    'medium': 'Standard processing - assign within 24 hours',
    'low': 'Low priority - assign within 48 hours'
  };
  return recommendations[priority] || 'Standard processing';
};

const getSatisfactionRecommendation = (satisfaction) => {
  const recommendations = {
    'very-satisfied': 'Excellent service - use as best practice example',
    'satisfied': 'Good service - maintain current standards',
    'neutral': 'Acceptable - look for improvement opportunities',
    'dissatisfied': 'Needs improvement - follow up with user',
    'very-dissatisfied': 'Critical - immediate follow-up required'
  };
  return recommendations[satisfaction] || 'Monitor situation';
};

const getTrendRecommendation = (growthRate) => {
  if (growthRate > 20) {
    return 'Significant increase - consider increasing staff and resources';
  } else if (growthRate > 10) {
    return 'Moderate increase - monitor closely and prepare for higher workload';
  } else if (growthRate < -20) {
    return 'Significant decrease - excellent work, maintain current practices';
  } else if (growthRate < -10) {
    return 'Moderate decrease - good progress, continue current approach';
  } else {
    return 'Stable trend - maintain current operations';
  }
};

module.exports = {
  predictResolutionTime,
  predictComplaintPriority,
  predictDepartment,
  predictUserSatisfaction,
  predictComplaintTrends,
  predictStaffAllocation
};
