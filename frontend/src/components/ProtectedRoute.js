// Protected Route Component for Admin Access
import React from 'react';
import { Navigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const token = localStorage.getItem('token');

  if (!token) {
    toast.error('Please login to access this page');
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin) {
    try {
      const decoded = JSON.parse(atob(token.split('.')[1]));
      if (decoded.role !== 'admin') {
        toast.error('Access denied. Admin only.');
        return <Navigate to="/" replace />;
      }
    } catch (error) {
      toast.error('Invalid token');
      return <Navigate to="/login" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
