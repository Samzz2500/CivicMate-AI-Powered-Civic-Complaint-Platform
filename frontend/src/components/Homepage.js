import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import axios from "axios";
import "./Homepage.css";

const Homepage = () => {
  const [language, setLanguage] = useState("en"); // en or mr (Marathi)
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/tweets/stats");
      setStats(response.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "mr" : "en");
  };

  const content = {
    en: {
      hero: {
        title: "Thane Municipal Corporation",
        subtitle: "Shahar Sahayya Kranti",
        tagline: "Your Voice, Our Priority - Building a Better Thane Together",
        cta: "Report an Issue",
        login: "Login",
      },
      stats: {
        title: "Civic Engagement Dashboard",
        total: "Total Complaints",
        pending: "Pending",
        inProgress: "In Progress",
        completed: "Resolved",
      },
      quickActions: {
        title: "Quick Actions",
        subtitle: "Report civic issues in your area",
        pothole: "Report Pothole",
        streetlight: "Street Light Issue",
        garbage: "Garbage Collection",
        water: "Water Supply",
        sewage: "Sewage Problem",
        other: "Other Issues",
      },
      howItWorks: {
        title: "How It Works",
        step1: {
          title: "Register & Login",
          desc: "Create your account to start reporting issues",
        },
        step2: {
          title: "Report Issue",
          desc: "Submit complaint with photo and location",
        },
        step3: {
          title: "Track Progress",
          desc: "Monitor status and receive updates",
        },
        step4: {
          title: "Rate Service",
          desc: "Provide feedback once issue is resolved",
        },
      },
      features: {
        title: "Platform Features",
        ai: {
          title: "AI-Powered Classification",
          desc: "Automatic issue categorization using machine learning",
        },
        priority: {
          title: "Priority System",
          desc: "Upvote important issues for faster resolution",
        },
        tracking: {
          title: "Real-time Tracking",
          desc: "Monitor complaint status from submission to resolution",
        },
        chatbot: {
          title: "AI Chatbot Support",
          desc: "Get instant help and guidance 24/7",
        },
      },
      contact: {
        title: "Contact Information",
        address: "Thane Municipal Corporation, Thane, Maharashtra",
        phone: "Helpline: 1800-XXX-XXXX",
        email: "Email: civicmate@thanecity.gov.in",
      },
    },
    mr: {
      hero: {
        title: "ठाणे महानगरपालिका",
        subtitle: "शहर साहाय्य क्रांती",
        tagline: "तुमचा आवाज, आमची प्राथमिकता - एकत्र एक चांगले ठाणे बांधूया",
        cta: "तक्रार नोंदवा",
        login: "लॉगिन",
      },
      stats: {
        title: "नागरी सहभाग डॅशबोर्ड",
        total: "एकूण तक्रारी",
        pending: "प्रलंबित",
        inProgress: "प्रगतीपथावर",
        completed: "निराकरण झाले",
      },
      quickActions: {
        title: "त्वरित कृती",
        subtitle: "तुमच्या क्षेत्रातील नागरी समस्या नोंदवा",
        pothole: "खड्डा नोंदवा",
        streetlight: "रस्त्यावरील दिवा",
        garbage: "कचरा संकलन",
        water: "पाणी पुरवठा",
        sewage: "सांडपाणी समस्या",
        other: "इतर समस्या",
      },
      howItWorks: {
        title: "हे कसे कार्य करते",
        step1: {
          title: "नोंदणी आणि लॉगिन",
          desc: "समस्या नोंदवण्यासाठी खाते तयार करा",
        },
        step2: {
          title: "समस्या नोंदवा",
          desc: "फोटो आणि स्थानासह तक्रार सबमिट करा",
        },
        step3: {
          title: "प्रगती ट्रॅक करा",
          desc: "स्थिती पहा आणि अपडेट मिळवा",
        },
        step4: {
          title: "सेवा रेट करा",
          desc: "समस्या सुटल्यानंतर अभिप्राय द्या",
        },
      },
      features: {
        title: "प्लॅटफॉर्म वैशिष्ट्ये",
        ai: {
          title: "AI-आधारित वर्गीकरण",
          desc: "मशीन लर्निंग वापरून स्वयंचलित समस्या वर्गीकरण",
        },
        priority: {
          title: "प्राधान्यता प्रणाली",
          desc: "जलद निराकरणासाठी महत्त्वाच्या समस्यांना अपवोट करा",
        },
        tracking: {
          title: "रिअल-टाइम ट्रॅकिंग",
          desc: "सबमिशनपासून निराकरणापर्यंत तक्रार स्थिती पहा",
        },
        chatbot: {
          title: "AI चॅटबॉट सपोर्ट",
          desc: "24/7 त्वरित मदत आणि मार्गदर्शन मिळवा",
        },
      },
      contact: {
        title: "संपर्क माहिती",
        address: "ठाणे महानगरपालिका, ठाणे, महाराष्ट्र",
        phone: "हेल्पलाइन: 1800-XXX-XXXX",
        email: "ईमेल: civicmate@thanecity.gov.in",
      },
    },
  };

  const t = content[language];

  return (
    <div className="homepage">
      {/* Language Toggle */}
      <div className="language-toggle">
        <Button
          variant="outline-primary"
          size="sm"
          onClick={toggleLanguage}
          className="lang-btn"
        >
          {language === "en" ? "मराठी" : "English"}
        </Button>
      </div>

      {/* Hero Section */}
      <section className="hero-section">
        <Container>
          <Row className="align-items-center">
            <Col lg={7} className="hero-content fade-in">
              <div className="gov-badge">
                <img
                  src="/LOGO.jpg"
                  alt="TMC Logo"
                  className="tmc-logo"
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              </div>
              <h1 className="hero-title">{t.hero.title}</h1>
              <h2 className="hero-subtitle">{t.hero.subtitle}</h2>
              <p className="hero-tagline">{t.hero.tagline}</p>
              <div className="hero-actions">
                <Link to="/create-tweet">
                  <Button className="btn-gov-primary btn-lg me-3">
                    <i className="fas fa-bullhorn me-2"></i>
                    {t.hero.cta}
                  </Button>
                </Link>
                <Link to="/login">
                  <Button className="btn-gov-secondary btn-lg">
                    <i className="fas fa-sign-in-alt me-2"></i>
                    {t.hero.login}
                  </Button>
                </Link>
              </div>
            </Col>
            <Col lg={5} className="hero-image slide-in-right">
              <div className="hero-illustration">
                <i className="fas fa-city hero-icon"></i>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Stats Dashboard */}
      <section className="stats-section">
        <Container>
          <h2 className="section-title text-center">{t.stats.title}</h2>
          <Row className="g-4 mt-4">
            <Col md={3} sm={6}>
              <Card className="stat-card card-hover bg-gradient-primary text-white">
                <Card.Body className="text-center">
                  <i className="fas fa-clipboard-list stat-icon"></i>
                  <h3 className="stat-number">{stats.total}</h3>
                  <p className="stat-label">{t.stats.total}</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} sm={6}>
              <Card className="stat-card card-hover bg-warning text-white">
                <Card.Body className="text-center">
                  <i className="fas fa-clock stat-icon"></i>
                  <h3 className="stat-number">{stats.pending}</h3>
                  <p className="stat-label">{t.stats.pending}</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} sm={6}>
              <Card className="stat-card card-hover bg-info text-white">
                <Card.Body className="text-center">
                  <i className="fas fa-spinner stat-icon"></i>
                  <h3 className="stat-number">{stats.inProgress}</h3>
                  <p className="stat-label">{t.stats.inProgress}</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} sm={6}>
              <Card className="stat-card card-hover bg-gradient-secondary text-white">
                <Card.Body className="text-center">
                  <i className="fas fa-check-circle stat-icon"></i>
                  <h3 className="stat-number">{stats.completed}</h3>
                  <p className="stat-label">{t.stats.completed}</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Quick Actions */}
      <section className="quick-actions-section">
        <Container>
          <h2 className="section-title text-center">{t.quickActions.title}</h2>
          <p className="section-subtitle text-center">{t.quickActions.subtitle}</p>
          <Row className="g-4">
            {[
              { icon: "fa-road", label: t.quickActions.pothole, color: "#ef4444" },
              { icon: "fa-lightbulb", label: t.quickActions.streetlight, color: "#f59e0b" },
              { icon: "fa-trash", label: t.quickActions.garbage, color: "#10b981" },
              { icon: "fa-tint", label: t.quickActions.water, color: "#3b82f6" },
              { icon: "fa-water", label: t.quickActions.sewage, color: "#8b5cf6" },
              { icon: "fa-ellipsis-h", label: t.quickActions.other, color: "#6b7280" },
            ].map((action, idx) => (
              <Col md={4} sm={6} key={idx}>
                <Link to="/create-tweet" className="text-decoration-none">
                  <Card className="action-card card-hover">
                    <Card.Body className="text-center">
                      <div
                        className="action-icon-wrapper"
                        style={{ backgroundColor: action.color }}
                      >
                        <i className={`fas ${action.icon} action-icon`}></i>
                      </div>
                      <h5 className="action-label mt-3">{action.label}</h5>
                    </Card.Body>
                  </Card>
                </Link>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* How It Works */}
      <section className="how-it-works-section">
        <Container>
          <h2 className="section-title text-center">{t.howItWorks.title}</h2>
          <Row className="g-4 mt-4">
            {[
              { icon: "fa-user-plus", step: "1", ...t.howItWorks.step1 },
              { icon: "fa-file-alt", step: "2", ...t.howItWorks.step2 },
              { icon: "fa-chart-line", step: "3", ...t.howItWorks.step3 },
              { icon: "fa-star", step: "4", ...t.howItWorks.step4 },
            ].map((step, idx) => (
              <Col md={3} sm={6} key={idx}>
                <Card className="step-card text-center">
                  <Card.Body>
                    <div className="step-number">{step.step}</div>
                    <i className={`fas ${step.icon} step-icon`}></i>
                    <h5 className="step-title">{step.title}</h5>
                    <p className="step-desc">{step.desc}</p>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* Features */}
      <section className="features-section">
        <Container>
          <h2 className="section-title text-center">{t.features.title}</h2>
          <Row className="g-4 mt-4">
            {[
              { icon: "fa-brain", ...t.features.ai },
              { icon: "fa-arrow-up", ...t.features.priority },
              { icon: "fa-map-marker-alt", ...t.features.tracking },
              { icon: "fa-robot", ...t.features.chatbot },
            ].map((feature, idx) => (
              <Col md={6} lg={3} key={idx}>
                <Card className="feature-card card-hover h-100">
                  <Card.Body className="text-center">
                    <i className={`fas ${feature.icon} feature-icon`}></i>
                    <h5 className="feature-title">{feature.title}</h5>
                    <p className="feature-desc">{feature.desc}</p>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* Contact Section */}
      <section className="contact-section">
        <Container>
          <Card className="contact-card">
            <Card.Body>
              <Row>
                <Col md={12} className="text-center">
                  <h3 className="contact-title">{t.contact.title}</h3>
                  <div className="contact-info mt-4">
                    <p>
                      <i className="fas fa-map-marker-alt me-2"></i>
                      {t.contact.address}
                    </p>
                    <p>
                      <i className="fas fa-phone me-2"></i>
                      {t.contact.phone}
                    </p>
                    <p>
                      <i className="fas fa-envelope me-2"></i>
                      {t.contact.email}
                    </p>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Container>
      </section>
    </div>
  );
};

export default Homepage;
