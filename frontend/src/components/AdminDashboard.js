import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { API_ENDPOINTS } from "../config/api";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const [tweets, setTweets] = useState([]);
  const [filteredTweets, setFilteredTweets] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [viewMode, setViewMode] = useState("all"); // 'all' or 'priority'
  const token = localStorage.getItem("token");

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "potholes", label: "Potholes" },
    { value: "streetlight", label: "Street Lights" },
    { value: "garbage", label: "Garbage" },
    { value: "drainage", label: "Drainage" },
    { value: "water_leakage", label: "Water Leakage" },
    { value: "public washroom", label: "Public Washroom" },
    { value: "others", label: "Others" },
  ];

  const statuses = [
    { value: "all", label: "All Status" },
    { value: "pending", label: "Pending" },
    { value: "in-progress", label: "In Progress" },
    { value: "completed", label: "Completed" },
  ];

  useEffect(() => {
    fetchTweets();
  }, []);

  const filterTweets = useCallback(() => {
    // Ensure tweets is an array
    const tweetsArray = Array.isArray(tweets) ? tweets : [];
    let filtered = tweetsArray;

    if (selectedCategory !== "all") {
      filtered = filtered.filter((tweet) => tweet.category === selectedCategory);
    }

    if (selectedStatus !== "all") {
      filtered = filtered.filter((tweet) => tweet.completed === selectedStatus);
    }

    setFilteredTweets(filtered);
  }, [tweets, selectedCategory, selectedStatus]);

  useEffect(() => {
    filterTweets();
  }, [filterTweets]);

  const fetchTweets = async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.TWEETS, {
        headers: { Authorization: token },
      });
      // Handle both response formats: {tweets: [...]} or direct array
      const tweetsData = response.data.tweets || response.data;
      setTweets(Array.isArray(tweetsData) ? tweetsData : []);
    } catch (error) {
      console.error("Error fetching tweets:", error);
      toast.error("Failed to fetch tweets");
      setTweets([]); // Set empty array on error
    }
  };

  const fetchPriorityTweets = async () => {
    try {
      const response = await axios.get(`${API_ENDPOINTS.TWEETS}/priority`, {
        headers: { Authorization: token },
      });
      setTweets(response.data.tweets || response.data);
      toast.success("Showing priority complaints");
    } catch (error) {
      console.error("Error fetching priority tweets:", error);
      toast.error("Failed to fetch priority tweets");
    }
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    if (mode === 'priority') {
      fetchPriorityTweets();
    } else {
      fetchTweets();
    }
  };

  // Calculate statistics
  const getStats = () => {
    // Ensure tweets is an array
    const tweetsArray = Array.isArray(tweets) ? tweets : [];
    
    const stats = {
      total: tweetsArray.length,
      pending: tweetsArray.filter((t) => t.completed === "pending").length,
      inProgress: tweetsArray.filter((t) => t.completed === "in-progress").length,
      completed: tweetsArray.filter((t) => t.completed === "completed").length,
      byCategory: {},
    };

    categories.forEach((cat) => {
      if (cat.value !== "all") {
        stats.byCategory[cat.value] = tweetsArray.filter((t) => t.category === cat.value).length;
      }
    });

    return stats;
  };

  const stats = getStats();

  const handleStatusChange = async (tweetId, newStatus) => {
    try {
      await axios.patch(
        API_ENDPOINTS.TWEET_COMPLETED(tweetId),
        { completed: newStatus },
        { headers: { Authorization: token } }
      );
      toast.success(`Status updated to ${newStatus}`);
      fetchTweets();
    } catch (error) {
      console.error("Error updating tweet:", error);
      toast.error("Failed to update tweet");
    }
  };

  const handleDelete = async (tweetId) => {
    if (!window.confirm("Are you sure you want to delete this complaint?")) return;

    try {
      await axios.delete(API_ENDPOINTS.TWEET_DELETED(tweetId), {
        headers: { Authorization: token },
      });
      toast.success("Complaint deleted successfully");
      fetchTweets();
    } catch (error) {
      console.error("Error deleting tweet:", error);
      toast.error("Failed to delete complaint");
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="container-fluid mt-4">
        <h2 className="text-center mb-4">Admin Dashboard</h2>

        {/* Summary Cards */}
        <div className="row mb-4">
          <div className="col-md-3">
            <div className="summary-card total">
              <div className="card-icon">
                <i className="bi bi-clipboard-data"></i>
              </div>
              <div className="card-content">
                <h3>{stats.total}</h3>
                <p>Total Complaints</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="summary-card pending">
              <div className="card-icon">
                <i className="bi bi-clock-history"></i>
              </div>
              <div className="card-content">
                <h3>{stats.pending}</h3>
                <p>Pending</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="summary-card in-progress">
              <div className="card-icon">
                <i className="bi bi-gear"></i>
              </div>
              <div className="card-content">
                <h3>{stats.inProgress}</h3>
                <p>In Progress</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="summary-card completed">
              <div className="card-icon">
                <i className="bi bi-check-circle"></i>
              </div>
              <div className="card-content">
                <h3>{stats.completed}</h3>
                <p>Completed</p>
              </div>
            </div>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="row mb-3">
          <div className="col-12">
            <div className="btn-group" role="group">
              <button
                type="button"
                className={`btn ${viewMode === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => handleViewModeChange('all')}
              >
                <i className="bi bi-list-ul me-2"></i>
                All Complaints
              </button>
              <button
                type="button"
                className={`btn ${viewMode === 'priority' ? 'btn-danger' : 'btn-outline-danger'}`}
                onClick={() => handleViewModeChange('priority')}
              >
                <i className="bi bi-exclamation-triangle me-2"></i>
                Priority View
              </button>
            </div>
            {viewMode === 'priority' && (
              <span className="badge bg-info ms-3">
                Showing pending complaints sorted by priority
              </span>
            )}
          </div>
        </div>

        {/* Category Summary */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="category-summary">
              <h5 className="mb-3">
                <i className="bi bi-tags me-2"></i>Complaints by Category
              </h5>
              <div className="category-list">
                {categories.slice(1).map((cat) => (
                  <div key={cat.value} className="category-badge">
                    <span className="cat-name">{cat.label}</span>
                    <span className="cat-count">{stats.byCategory[cat.value] || 0}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="row mb-3">
          <div className="col-md-4">
            <label>
              <i className="bi bi-funnel me-2"></i>Filter by Category:
            </label>
            <select
              className="form-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-4">
            <label>
              <i className="bi bi-funnel me-2"></i>Filter by Status:
            </label>
            <select
              className="form-select"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              {statuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-4">
            <label>Showing Results:</label>
            <div className="result-count">
              <span className="badge bg-primary">
                {filteredTweets.length} of {tweets.length} complaints
              </span>
            </div>
          </div>
        </div>

        {/* Complaints Table */}
        <div className="table-responsive">
          <table className="table table-bordered table-hover">
            <thead className="table-dark">
              <tr>
                <th>Image</th>
                <th>Title</th>
                <th>Category</th>
                <th>Description</th>
                <th>Location</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTweets.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center">
                    No complaints found
                  </td>
                </tr>
              ) : (
                filteredTweets.map((tweet) => (
                  <tr key={tweet._id}>
                    <td>
                      {tweet.image && (
                        <img
                          src={`http://localhost:5000/${tweet.image}`}
                          alt="complaint"
                          style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "8px" }}
                        />
                      )}
                    </td>
                    <td>
                      <div>{tweet.title}</div>
                      {/* Priority Badge */}
                      {tweet.priority > 0 && (
                        <span className={`badge mt-1 ${
                          tweet.priority >= 50 ? 'bg-danger' :
                          tweet.priority >= 25 ? 'bg-warning text-dark' :
                          'bg-info'
                        }`}>
                          <i className="bi bi-exclamation-triangle me-1"></i>
                          Priority: {tweet.priority >= 50 ? 'High' : tweet.priority >= 25 ? 'Medium' : 'Low'} ({tweet.priority})
                        </span>
                      )}
                      {/* Upvote Count */}
                      {tweet.upvotes && tweet.upvotes.length > 0 && (
                        <span className="badge bg-primary mt-1 ms-1">
                          <i className="bi bi-arrow-up"></i> {tweet.upvotes.length} upvotes
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={`badge bg-info`}>
                        {tweet.category || "others"}
                      </span>
                    </td>
                    <td>{tweet.description}</td>
                    <td>{tweet.location}</td>
                    <td>
                      <select
                        className={`form-select form-select-sm status-${tweet.completed}`}
                        value={tweet.completed}
                        onChange={(e) => handleStatusChange(tweet._id, e.target.value)}
                      >
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    </td>
                    <td>{new Date(tweet.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(tweet._id)}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
