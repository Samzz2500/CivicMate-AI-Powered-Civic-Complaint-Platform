// Error Boundary Component
import React from 'react';
import { toast } from 'react-toastify';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    toast.error('Something went wrong. Please refresh the page.');
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container mt-5 text-center">
          <h2>Oops! Something went wrong</h2>
          <p className="text-muted">We're sorry for the inconvenience.</p>
          <button 
            className="btn btn-primary" 
            onClick={() => window.location.reload()}
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
