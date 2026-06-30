import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_ENDPOINTS } from "../config/api";
import "./Login.css"; // reuse same dark theme

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [captcha, setCaptcha] = useState("");
  const [userInput, setUserInput] = useState("");
  const navigate = useNavigate();

  // Generate simple random captcha
  const generateCaptcha = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ123456789";
    let result = "";
    for (let i = 0; i < 5; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptcha(result);
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (userInput.toUpperCase() !== captcha) {
      toast.error("Captcha does not match!");
      generateCaptcha();
      setUserInput("");
      return;
    }

    try {
      await axios.post(API_ENDPOINTS.FORGOT_PASSWORD, {
        email,
      });
      toast.success("Reset link sent to your email!");
      navigate("/login");
    } catch (error) {
      toast.error("Error sending reset link!");
      console.error(error);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h5 className="login-title">Forgot Password</h5>
        </div>

        <div className="login-body">
          <form onSubmit={handleSubmit}>
            <div className="login-form-group">
              <input
                type="email"
                placeholder="Enter your email"
                className="login-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* CAPTCHA BOX */}
            <div className="login-form-group">
              <div
                style={{
                  background: "var(--secondary)",
                  padding: "0.75rem",
                  borderRadius: "6px",
                  fontFamily: "monospace",
                  letterSpacing: "4px",
                  fontSize: "1.2rem",
                  textAlign: "center",
                  color: "var(--primary)",
                  userSelect: "none",
                  marginBottom: "0.5rem",
                }}
              >
                {captcha}
              </div>

              <input
                type="text"
                placeholder="Enter captcha"
                className="login-input"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="login-button">
              Send Reset Link
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

export default ForgotPassword;
