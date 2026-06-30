// Application constants

const TWEET_CATEGORIES = [
  'drainage',
  'garbage',
  'potholes',
  'public washroom',
  'streetlight',
  'water_leakage',
  'others'
];

const TWEET_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed'
};

const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin'
};

const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  UPLOAD_DIR: 'uploads/'
};

const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100
};

module.exports = {
  TWEET_CATEGORIES,
  TWEET_STATUS,
  USER_ROLES,
  FILE_UPLOAD,
  PAGINATION
};
