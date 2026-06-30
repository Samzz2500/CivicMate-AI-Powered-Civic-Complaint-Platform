const express = require('express');
const router = express.Router();
const Tweet = require('../models/Tweet');
const { authMiddleware } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const {
  geocodeAddress,
  reverseGeocode,
  calculateDistance,
  getNearbyPlaces,
  validateCoordinates,
  getLocationFromIP
} = require('../utils/geolocationService');
const logger = require('../utils/logger');

/**
 * @swagger
 * /api/geolocation/geocode:
 *   post:
 *     summary: Convert address to coordinates
 *     tags: [Geolocation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - address
 *             properties:
 *               address:
 *                 type: string
 *                 example: Thane Railway Station, Mumbai
 *     responses:
 *       200:
 *         description: Coordinates retrieved
 */
router.post('/geocode', authMiddleware, asyncHandler(async (req, res) => {
  const { address } = req.body;

  if (!address) {
    throw new AppError('Address is required', 400);
  }

  const result = await geocodeAddress(address);

  if (!result.success) {
    throw new AppError(result.error, 400);
  }

  logger.info('Address geocoded', { address, userId: req.user.id });

  res.json({
    success: true,
    ...result
  });
}));

/**
 * @swagger
 * /api/geolocation/reverse-geocode:
 *   post:
 *     summary: Convert coordinates to address
 *     tags: [Geolocation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - latitude
 *               - longitude
 *             properties:
 *               latitude:
 *                 type: number
 *                 example: 19.2183
 *               longitude:
 *                 type: number
 *                 example: 72.9781
 *     responses:
 *       200:
 *         description: Address retrieved
 */
router.post('/reverse-geocode', authMiddleware, asyncHandler(async (req, res) => {
  const { latitude, longitude } = req.body;

  const validation = validateCoordinates(latitude, longitude);
  if (!validation.valid) {
    throw new AppError(validation.error, 400);
  }

  const result = await reverseGeocode(validation.latitude, validation.longitude);

  if (!result.success) {
    throw new AppError(result.error, 400);
  }

  logger.info('Coordinates reverse geocoded', { latitude, longitude, userId: req.user.id });

  res.json({
    success: true,
    ...result
  });
}));

/**
 * @swagger
 * /api/geolocation/nearby:
 *   get:
 *     summary: Get nearby complaints
 *     tags: [Geolocation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: latitude
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: longitude
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *           default: 5
 *           description: Radius in kilometers
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Nearby complaints retrieved
 */
router.get('/nearby', authMiddleware, asyncHandler(async (req, res) => {
  const { latitude, longitude, radius = 5, category, status } = req.query;

  const validation = validateCoordinates(latitude, longitude);
  if (!validation.valid) {
    throw new AppError(validation.error, 400);
  }

  const radiusInMeters = parseFloat(radius) * 1000;

  // Build query
  const query = {
    'coordinates.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [validation.longitude, validation.latitude]
        },
        $maxDistance: radiusInMeters
      }
    }
  };

  if (category) {
    query.category = category;
  }

  if (status) {
    query.completed = status;
  }

  const complaints = await Tweet.find(query)
    .populate('user', 'username firstname lastname')
    .limit(50)
    .lean();

  // Calculate distances
  const complaintsWithDistance = complaints.map(complaint => {
    if (complaint.coordinates && complaint.coordinates.coordinates) {
      const [lon, lat] = complaint.coordinates.coordinates;
      const distance = calculateDistance(
        validation.latitude,
        validation.longitude,
        lat,
        lon
      );

      return {
        ...complaint,
        distance: parseFloat(distance.toFixed(2))
      };
    }
    return complaint;
  });

  // Sort by distance
  complaintsWithDistance.sort((a, b) => (a.distance || 999) - (b.distance || 999));

  logger.info('Nearby complaints retrieved', {
    latitude: validation.latitude,
    longitude: validation.longitude,
    radius,
    count: complaintsWithDistance.length,
    userId: req.user.id
  });

  res.json({
    success: true,
    complaints: complaintsWithDistance,
    count: complaintsWithDistance.length,
    radius: parseFloat(radius),
    center: {
      latitude: validation.latitude,
      longitude: validation.longitude
    }
  });
}));

/**
 * @swagger
 * /api/geolocation/nearby-places:
 *   get:
 *     summary: Get nearby landmarks/places
 *     tags: [Geolocation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: latitude
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: longitude
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *           default: 5000
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           default: point_of_interest
 *     responses:
 *       200:
 *         description: Nearby places retrieved
 */
router.get('/nearby-places', authMiddleware, asyncHandler(async (req, res) => {
  const { latitude, longitude, radius = 5000, type = 'point_of_interest' } = req.query;

  const validation = validateCoordinates(latitude, longitude);
  if (!validation.valid) {
    throw new AppError(validation.error, 400);
  }

  const result = await getNearbyPlaces(
    validation.latitude,
    validation.longitude,
    parseInt(radius),
    type
  );

  if (!result.success) {
    throw new AppError(result.error, 400);
  }

  res.json({
    success: true,
    places: result.places,
    count: result.places.length
  });
}));

/**
 * @swagger
 * /api/geolocation/ip-location:
 *   get:
 *     summary: Get location from IP address
 *     tags: [Geolocation]
 *     responses:
 *       200:
 *         description: Location retrieved from IP
 */
router.get('/ip-location', asyncHandler(async (req, res) => {
  const ipAddress = req.headers['x-forwarded-for']?.split(',')[0] || 
                    req.connection.remoteAddress || 
                    req.socket.remoteAddress;

  const result = await getLocationFromIP(ipAddress);

  if (!result.success) {
    throw new AppError(result.error, 400);
  }

  res.json({
    success: true,
    ...result
  });
}));

/**
 * @swagger
 * /api/geolocation/heatmap:
 *   get:
 *     summary: Get complaint heatmap data
 *     tags: [Geolocation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Heatmap data retrieved
 */
router.get('/heatmap', authMiddleware, asyncHandler(async (req, res) => {
  const { category, status } = req.query;

  const query = {
    'coordinates.coordinates': { $exists: true, $ne: null }
  };

  if (category) {
    query.category = category;
  }

  if (status) {
    query.completed = status;
  }

  const complaints = await Tweet.find(query)
    .select('coordinates category completed priority')
    .lean();

  const heatmapData = complaints.map(complaint => ({
    location: {
      lat: complaint.coordinates.coordinates[1],
      lng: complaint.coordinates.coordinates[0]
    },
    weight: complaint.priority || 1,
    category: complaint.category,
    status: complaint.completed
  }));

  logger.info('Heatmap data retrieved', {
    count: heatmapData.length,
    category,
    status,
    userId: req.user.id
  });

  res.json({
    success: true,
    data: heatmapData,
    count: heatmapData.length
  });
}));

module.exports = router;
