import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { API_ENDPOINTS } from "../config/api";
import "./FeedbackModal.css";

const FeedbackModal = ({ tweetId, onClose, onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [hoveredRating, setHoveredRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_ENDPOINTS.BASE_URL}/feedback`,
        { tweetId, rating, comment },
        { headers: { Authorization: token } }
      );

      toast.success("Thank you for your feedback!");
      if (onSubmit) onSubmit();
      onClose();
    } catch (error) {
      const message = error.response?.data?.message || "Failed to submit feedback";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="feedback-modal-overlay" onClick={onClose}>
      <div className="feedback-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="feedback-modal-header">
          <h5 className="feedback-modal-title">
            <i className="fas fa-star text-warning me-2"></i>
            Rate This Service
          </h5>
          <button 
            type="button" 
            className="feedback-close-btn" 
            onClick={onClose}
            disabled={submitting}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="feedback-modal-body">
            <div className="text-center mb-4">
              <p className="feedback-question">
                How satisfied are you with the resolution?
              </p>
              <div className="star-rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <i
                    key={star}
                    className={`fas fa-star fa-2x ${
                      star <= (hoveredRating || rating) 
                        ? 'text-warning' 
                        : 'text-muted'
                    }`}
                    style={{ cursor: 'pointer', margin: '0 5px', transition: 'all 0.2s' }}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                  ></i>
                ))}
              </div>
              {rating > 0 && (
                <p className="rating-text mt-2">
                  {rating === 5 && "Excellent! 🌟"}
                  {rating === 4 && "Very Good! 👍"}
                  {rating === 3 && "Good 😊"}
                  {rating === 2 && "Fair 😐"}
                  {rating === 1 && "Needs Improvement 😞"}
                </p>
              )}
            </div>

            <div className="mb-3">
              <label className="form-label">
                Additional Comments <span className="text-muted">(Optional)</span>
              </label>
              <textarea
                className="form-control"
                rows="4"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength="500"
                placeholder="Tell us more about your experience..."
                disabled={submitting}
              ></textarea>
              <small className="text-muted">{comment.length}/500 characters</small>
            </div>
          </div>

          <div className="feedback-modal-footer">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={submitting || rating === 0}
            >
              {submitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Submitting...
                </>
              ) : (
                <>
                  <i className="fas fa-paper-plane me-2"></i>
                  Submit Feedback
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeedbackModal;
