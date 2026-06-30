import React from "react";
import "./BrandLoading.css";

const BrandLoading = () => {
  return (
    <div className="brand-loading-screen">
      <div className="loading-content">
        {/* Logo */}
        <div className="logo-container">
          <img
            src="/LOGO.jpg"
            alt="Thane Municipal Corporation"
            className="brand-logo"
            onError={(e) => {
              e.target.src = "https://img.freepik.com/free-vector/illustration-india-flag_53876-27130.jpg";
            }}
          />
        </div>

        {/* Brand Name */}
        <h1 className="brand-name">CivicMate</h1>
        <p className="brand-tagline">शहर साहाय्य क्रांती</p>

        {/* Government Info */}
        <div className="gov-info">
          <p className="gov-text">Thane Municipal Corporation</p>
          <p className="gov-text-mr">ठाणे महानगरपालिका</p>
        </div>

        {/* Loading Spinner */}
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading...</p>
      </div>
    </div>
  );
};

export default BrandLoading;
