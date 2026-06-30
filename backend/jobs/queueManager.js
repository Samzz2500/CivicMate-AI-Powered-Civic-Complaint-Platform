const logger = require('../utils/logger');

let Queue, Worker;
let emailQueue, smsQueue, notificationQueue, cleanupQueue, analyticsQueue;

// Initialize Bull queues
const initializeQueues = () => {
  try {
    // Check if Redis is configured
    if (!process.env.REDIS_URL && !process.env.REDIS_HOST) {
      logger.warn('Redis not configured, background jobs disabled');
      return false;
    }

    // Try to require Bull - it might not be installed
    let Bull;
    try {
      Bull = require('bull');
    } catch (err) {
      logger.warn('Bull not installed, background jobs disabled');
      return false;
    }
    
    const redisConfig = process.env.REDIS_URL ? {
      redis: process.env.REDIS_URL,
      settings: {
        maxRetriesPerRequest: 3,
        enableReadyCheck: false,
        retryStrategy: () => null // Don't retry on failure
      }
    } : {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        maxRetriesPerRequest: 3,
        enableReadyCheck: false,
        retryStrategy: () => null // Don't retry on failure
      }
    };

    // Create queues
    emailQueue = new Bull('email', redisConfig);
    smsQueue = new Bull('sms', redisConfig);
    notificationQueue = new Bull('notification', redisConfig);
    cleanupQueue = new Bull('cleanup', redisConfig);
    analyticsQueue = new Bull('analytics', redisConfig);

    // Setup processors
    setupEmailProcessor();
    setupSMSProcessor();
    setupNotificationProcessor();
    setupCleanupProcessor();
    setupAnalyticsProcessor();

    // Setup event listeners
    setupEventListeners();

    logger.info('✅ Background job queues initialized');
    return true;
  } catch (error) {
    logger.error('Failed to initialize queues', { error: error.message });
    // Clean up any partially created queues
    emailQueue = smsQueue = notificationQueue = cleanupQueue = analyticsQueue = null;
    return false;
  }
};

// Email Queue Processor
const setupEmailProcessor = () => {
  const { sendEmail } = require('../utils/emailService');

  emailQueue.process(async (job) => {
    const { to, template, data } = job.data;
    
    logger.info('Processing email job', { to, template, jobId: job.id });
    
    const result = await sendEmail(to, template, data);
    
    if (!result.success) {
      throw new Error(result.error);
    }
    
    return result;
  });
};

// SMS Queue Processor
const setupSMSProcessor = () => {
  const { sendSMS } = require('../utils/smsService');

  smsQueue.process(async (job) => {
    const { to, template, data } = job.data;
    
    logger.info('Processing SMS job', { to, template, jobId: job.id });
    
    const result = await sendSMS(to, template, data);
    
    if (!result.success) {
      throw new Error(result.error);
    }
    
    return result;
  });
};

// Notification Queue Processor
const setupNotificationProcessor = () => {
  const Notification = require('../models/Notification');

  notificationQueue.process(async (job) => {
    const notificationData = job.data;
    
    logger.info('Processing notification job', { 
      userId: notificationData.user, 
      type: notificationData.type,
      jobId: job.id 
    });
    
    const notification = await Notification.createNotification(notificationData);
    
    return { notificationId: notification._id };
  });
};

// Cleanup Queue Processor
const setupCleanupProcessor = () => {
  const RefreshToken = require('../models/RefreshToken');
  const fs = require('fs');
  const path = require('path');

  cleanupQueue.process('expired-tokens', async (job) => {
    logger.info('Cleaning up expired refresh tokens');
    
    const result = await RefreshToken.cleanupExpired();
    
    logger.info('Expired tokens cleaned', { count: result.deletedCount });
    return { deletedCount: result.deletedCount };
  });

  cleanupQueue.process('orphaned-images', async (job) => {
    logger.info('Cleaning up orphaned images');
    
    const Tweet = require('../models/Tweet');
    const uploadsDir = path.join(__dirname, '../uploads');
    
    // Get all images from database
    const tweets = await Tweet.find({ image: { $exists: true, $ne: null } }).select('image');
    const dbImages = new Set(tweets.map(t => t.image));
    
    // Get all files in uploads directory
    const files = fs.readdirSync(uploadsDir);
    
    let deletedCount = 0;
    for (const file of files) {
      if (!dbImages.has(file)) {
        const filePath = path.join(uploadsDir, file);
        const stats = fs.statSync(filePath);
        
        // Delete if older than 7 days
        const daysSinceCreation = (Date.now() - stats.birthtimeMs) / (1000 * 60 * 60 * 24);
        if (daysSinceCreation > 7) {
          fs.unlinkSync(filePath);
          deletedCount++;
        }
      }
    }
    
    logger.info('Orphaned images cleaned', { count: deletedCount });
    return { deletedCount };
  });
};

