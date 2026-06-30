import React, { useState } from "react";
import { Container, Form, Button } from "react-bootstrap";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Simulate sending data to the backend
    try {
      // Replace this with your actual API call
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulated API call

      // Show success message
      toast.success("Thank you for your feedback!");
      setFormData({ name: "", email: "", message: "" }); // Reset the form
    } catch (error) {
      toast.error("There was an error sending your message. Please try again.");
    }
  };

  return (
    <Container className="mt-5 mb-5 border border-secondary p-4 contact-container">
      <h2 className="text-center mb-4">Contact Us</h2>
      <Form onSubmit={handleSubmit}>
        <Form.Group controlId="formName">
          <Form.Label>Name</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter your name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </Form.Group>

        <Form.Group controlId="formEmail">
          <Form.Label>Email</Form.Label>
          <Form.Control
            type="email"
            placeholder="Enter your email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </Form.Group>

        <Form.Group controlId="formMessage">
          <Form.Label>Message</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            placeholder="Your message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            required
          />
        </Form.Group>

        <Button variant="primary" type="submit" className="mt-3">
          Send Message
        </Button>
      </Form>
    </Container>
  );
};

export default Contact;
