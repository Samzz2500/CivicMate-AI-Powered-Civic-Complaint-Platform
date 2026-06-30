import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate, Link } from "react-router-dom";
import { API_ENDPOINTS } from "../config/api";
import "./Login.css";

const Login = () => {
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(API_ENDPOINTS.LOGIN, credentials);
      const token = response.data.accessToken || response.data.token;
      localStorage.setItem("token", token);
      if (response.data.refreshToken) {
        localStorage.setItem("refreshToken", response.data.refreshToken);
      }
      if (response.data.user) {
        localStorage.setItem("user", JSON.stringify(response.data.user));
      }

      toast.success("You are now signed in.");

      if (response.data.user && response.data.user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/");
      }
    } catch (error) {
      const status = error.response?.status;
      const message = error.response?.data?.message;

      if (status === 423) {
        toast.error(
          "Your account is temporarily locked due to multiple unsuccessful attempts. Please try again after some time."
        );
      } else if (status === 400 || status === 401) {
        toast.error("Invalid username or password.");
      } else {
        toast.error(message || "Unable to sign in right now. Please try again.");
      }
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h5 className="login-title">Login</h5>
          <i className="fas fa-user-circle login-icon"></i>
        </div>

        <div className="login-body">
          <form onSubmit={handleSubmit}>
            <div className="login-form-group">
              <input
                type="text"
                name="username"
                placeholder="Username"
                className="login-input"
                onChange={handleChange}
                required
              />
            </div>

            <div className="login-form-group password-input-group">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                className="login-input"
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "👁️‍🗨️" : "👁️"}
              </button>
            </div>

            <button type="submit" className="login-button">
              Login
            </button>
          </form>

          {/* 🔹 Forgot password link */}
          <div className="login-footer">
            <Link to="/forgot-password">Forgot Password?</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
