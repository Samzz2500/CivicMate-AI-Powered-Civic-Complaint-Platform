const logger = require('./logger');

let googleMapsClient;

// Initialize Google Maps client
const initializeGeolocation = () => {
  try {
    if (!process.env.GOOGLE_MAPS_API_KEY) {
      logger.warn('Google Maps API key not configured');
      return false;
    }

    const { Client } = require('@googlemaps/google-maps-services-js');
    googleMapsClient = new Client({});

    logger.info('Geolocation service initialized');
    return true;
  } catch (error) {
    logger.error('Failed to initialize geolocation service', { error: error.message });
    return false;
  }
};

// Geocode address to coordinates
const geocodeAddress = async (address) => {
  if (!googleMapsClient) {
    const initialized = initializeGeolocation();
    if (!initialized) {
      return { success: false, error: 'Geolocation service not configured' };
    }
  }

  try {
    const response = await googleMapsClient.geocode({
      params: {
        address,
        key: process.env.GOOGLE_MAPS_API_KEY,
        region: 'in' // India
      }
    });

    if (response.data.results.length === 0) {
      return { success: false, error: 'Address not found' };
    }

    const result = response.data.results[0];
    const location = result.geometry.location;

    return {
      success: true,
      coordinates: {
        type: 'Point',
        coordinates: [location.lng, location.lat] // [longitude, latitude]
      },
      formattedAddress: result.formatted_address,
      placeId: result.place_id,
      addressComponents: result.address_components
    };
  } catch (error) {
    logger.error('Geocoding failed', { address, error: error.message });
    return { success: false, error: error.message };
  }
};

// Reverse geocode coordinates to address
const reverseGeocode = async (latitude, longitude) => {
  if (!googleMapsClient) {
    const initialized = initializeGeolocation();
    if (!initialized) {
      return { success: false, error: 'Geolocation service not configured' };
    }
  }

  try {
    const response = await googleMapsClient.reverseGeocode({
      params: {
        latlng: `${latitude},${longitude}`,
        key: process.env.GOOGLE_MAPS_API_KEY
      }
    });

    if (response.data.results.length === 0) {
      return { success: false, error: 'Location not found' };
    }

    const result = response.data.results[0];

    return {
      success: true,
      address: result.formatted_address,
      placeId: result.place_id,
      addressComponents: result.address_components
    };
  } catch (error) {
    logger.error('Reverse geocoding failed', { latitude, longitude, error: error.message });
    return { success: false, error: error.message };
  }
};

// Calculate distance between two points (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance; // in kilometers
};

const toRadians = (degrees) => {
  return degrees * (Math.PI / 180);
};

// Get nearby places
const getNearbyPlaces = async (latitude, longitude, radius = 5000, type = 'point_of_interest') => {
  if (!googleMapsClient) {
    const initialized = initializeGeolocation();
    if (!initialized) {
      return { success: false, error: 'Geolocation service not configured' };
    }
  }

  try {
    const response = await googleMapsClient.placesNearby({
      params: {
        location: `${latitude},${longitude}`,
        radius,
        type,
        key: process.env.GOOGLE_MAPS_API_KEY
      }
    });

    return {
      success: true,
      places: response.data.results.map(place => ({
        name: place.name,
        address: place.vicinity,
        location: place.geometry.location,
        placeId: place.place_id,
        types: place.types
      }))
    };
  } catch (error) {
    logger.error('Nearby places search failed', { error: error.message });
    return { success: false, error: error.message };
  }
};

// Validate coordinates
const validateCoordinates = (latitude, longitude) => {
  const lat = parseFloat(latitude);
  const lon = parseFloat(longitude);

  if (isNaN(lat) || isNaN(lon)) {
    return { valid: false, error: 'Invalid coordinate format' };
  }

  if (lat < -90 || lat > 90) {
    return { valid: false, error: 'Latitude must be between -90 and 90' };
  }

  if (lon < -180 || lon > 180) {
    return { valid: false, error: 'Longitude must be between -180 and 180' };
  }

  return { valid: true, latitude: lat, longitude: lon };
};

// Get location from IP address (fallback)
const getLocationFromIP = async (ipAddress) => {
  try {
    // Using ip-api.com (free, no API key required)
    const response = await fetch(`http://ip-api.com/json/${ipAddress}`);
    const data = await response.json();

    if (data.status === 'success') {
      return {
        success: true,
        city: data.city,
        region: data.regionName,
        country: data.country,
        coordinates: {
          type: 'Point',
          coordinates: [data.lon, data.lat]
        },
        timezone: data.timezone
      };
    }

    return { success: false, error: 'Location not found' };
  } catch (error) {
    logger.error('IP geolocation failed', { ipAddress, error: error.message });
    return { success: false, error: error.message };
  }
};

// Format coordinates for display
const formatCoordinates = (coordinates) => {
  if (!coordinates || !coordinates.coordinates) {
    return 'N/A';
  }

  const [lon, lat] = coordinates.coordinates;
  return `${lat.toFixed(6)}°N, ${lon.toFixed(6)}°E`;
};

// Get map URL for coordinates
const getMapURL = (latitude, longitude, zoom = 15) => {
  return `https://www.google.com/maps?q=${latitude},${longitude}&z=${zoom}`;
};

// Get static map image URL
const getStaticMapURL = (latitude, longitude, width = 600, height = 400, zoom = 15) => {
  if (!process.env.GOOGLE_MAPS_API_KEY) {
    return null;
  }

  return `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=${zoom}&size=${width}x${height}&markers=color:red%7C${latitude},${longitude}&key=${process.env.GOOGLE_MAPS_API_KEY}`;
};

module.exports = {
  initializeGeolocation,
  geocodeAddress,
  reverseGeocode,
  calculateDistance,
  getNearbyPlaces,
  validateCoordinates,
  getLocationFromIP,
  formatCoordinates,
  getMapURL,
  getStaticMapURL
};
