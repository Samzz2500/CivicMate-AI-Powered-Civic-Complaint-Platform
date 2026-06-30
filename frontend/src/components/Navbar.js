import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Navbar as BootstrapNavbar, Nav, Container, Button } from "react-bootstrap";
import axios from "axios";
import { API_ENDPOINTS } from "../config/api";
import "./Navbar.css";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userRole, setUserRole] = useState(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (isLoggedIn()) {
      fetchUserRole();
    }
  }, [location]);

  const fetchUserRole = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const response = await axios.get(API_ENDPOINTS.PROFILE, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserRole(response.data.user?.role || null);
    } catch (error) {
      console.error("Error fetching user role:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUserRole(null);
    navigate("/");
    setExpanded(false);
  };

  const isLoggedIn = () => {
    return !!localStorage.getItem("token");
  };

  const closeNav = () => setExpanded(false);

  return (
    <BootstrapNavbar
      expanded={expanded}
      onToggle={setExpanded}
      expand="lg"
      className="gov-navbar shadow-sm"
      sticky="top"
    >
      <Container fluid>
        <BootstrapNavbar.Brand as={Link} to="/" className="brand-section" onClick={closeNav}>
          <div className="brand-logo">
            <img
              src="/LOGO.jpg"
              alt="TMC Logo"
              className="logo-img"
              onError={(e) => {
                e.target.src = "https://img.freepik.com/free-vector/illustration-india-flag_53876-27130.jpg";
              }}
            />
          </div>
          <div className="brand-text">
            <div className="brand-title">CivicMate</div>
            <div className="brand-subtitle">Thane Municipal Corporation</div>
          </div>
        </BootstrapNavbar.Brand>

        <BootstrapNavbar.Toggle aria-controls="navbar-nav" className="border-0">
          <span className="navbar-toggler-icon"></span>
        </BootstrapNavbar.Toggle>

        <BootstrapNavbar.Collapse id="navbar-nav">
          <Nav className="ms-auto align-items-lg-center">
            {isLoggedIn() ? (
              <>
                <Nav.Link as={Link} to="/" className="nav-link-custom" onClick={closeNav}>
                  <i className="fas fa-home me-1"></i>
                  Home
                </Nav.Link>
                {userRole !== "admin" && (
                  <Nav.Link as={Link} to="/create-tweet" className="nav-link-custom" onClick={closeNav}>
                    <i className="fas fa-bullhorn me-1"></i>
                    Report Issue
                  </Nav.Link>
                )}
                {userRole === "admin" && (
                  <Nav.Link as={Link} to="/admin" className="nav-link-custom" onClick={closeNav}>
                    <i className="fas fa-tachometer-alt me-1"></i>
                    Dashboard
                  </Nav.Link>
                )}
                <Nav.Link as={Link} to="/profile" className="nav-link-custom" onClick={closeNav}>
                  <i className="fas fa-user-circle me-1"></i>
                  Profile
                </Nav.Link>
                <Button
                  variant="outline-danger"
                  className="ms-lg-3 mt-2 mt-lg-0 logout-btn"
                  onClick={handleLogout}
                >
                  <i className="fas fa-sign-out-alt me-1"></i>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Nav.Link as={Link} to="/" className="nav-link-custom" onClick={closeNav}>
                  <i className="fas fa-home me-1"></i>
                  Home
                </Nav.Link>
                <Button
                  as={Link}
                  to="/login"
                  variant="outline-primary"
                  className="ms-lg-3 mt-2 mt-lg-0 auth-btn"
                  onClick={closeNav}
                >
                  <i className="fas fa-sign-in-alt me-1"></i>
                  Login
                </Button>
                <Button
                  as={Link}
                  to="/register"
                  variant="primary"
                  className="ms-lg-2 mt-2 mt-lg-0 auth-btn"
                  onClick={closeNav}
                >
                  <i className="fas fa-user-plus me-1"></i>
                  Register
                </Button>
              </>
            )}
          </Nav>
        </BootstrapNavbar.Collapse>
      </Container>
    </BootstrapNavbar>
  );
};

export default Navbar;
