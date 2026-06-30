import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import "./PrivacyPolicy.css"; // Optional: Add custom styles

const PrivacyPolicy = () => {
  return (
    <Container className="mt-5 mb-5 border border-secondary p-4 privacy-policy-container">
      <h2 className="text-center mb-4">Privacy Policy</h2>
      <Row>
        <Col md={12}>
          <p className="privacy-policy-text">
            At <strong>CivicMate</strong>, we value your privacy and
            are committed to protecting your personal information. This Privacy
            Policy outlines how we collect, use, disclose, and safeguard your
            information when you visit our website.
          </p>
          <h5>1. Information We Collect</h5>
          <p>
            We may collect personal information that you provide to us, such as
            your name, email address, and any other information you choose to
            submit through our contact forms.
          </p>
          <h5>2. How We Use Your Information</h5>
          <p>
            We may use the information we collect from you in the following
            ways:
          </p>
          <ul>
            <li>To personalize your experience</li>
            <li>To improve our website</li>
            <li>To process your transactions</li>
            <li>
              To send periodic emails regarding your order or other products and
              services
            </li>
          </ul>
          <h5>3. Disclosure of Your Information</h5>
          <p>
            We do not sell, trade, or otherwise transfer to outside parties your
            Personally Identifiable Information unless we provide users with
            advance notice. This does not include website hosting partners and
            other parties who assist us in operating our website, conducting our
            business, or serving our users, so long as those parties agree to
            keep this information confidential.
          </p>
          <h5>4. Data Security</h5>
          <p>
            We implement a variety of security measures to maintain the safety
            of your personal information when you place an order or enter,
            submit, or access your personal information.
          </p>
          <h5>5. Your Rights</h5>
          <p>
            You have the right to request copies of your personal information.
            You also have the right to request that we correct any information
            you believe is inaccurate or incomplete.
          </p>
          <h5>6. Changes to This Privacy Policy</h5>
          <p>
            We may update our Privacy Policy from time to time. We will notify
            you of any changes by posting the new Privacy Policy on this page.
            We encourage you to review this Privacy Policy periodically for any
            changes.
          </p>
          <h5>7. Contact Us</h5>
          <p>
            If you have any questions about this Privacy Policy, please contact
            us at <strong>info@shaharsahayyakranti.com</strong>.
          </p>
        </Col>
      </Row>
    </Container>
  );
};

export default PrivacyPolicy;
