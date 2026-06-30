// Axios configuration with interceptors

import axios from 'axios';
import { handleApiError } from './errorHandler';

// Create axios instance
const axiosInstance = axios.create({
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors globally
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    handleApiError(error);
    return Promise.reject(error);
  }
);

export default axiosInstance;
