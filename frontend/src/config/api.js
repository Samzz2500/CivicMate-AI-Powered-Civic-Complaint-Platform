// API configuration - centralized endpoint management

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const API_ENDPOINTS = {
  // Auth endpoints
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  REGISTER: `${API_BASE_URL}/api/auth/register`,
  PROFILE: `${API_BASE_URL}/api/auth/profile`,
  FORGOT_PASSWORD: `${API_BASE_URL}/api/auth/forgot-password`,
  RESET_PASSWORD: `${API_BASE_URL}/api/auth/reset-password`,
  USER_TWEETS: `${API_BASE_URL}/api/tweets/user`,
  
  // Tweet endpoints
  TWEETS: `${API_BASE_URL}/api/tweets`,
  RECENT_TWEETS: `${API_BASE_URL}/api/tweets/recent`,
  TOP_TWEETS: `${API_BASE_URL}/api/tweets/top`,
  TRANSLATE: `${API_BASE_URL}/api/tweets/translate`,
  
  // Admin endpoints
  TWEET_COMPLETED: (tweetId) => `${API_BASE_URL}/api/auth/tweetCompleted/${tweetId}`,
  TWEET_DELETED: (tweetId) => `${API_BASE_URL}/api/auth/tweetDeleted/${tweetId}`,
  
  // Tweet actions
  TWEET_COMMENT: (tweetId) => `${API_BASE_URL}/api/tweets/${tweetId}/comment`,
  TWEET_LIKE: (tweetId) => `${API_BASE_URL}/api/tweets/${tweetId}/like`,
  
  // Chatbot
  CHATBOT: `${API_BASE_URL}/api/chatbot`,
  
  // Static files
  UPLOADS: `${API_BASE_URL}/uploads`,
};

export default API_BASE_URL;
