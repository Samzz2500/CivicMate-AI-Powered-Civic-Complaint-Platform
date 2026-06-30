const logger = require('./logger');

let redisClient;
let isConnected = false;

// Initialize Redis client
const initializeCache = async () => {
  try {
    if (!process.env.REDIS_URL && !process.env.REDIS_HOST) {
      logger.warn('Redis not configured, caching disabled');
      return false;
    }

    const redis = require('redis');
    
    const redisConfig = process.env.REDIS_URL ? {
      url: process.env.REDIS_URL
    } : {
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379
      },
      password: process.env.REDIS_PASSWORD || undefined
    };

    redisClient = redis.createClient(redisConfig);

    redisClient.on('error', (err) => {
      logger.error('Redis error', { error: err.message });
      isConnected = false;
    });

    redisClient.on('connect', () => {
      logger.info('Redis connected');
      isConnected = true;
    });

    redisClient.on('disconnect', () => {
      logger.warn('Redis disconnected');
      isConnected = false;
    });

    await redisClient.connect();

    logger.info('✅ Cache service initialized');
    return true;
  } catch (error) {
    logger.error('Failed to initialize cache service', { error: error.message });
    return false;
  }
};

// Get value from cache
const get = async (key) => {
  if (!isConnected || !redisClient) {
    return null;
  }

  try {
    const value = await redisClient.get(key);
    if (value) {
      logger.debug('Cache hit', { key });
      return JSON.parse(value);
    }
    logger.debug('Cache miss', { key });
    return null;
  } catch (error) {
    logger.error('Cache get error', { key, error: error.message });
    return null;
  }
};

// Set value in cache
const set = async (key, value, ttl = 3600) => {
  if (!isConnected || !redisClient) {
    return false;
  }

  try {
    await redisClient.setEx(key, ttl, JSON.stringify(value));
    logger.debug('Cache set', { key, ttl });
    return true;
  } catch (error) {
    logger.error('Cache set error', { key, error: error.message });
    return false;
  }
};

// Delete key from cache
const del = async (key) => {
  if (!isConnected || !redisClient) {
    return false;
  }

  try {
    await redisClient.del(key);
    logger.debug('Cache deleted', { key });
    return true;
  } catch (error) {
    logger.error('Cache delete error', { key, error: error.message });
    return false;
  }
};

// Delete keys by pattern
const delPattern = async (pattern) => {
  if (!isConnected || !redisClient) {
    return false;
  }

  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
      logger.debug('Cache pattern deleted', { pattern, count: keys.length });
    }
    return true;
  } catch (error) {
    logger.error('Cache pattern delete error', { pattern, error: error.message });
    return false;
  }
};

// Check if key exists
const exists = async (key) => {
  if (!isConnected || !redisClient) {
    return false;
  }

  try {
    const result = await redisClient.exists(key);
    return result === 1;
  } catch (error) {
    logger.error('Cache exists error', { key, error: error.message });
    return false;
  }
};

// Increment value
const incr = async (key) => {
  if (!isConnected || !redisClient) {
    return null;
  }

  try {
    const value = await redisClient.incr(key);
    return value;
  } catch (error) {
    logger.error('Cache incr error', { key, error: error.message });
    return null;
  }
};

// Set expiry on key
const expire = async (key, ttl) => {
  if (!isConnected || !redisClient) {
    return false;
  }

  try {
    await redisClient.expire(key, ttl);
    return true;
  } catch (error) {
    logger.error('Cache expire error', { key, error: error.message });
    return false;
  }
};

// Get multiple keys
const mget = async (keys) => {
  if (!isConnected || !redisClient || keys.length === 0) {
    return [];
  }

  try {
    const values = await redisClient.mGet(keys);
    return values.map(v => v ? JSON.parse(v) : null);
  } catch (error) {
    logger.error('Cache mget error', { keys, error: error.message });
    return [];
  }
};

// Set multiple keys
const mset = async (keyValuePairs, ttl = 3600) => {
  if (!isConnected || !redisClient || keyValuePairs.length === 0) {
    return false;
  }

  try {
    const pipeline = redisClient.multi();
    
    for (const [key, value] of keyValuePairs) {
      pipeline.setEx(key, ttl, JSON.stringify(value));
    }
    
    await pipeline.exec();
    return true;
  } catch (error) {
    logger.error('Cache mset error', { error: error.message });
    return false;
  }
};

// Flush all cache
const flushAll = async () => {
  if (!isConnected || !redisClient) {
    return false;
  }

  try {
    await redisClient.flushAll();
    logger.warn('Cache flushed');
    return true;
  } catch (error) {
    logger.error('Cache flush error', { error: error.message });
    return false;
  }
};

// Get cache statistics
const getStats = async () => {
  if (!isConnected || !redisClient) {
    return { available: false };
  }

  try {
    const info = await redisClient.info('stats');
    const dbSize = await redisClient.dbSize();
    
    return {
      available: true,
      connected: isConnected,
      dbSize,
      info: info.split('\r\n').reduce((acc, line) => {
        const [key, value] = line.split(':');
        if (key && value) acc[key] = value;
        return acc;
      }, {})
    };
  } catch (error) {
    logger.error('Cache stats error', { error: error.message });
    return { available: false, error: error.message };
  }
};

// Cache middleware for Express routes
const cacheMiddleware = (ttl = 300) => {
  return async (req, res, next) => {
    if (!isConnected) {
      return next();
    }

    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const key = `cache:${req.originalUrl}`;
    
    try {
      const cachedData = await get(key);
      
      if (cachedData) {
        logger.debug('Serving from cache', { url: req.originalUrl });
        return res.json(cachedData);
      }

      // Store original res.json
      const originalJson = res.json.bind(res);

      // Override res.json
      res.json = (data) => {
        // Cache the response
        set(key, data, ttl).catch(err => {
          logger.error('Failed to cache response', { error: err.message });
        });

        // Send response
        return originalJson(data);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error', { error: error.message });
      next();
    }
  };
};

// Invalidate cache for specific patterns
const invalidateCache = async (patterns) => {
  if (!Array.isArray(patterns)) {
    patterns = [patterns];
  }

  for (const pattern of patterns) {
    await delPattern(pattern);
  }
};

// Close Redis connection
const closeCache = async () => {
  if (redisClient) {
    await redisClient.quit();
    isConnected = false;
    logger.info('Cache connection closed');
  }
};

module.exports = {
  initializeCache,
  get,
  set,
  del,
  delPattern,
  exists,
  incr,
  expire,
  mget,
  mset,
  flushAll,
  getStats,
  cacheMiddleware,
  invalidateCache,
  closeCache,
  isConnected: () => isConnected
};
