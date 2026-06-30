import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { API_ENDPOINTS } from "../config/api";
import FeedbackModal from "./FeedbackModal";
import "bootstrap/dist/css/bootstrap.min.css";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedTweetId, setSelectedTweetId] = useState(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const userResponse = await axios.get(API_ENDPOINTS.PROFILE, {
          headers: { Authorization: token },
        });
        setUser(userResponse.data);

        const tweetsResponse = await axios.get(
          userResponse.data.role === "admin"
            ? API_ENDPOINTS.TWEETS
            : API_ENDPOINTS.USER_TWEETS,
          {
            headers: { Authorization: token },
          }
        );
        setTweets(tweetsResponse.data);
      } catch (err) {
        setError(err.response ? err.response.data.message : "Error fetching profile");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleDelete = async (tweetId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(API_ENDPOINTS.TWEET_DELETED(tweetId), {
        headers: { Authorization: token },
      });
      toast.success("Tweet Deleted Successfully!");
      setTweets(tweets.filter((tweet) => tweet._id !== tweetId));
    } catch (error) {
      console.error("Error deleting tweet:", error);
      toast.success("Error While Deleting!");
    }
    

  };

  const handleStatusChange = async (tweetId, newStatus) => {
    try {
      const token = localStorage.getItem("token");
      const updatedTweet = await axios.patch(
        API_ENDPOINTS.TWEET_COMPLETED(tweetId),
        { completed: newStatus },
        {
          headers: { Authorization: token },
        }
      );
      toast.success("Status Updated!");
      setTweets(tweets.map((tweet) => (tweet._id === tweetId ? updatedTweet.data : tweet)));
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleUpvote = async (tweetId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API_ENDPOINTS.TWEETS}/${tweetId}/upvote`,
        {},
        { headers: { Authorization: token } }
      );
      
      toast.success(response.data.upvoted ? "Upvoted!" : "Upvote removed");
      
      // Update local state
      setTweets(tweets.map(tweet => 
        tweet._id === tweetId 
          ? { ...tweet, upvotes: response.data.tweet.upvotes, priority: response.data.tweet.priority }
          : tweet
      ));
    } catch (error) {
      toast.error("Failed to upvote");
    }
  };

  const handleOpenFeedback = (tweetId) => {
    setSelectedTweetId(tweetId);
    setShowFeedbackModal(true);
  };

  const handleFeedbackSubmit = () => {
    // Refresh tweets to update feedbackSubmitted status
    const fetchTweets = async () => {
      try {
        const token = localStorage.getItem("token");
        const tweetsResponse = await axios.get(
          user.role === "admin" ? API_ENDPOINTS.TWEETS : API_ENDPOINTS.USER_TWEETS,
          { headers: { Authorization: token } }
        );
        setTweets(tweetsResponse.data);
      } catch (err) {
        console.error("Error refreshing tweets:", err);
      }
    };
    fetchTweets();
  };

  if (loading) return <div className="text-center">Loading profile...</div>;
  if (error) return <div className="text-danger text-center">Error: {error}</div>;

  return (
    <div className="d-flex flex-column align-items-center" style={{ paddingTop: "70px", paddingBottom: "20px" }}>
      <div className="card mb-4" style={{ width: "25rem" }}>
        <div className="card-body">
          {user && (
            <div>
              <h2 className="card-title mb-3">{user.firstname} {user.lastname}</h2>
              <div className="mb-2"><strong>Email:</strong> {user.email}</div>
              <div className="mb-2"><strong>City:</strong> {user.city}</div>
              <div className="mb-2"><strong>State:</strong> {user.state}</div>
              <div className="mb-2"><strong>Pincode:</strong> {user.pincode}</div>
            </div>
          )}
        </div>
      </div>

      <h3 className="text-center">{user?.role === "admin" ? "All Tweets" : "Your Tweets"}</h3>
      <div className="container">
        <div className="row">
          {tweets.length === 0 ? (
            <p className="text-center w-100">No tweets found.</p>
          ) : (
            tweets.map((tweet) => (
              <div className="col-md-4 mb-4" key={tweet._id}>
                <div className="card">
                  <div className="card-body">
                    <h5 className="card-title">{tweet.title}</h5>
                    <p className="card-text">{tweet.description}</p>
                    <p><strong>Location:</strong> {tweet.location}</p>
                    <p><strong>Status:</strong> 
                      <span className={`badge ms-2 ${
                        tweet.completed === 'completed' ? 'bg-success' :
                        tweet.completed === 'in-progress' ? 'bg-warning' :
                        'bg-secondary'
                      }`}>
                        {tweet.completed}
                      </span>
                    </p>
                    {tweet.category && (
                      <p><strong>Category:</strong> 
                        <span className="badge bg-info ms-2">{tweet.category}</span>
                      </p>
                    )}
                    {tweet.image && (
                      <img
                        src={`http://localhost:5000/${tweet.image}`}
                        alt={tweet.title}
                        className="img-fluid mb-3"
                        style={{ width: "100%", height: "240px", objectFit: "cover", borderRadius: "8px" }}
                      />
                    )}
                    
                    {/* Upvote Button */}
                    <div className="mb-2">
                      <button 
                        className="btn btn-sm btn-outline-primary me-2"
                        onClick={() => handleUpvote(tweet._id)}
                      >
                        <i className="fas fa-arrow-up"></i> Upvote ({tweet.upvotes?.length || 0})
                      </button>
                      {tweet.priority > 0 && (
                        <span className={`badge ${
                          tweet.priority >= 50 ? 'bg-danger' :
                          tweet.priority >= 25 ? 'bg-warning' :
                          'bg-info'
                        }`}>
                          Priority: {tweet.priority >= 50 ? 'High' : tweet.priority >= 25 ? 'Medium' : 'Low'}
                        </span>
                      )}
                    </div>

                    {/* Feedback Button for Completed Tweets */}
                    {tweet.completed === 'completed' && !tweet.feedbackSubmitted && user.role !== 'admin' && (
                      <button 
                        className="btn btn-sm btn-success mb-2"
                        onClick={() => handleOpenFeedback(tweet._id)}
                      >
                        <i className="fas fa-star"></i> Rate Service
                      </button>
                    )}
                    {tweet.feedbackSubmitted && (
                      <p className="text-success mb-2">
                        <i className="fas fa-check-circle"></i> Feedback submitted
                      </p>
                    )}

                    {user.role === "admin" && (
                      <div className="mt-2">
                        <button className="btn btn-danger btn-sm me-2" onClick={() => handleDelete(tweet._id)}>
                          <i className="fas fa-trash"></i> Delete
                        </button>
                        <button 
                          className="btn btn-primary btn-sm" 
                          onClick={() => handleStatusChange(tweet._id, tweet.completed === "pending" ? "completed" : "pending")}
                        >
                          Mark as {tweet.completed === "pending" ? "Completed" : "Pending"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <FeedbackModal
          tweetId={selectedTweetId}
          onClose={() => setShowFeedbackModal(false)}
          onSubmit={handleFeedbackSubmit}
        />
      )}
    </div>
  );
};

export default Profile;
