import React, { useState } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { API_ENDPOINTS } from "../config/api";
import "./Login.css";

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { token } = useParams();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters!");
      return;
    }

    try {
      await axios.post(`${API_ENDPOINTS.RESET_PASSWORD}/${token}`, {
        newPassword,
      });
      toast.success("Password reset successful! Please login.");
      navigate("/login");
    } catch (error) {
      const message = error.response?.data?.message || "Error resetting password";
      toast.error(message);
      console.error(error);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h5 className="login-title">Reset Password</h5>
        </div>

        <div className="login-body">
          <form onSubmit={handleSubmit}>
            <div className="login-form-group">
              <input
                type="password"
                placeholder="New Password"
                className="login-input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <div className="login-form-group">
              <input
                type="password"
                placeholder="Confirm Password"
                className="login-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <button type="submit" className="login-button">
              Reset Password
            </button>
          </form>

          <div className="login-footer">
            <button
              onClick={() => navigate("/login")}
              className="btn btn-link"
              style={{ color: "var(--primary)" }}
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
