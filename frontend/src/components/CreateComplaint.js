import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './CreateComplaint.css';

const CreateComplaint = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    location: '',
    image: null
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  // Check if user is logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login to submit a complaint');
      navigate('/login');
    }
  }, [navigate]);

  const categories = [
    { value: 'potholes', label: '🚧 Potholes', icon: '🕳️', color: '#e74c3c' },
    { value: 'streetlight', label: '💡 Street Lights', icon: '💡', color: '#f39c12' },
    { value: 'garbage', label: '🗑️ Garbage Collection', icon: '🗑️', color: '#27ae60' },
    { value: 'drainage', label: '🌊 Drainage Issues', icon: '🌊', color: '#3498db' },
    { value: 'water_leakage', label: '💧 Water Leakage', icon: '💧', color: '#1abc9c' },
    { value: 'public washroom', label: '🚻 Public Washroom', icon: '🚻', color: '#9b59b6' },
    { value: 'others', label: '📋 Others', icon: '📋', color: '#95a5a6' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError('');
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }

      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setError('Please upload a valid image (JPEG, PNG, or WebP)');
        return;
      }

      setFormData({ ...formData, image: file });
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const removeImage = () => {
    setFormData({ ...formData, image: null });
    setImagePreview(null);
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Reverse geocode to get address
          const response = await axios.post(
            `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/geolocation/reverse-geocode`,
            { latitude, longitude }
          );

          if (response.data.success) {
            setFormData({ 
              ...formData, 
              location: response.data.data.formattedAddress 
            });
            setUseCurrentLocation(true);
          }
        } catch (err) {
          console.error('Geocoding error:', err);
          setFormData({ 
            ...formData, 
            location: `Lat: ${position.coords.latitude.toFixed(4)}, Lng: ${position.coords.longitude.toFixed(4)}` 
          });
          setUseCurrentLocation(true);
        } finally {
          setGettingLocation(false);
        }
      },
      (error) => {
        setError('Unable to get your location. Please enter manually.');
        setGettingLocation(false);
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validation
    if (!formData.title.trim()) {
      setError('Please enter a title');
      setLoading(false);
      return;
    }

    if (!formData.description.trim()) {
      setError('Please enter a description');
      setLoading(false);
      return;
    }

    if (!formData.category) {
      setError('Please select a category');
      setLoading(false);
      return;
    }

    if (!formData.location.trim()) {
      setError('Please enter a location');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please login to submit a complaint');
        navigate('/login');
        return;
      }

      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('description', formData.description);
      submitData.append('category', formData.category);
      submitData.append('location', formData.location);
      if (formData.image) {
        submitData.append('image', formData.image);
      }

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/tweets`,
        submitData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        setSuccess('Complaint submitted successfully! Redirecting...');
        setTimeout(() => {
          navigate('/profile');
        }, 2000);
      }
    } catch (err) {
      console.error('Submission error:', err);
      setError(err.response?.data?.error || 'Failed to submit complaint. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="create-complaint-container">
      <div className="create-complaint-card">
        <div className="form-header">
          <button className="back-btn" onClick={() => navigate(-1)}>
            ← Back
          </button>
          <h1>Report a Civic Issue</h1>
          <p className="subtitle">Help us make your city better</p>
        </div>

        {error && (
          <div className="alert alert-error">
            <span className="alert-icon">⚠️</span>
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            <span className="alert-icon">✅</span>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="complaint-form">
          {/* Title */}
          <div className="form-group">
            <label htmlFor="title">
              <span className="label-icon">📝</span>
              Issue Title
              <span className="required">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="e.g., Large pothole on Main Street"
              maxLength="100"
              required
            />
            <small className="char-count">{formData.title.length}/100</small>
          </div>

          {/* Category */}
          <div className="form-group">
            <label>
              <span className="label-icon">📂</span>
              Category
              <span className="required">*</span>
            </label>
            <div className="category-grid">
              {categories.map((cat) => (
                <div
                  key={cat.value}
                  className={`category-card ${formData.category === cat.value ? 'selected' : ''}`}
                  onClick={() => setFormData({ ...formData, category: cat.value })}
                  style={{ borderColor: formData.category === cat.value ? cat.color : '#e0e0e0' }}
                >
                  <span className="category-icon">{cat.icon}</span>
                  <span className="category-label">{cat.label.split(' ').slice(1).join(' ')}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="form-group">
            <label htmlFor="description">
              <span className="label-icon">📄</span>
              Description
              <span className="required">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe the issue in detail..."
              rows="5"
              maxLength="500"
              required
            />
            <small className="char-count">{formData.description.length}/500</small>
          </div>

          {/* Location */}
          <div className="form-group">
            <label htmlFor="location">
              <span className="label-icon">📍</span>
              Location
              <span className="required">*</span>
            </label>
            <div className="location-input-group">
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="Enter the location of the issue"
                required
                disabled={gettingLocation}
              />
              <button
                type="button"
                className="location-btn"
                onClick={getCurrentLocation}
                disabled={gettingLocation}
              >
                {gettingLocation ? '📍 Getting...' : '📍 Use Current Location'}
              </button>
            </div>
          </div>

          {/* Image Upload */}
          <div className="form-group">
            <label>
              <span className="label-icon">📷</span>
              Upload Photo
              <span className="optional">(Optional)</span>
            </label>
            
            {!imagePreview ? (
              <div className="image-upload-area">
                <input
                  type="file"
                  id="image"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                />
                <label htmlFor="image" className="upload-label">
                  <div className="upload-icon">📸</div>
                  <p className="upload-text">Click to upload or drag and drop</p>
                  <small className="upload-hint">JPEG, PNG, or WebP (Max 5MB)</small>
                </label>
              </div>
            ) : (
              <div className="image-preview-container">
                <img src={imagePreview} alt="Preview" className="image-preview" />
                <button type="button" className="remove-image-btn" onClick={removeImage}>
                  ✕ Remove
                </button>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="form-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={() => navigate(-1)}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Submitting...
                </>
              ) : (
                <>
                  <span>🚀</span>
                  Submit Complaint
                </>
              )}
            </button>
          </div>
        </form>

        {/* Info Box */}
        <div className="info-box">
          <h3>📋 What happens next?</h3>
          <ul>
            <li>✅ Your complaint will be verified by our AI system</li>
            <li>👥 It will be assigned to the relevant department</li>
            <li>🔔 You'll receive updates via email and SMS</li>
            <li>📊 Track your complaint status in real-time</li>
            <li>⭐ Rate our service once resolved</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CreateComplaint;