// Analytics Queue Processor
const setupAnalyticsProcessor = () => {
  const Tweet = require('../models/Tweet');

  analyticsQueue.process('recalculate-priorities', async (job) => {
    logger.info('Recalculating complaint priorities');
    
    const tweets = await Tweet.find({ completed: { $ne: 'completed' } });
    
    let updatedCount = 0;
    for (const tweet of tweets) {
      tweet.calculatePriority();
      await tweet.save();
      updatedCount++;
    }
    
    logger.info('Priorities recalculated', { count: updatedCount });
    return { updatedCount };
  });

  analyticsQueue.process('weekly-digest', async (job) => {
    logger.info('Generating weekly digests');
    
    const User = require('../models/User');
    const { sendWeeklyDigestEmail } = require('../utils/emailService');
    
    const users = await User.find({ 
      role: 'user',
      'preferences.emailNotifications': true 
    });
    
    let sentCount = 0;
    for (const user of users) {
      const tweets = await Tweet.find({ user: user._id });
      
      const stats = {
        total: tweets.length,
        pending: tweets.filter(t => t.completed === 'pending').length,
        inProgress: tweets.filter(t => t.completed === 'in-progress').length,
        completed: tweets.filter(t => t.completed === 'completed').length
      };
      
      if (stats.total > 0) {
        await sendWeeklyDigestEmail(user, stats);
        sentCount++;
      }
    }
    
    logger.info('Weekly digests sent', { count: sentCount });
    return { sentCount };
  });
};

// Setup event listeners
const setupEventListeners = () => {
  const queues = [emailQueue, smsQueue, notificationQueue, cleanupQueue, analyticsQueue];
  
  queues.forEach(queue => {
    if (!queue) return;

    queue.on('completed', (job, result) => {
      logger.debug('Job completed', { 
        queue: queue.name, 
        jobId: job.id 
      });
    });

    queue.on('failed', (job, err) => {
      logger.error('Job failed', { 
        queue: queue.name, 
        jobId: job.id, 
        error: err.message 
      });
    });

    queue.on('stalled', (job) => {
      logger.warn('Job stalled', { 
        queue: queue.name, 
        jobId: job.id 
      });
    });
  });
};

// Schedule recurring jobs
const scheduleRecurringJobs = () => {
  if (!cleanupQueue || !analyticsQueue) {
    logger.warn('Queues not initialized, skipping recurring jobs');
    return;
  }

  // Cleanup expired tokens every hour
  cleanupQueue.add('expired-tokens', {}, {
    repeat: { cron: '0 * * * *' } // Every hour
  });

  // Cleanup orphaned images daily at 2 AM
  cleanupQueue.add('orphaned-images', {}, {
    repeat: { cron: '0 2 * * *' } // Daily at 2 AM
  });

  // Recalculate priorities every 6 hours
  analyticsQueue.add('recalculate-priorities', {}, {
    repeat: { cron: '0 */6 * * *' } // Every 6 hours
  });

  // Send weekly digest every Monday at 9 AM
  analyticsQueue.add('weekly-digest', {}, {
    repeat: { cron: '0 9 * * 1' } // Monday at 9 AM
  });

  logger.info('✅ Recurring jobs scheduled');
};

// Add jobs to queues
const addEmailJob = (to, template, data, options = {}) => {
  if (!emailQueue) {
    logger.warn('Email queue not initialized');
    return null;
  }
  
  return emailQueue.add({ to, template, data }, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    ...options
  });
};

const addSMSJob = (to, template, data, options = {}) => {
  if (!smsQueue) {
    logger.warn('SMS queue not initialized');
    return null;
  }
  
  return smsQueue.add({ to, template, data }, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    ...options
  });
};

const addNotificationJob = (notificationData, options = {}) => {
  if (!notificationQueue) {
    logger.warn('Notification queue not initialized');
    return null;
  }
  
  return notificationQueue.add(notificationData, {
    attempts: 2,
    ...options
  });
};

// Get queue statistics
const getQueueStats = async () => {
  const queues = {
    email: emailQueue,
    sms: smsQueue,
    notification: notificationQueue,
    cleanup: cleanupQueue,
    analytics: analyticsQueue
  };

  const stats = {};

  for (const [name, queue] of Object.entries(queues)) {
    if (!queue) {
      stats[name] = { available: false };
      continue;
    }

    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount()
    ]);

    stats[name] = {
      available: true,
      waiting,
      active,
      completed,
      failed,
      delayed
    };
  }

  return stats;
};

// Graceful shutdown
const closeQueues = async () => {
  const queues = [emailQueue, smsQueue, notificationQueue, cleanupQueue, analyticsQueue];
  
  for (const queue of queues) {
    if (queue) {
      await queue.close();
    }
  }
  
  logger.info('All queues closed');
};

module.exports = {
  initializeQueues,
  scheduleRecurringJobs,
  addEmailJob,
  addSMSJob,
  addNotificationJob,
  getQueueStats,
  closeQueues
};
