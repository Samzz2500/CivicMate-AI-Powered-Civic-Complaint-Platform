import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import "./AboutUs.css"; // Import custom CSS file

const AboutUs = () => {
  return (
    <Container className="mt-4 border border-secondary p-4 mb-5 about-us-container">
      <h2 className="text-center mb-4 about-us-title">About Us</h2>
      <Row>
        <Col md={12} className="text-center">
          <p className="about-us-description">
            <strong>CivicMate</strong> is a platform aimed at
            empowering citizens by facilitating communication between the public
            and authorities regarding social issues. Our goal is to enhance
            civic engagement and promote community welfare by ensuring that
            voices are heard and actions are taken.
          </p>
          <p className="about-us-mission">
            Join us in making a difference in your locality!
          </p>
        </Col>
      </Row>
    </Container>
  );
};

export default AboutUs;
