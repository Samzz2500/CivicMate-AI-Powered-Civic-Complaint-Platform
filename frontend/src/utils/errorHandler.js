// Centralized error handling for frontend

import { toast } from 'react-toastify';

export const handleApiError = (error, customMessage = null) => {
  console.error('API Error:', error);

  // Network error
  if (!error.response) {
    toast.error(customMessage || 'Network error. Please check your connection.');
    return {
      message: 'Network error',
      status: 0,
    };
  }

  // Server responded with error
  const { status, data } = error.response;
  const errorMessage = data?.error || data?.message || customMessage || 'An error occurred';

  // Handle specific status codes
  switch (status) {
    case 400:
      toast.error(errorMessage);
      break;
    case 401:
      toast.error('Session expired. Please login again.');
      localStorage.removeItem('token');
      window.location.href = '/login';
      break;
    case 403:
      toast.error('Access denied. ' + errorMessage);
      break;
    case 404:
      toast.error('Resource not found');
      break;
    case 429:
      toast.error('Too many requests. Please try again later.');
      break;
    case 500:
      toast.error('Server error. Please try again later.');
      break;
    default:
      toast.error(errorMessage);
  }

  return {
    message: errorMessage,
    status,
    details: data?.details || data?.errors,
  };
};

export const handleValidationErrors = (errors) => {
  if (Array.isArray(errors)) {
    errors.forEach(error => toast.error(error));
  } else if (typeof errors === 'string') {
    toast.error(errors);
  } else {
    toast.error('Validation error occurred');
  }
};
