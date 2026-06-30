import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import { Link } from "react-router-dom";
import "./Footer.css";

const Footer = () => {
  return (
    <footer className="gov-footer">
      <Container>
        {/* Main Footer Content */}
        <Row className="footer-main py-5">
          <Col md={4} className="mb-4 mb-md-0">
            <div className="footer-brand">
              <img
                src="/LOGO.jpg"
                alt="TMC Logo"
                className="footer-logo"
                onError={(e) => {
                  e.target.src = "https://img.freepik.com/free-vector/illustration-india-flag_53876-27130.jpg";
                }}
              />
              <h5 className="footer-title">CivicMate</h5>
              <p className="footer-subtitle">Thane Municipal Corporation</p>
            </div>
            <p className="footer-desc">
              Empowering citizens to report and track civic issues for a better Thane.
            </p>
            <div className="social-links">
              <a href="#" className="social-icon" aria-label="Facebook">
                <i className="fab fa-facebook-f"></i>
              </a>
              <a href="#" className="social-icon" aria-label="Twitter">
                <i className="fab fa-twitter"></i>
              </a>
              <a href="#" className="social-icon" aria-label="Instagram">
                <i className="fab fa-instagram"></i>
              </a>
              <a href="#" className="social-icon" aria-label="LinkedIn">
                <i className="fab fa-linkedin-in"></i>
              </a>
            </div>
          </Col>

          <Col md={3} className="mb-4 mb-md-0">
            <h6 className="footer-heading">Quick Links</h6>
            <ul className="footer-links">
              <li>
                <Link to="/">
                  <i className="fas fa-chevron-right me-2"></i>
                  Home
                </Link>
              </li>
              <li>
                <Link to="/create-tweet">
                  <i className="fas fa-chevron-right me-2"></i>
                  Report Issue
                </Link>
              </li>
              <li>
                <Link to="/profile">
                  <i className="fas fa-chevron-right me-2"></i>
                  My Profile
                </Link>
              </li>
              <li>
                <Link to="/login">
                  <i className="fas fa-chevron-right me-2"></i>
                  Login
                </Link>
              </li>
            </ul>
          </Col>

          <Col md={2} className="mb-4 mb-md-0">
            <h6 className="footer-heading">Information</h6>
            <ul className="footer-links">
              <li>
                <Link to="/contact">
                  <i className="fas fa-chevron-right me-2"></i>
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/privacy-policy">
                  <i className="fas fa-chevron-right me-2"></i>
                  Privacy Policy
                </Link>
              </li>
              <li>
                <a href="#about">
                  <i className="fas fa-chevron-right me-2"></i>
                  About Us
                </a>
              </li>
            </ul>
          </Col>

          <Col md={3}>
            <h6 className="footer-heading">Contact Info</h6>
            <ul className="footer-contact">
              <li>
                <i className="fas fa-map-marker-alt me-2"></i>
                Thane Municipal Corporation<br />
                <span className="ms-4">Thane, Maharashtra</span>
              </li>
              <li>
                <i className="fas fa-phone me-2"></i>
                1800-XXX-XXXX
              </li>
              <li>
                <i className="fas fa-envelope me-2"></i>
                civicmate@thanecity.gov.in
              </li>
              <li>
                <i className="fas fa-clock me-2"></i>
                Mon - Sat: 9:00 AM - 6:00 PM
              </li>
            </ul>
          </Col>
        </Row>

        {/* Footer Bottom */}
        <Row className="footer-bottom py-4">
          <Col md={6} className="text-center text-md-start mb-3 mb-md-0">
            <p className="mb-0">
              &copy; {new Date().getFullYear()} Thane Municipal Corporation. All rights reserved.
            </p>
          </Col>
          <Col md={6} className="text-center text-md-end">
            <p className="mb-0">
              Powered by <span className="text-accent">CivicMate</span> | 
              <span className="ms-2">शहर साहाय्य क्रांती</span>
            </p>
          </Col>
        </Row>
      </Container>

      {/* Government Badge */}
      <div className="gov-badge-footer">
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Emblem_of_India.svg/150px-Emblem_of_India.svg.png"
          alt="Government of India"
          className="emblem-img"
          onError={(e) => {
            e.target.style.display = "none";
          }}
        />
      </div>
    </footer>
  );
};

export default Footer;
