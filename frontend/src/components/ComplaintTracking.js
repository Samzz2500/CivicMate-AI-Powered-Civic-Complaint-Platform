import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ComplaintTracking.css';

const ComplaintTracking = () => {
  const { complaintId } = useParams();
  const navigate = useNavigate();
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTrackingDetails();
  }, [complaintId]);

  const fetchTrackingDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/tracking/${complaintId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setTracking(response.data.tracking);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch tracking details');
      setLoading(false);
    }
  };

  const getStageIcon = (icon) => {
    return <span className="stage-icon">{icon}</span>;
  };

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#4caf50';
      case 'pending': return '#ff9800';
      default: return '#2196f3';
    }
  };

  if (loading) {
    return (
      <div className="tracking-container">
        <div className="loading">Loading tracking details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tracking-container">
        <div className="error-message">{error}</div>
        <button onClick={() => navigate('/profile')} className="back-button">
          Back to Profile
        </button>
      </div>
    );
  }

  return (
    <div className="tracking-container">
      <div className="tracking-header">
        <button onClick={() => navigate('/profile')} className="back-button">
          ← Back
        </button>
        <h1>Track Your Complaint</h1>
      </div>

      {/* Complaint Summary */}
      <div className="complaint-summary">
        <div className="summary-row">
          <div className="summary-item">
            <span className="summary-label">Complaint ID:</span>
            <span className="summary-value">{tracking.complaintId}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Status:</span>
            <span className="summary-value status-badge" style={{ backgroundColor: getStatusColor(tracking.status) }}>
              {tracking.status.toUpperCase()}
            </span>
          </div>
        </div>
        <div className="summary-row">
          <div className="summary-item full-width">
            <span className="summary-label">Title:</span>
            <span className="summary-value">{tracking.title}</span>
          </div>
        </div>
        <div className="summary-row">
          <div className="summary-item">
            <span className="summary-label">Category:</span>
            <span className="summary-value">{tracking.category}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Location:</span>
            <span className="summary-value">{tracking.location}</span>
          </div>
        </div>
        {tracking.department && (
          <div className="summary-row">
            <div className="summary-item">
              <span className="summary-label">Department:</span>
              <span className="summary-value">{tracking.department.name}</span>
            </div>
            {tracking.department.contactEmail && (
              <div className="summary-item">
                <span className="summary-label">Contact:</span>
                <span className="summary-value">{tracking.department.contactEmail}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="progress-section">
        <div className="progress-header">
          <span className="progress-label">Overall Progress</span>
          <span className="progress-percentage">{tracking.progressPercentage}%</span>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${tracking.progressPercentage}%` }}
          ></div>
        </div>
        {tracking.estimatedCompletion && !tracking.actualCompletion && (
          <div className="estimated-completion">
            <span>Estimated Completion: {formatDate(tracking.estimatedCompletion)}</span>
          </div>
        )}
        {tracking.actualCompletion && (
          <div className="actual-completion">
            <span>✅ Completed on: {formatDate(tracking.actualCompletion)}</span>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="timeline-section">
        <h2>Complaint Journey</h2>
        <div className="timeline">
          {tracking.timeline.map((stage, index) => (
            <div 
              key={stage.stage} 
              className={`timeline-item ${stage.status}`}
            >
              <div className="timeline-marker">
                {stage.status === 'completed' ? (
                  <div className="marker-completed">✓</div>
                ) : (
                  <div className="marker-pending">
                    {index + 1}
                  </div>
                )}
              </div>
              <div className="timeline-content">
                <div className="timeline-header">
                  {getStageIcon(stage.icon)}
                  <h3>{stage.title}</h3>
                  {stage.status === 'completed' && stage.timestamp && (
                    <span className="timeline-date">{formatDate(stage.timestamp)}</span>
                  )}
                </div>
                <p className="timeline-description">{stage.description}</p>
                
                {stage.note && (
                  <div className="timeline-note">
                    <strong>Note:</strong> {stage.note}
                  </div>
                )}

                {stage.progressPercentage !== undefined && (
                  <div className="stage-progress">
                    <span>Progress: {stage.progressPercentage}%</span>
                    <div className="mini-progress-bar">
                      <div 
                        className="mini-progress-fill" 
                        style={{ width: `${stage.progressPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {stage.resolutionDetails && (
                  <div className="resolution-details">
                    <strong>Resolution Details:</strong>
                    <p>{stage.resolutionDetails}</p>
                  </div>
                )}

                {stage.assignedTo && (
                  <div className="assigned-info">
                    <strong>Assigned To:</strong> {stage.assignedTo.name}
                    {stage.assignedTo.email && (
                      <span> ({stage.assignedTo.email})</span>
                    )}
                  </div>
                )}

                {stage.department && (
                  <div className="department-info">
                    <strong>Department:</strong> {stage.department.name}
                    {stage.department.contactPhone && (
                      <span> | Contact: {stage.department.contactPhone}</span>
                    )}
                  </div>
                )}

                {stage.completedBy && stage.status === 'completed' && (
                  <div className="completed-by">
                    <small>Updated by: {stage.completedBy.name}</small>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="tracking-actions">
        {tracking.status === 'completed' && !tracking.feedbackSubmitted && (
          <button 
            className="feedback-button"
            onClick={() => navigate(`/feedback/${complaintId}`)}
          >
            📝 Provide Feedback
          </button>
        )}
        <button 
          className="refresh-button"
          onClick={fetchTrackingDetails}
        >
          🔄 Refresh Status
        </button>
      </div>

      {/* Help Section */}
      <div className="help-section">
        <h3>Need Help?</h3>
        <p>If you have any questions about your complaint status, please contact:</p>
        {tracking.department && tracking.department.contactEmail && (
          <p>📧 Email: {tracking.department.contactEmail}</p>
        )}
        {tracking.department && tracking.department.contactPhone && (
          <p>📞 Phone: {tracking.department.contactPhone}</p>
        )}
        {!tracking.department && (
          <p>📧 Email: support@civicmate.com</p>
        )}
      </div>
    </div>
  );
};

export default ComplaintTracking;
