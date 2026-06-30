import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { API_ENDPOINTS } from "../config/api";
import "bootstrap/dist/css/bootstrap.min.css";

// SECURITY: Admin secret must be configured in environment variables
// No fallback value for security reasons
const ADMIN_SECRET = process.env.REACT_APP_ADMIN_SECRET;
const THANE_AREAS = [ 
    "Thane West",
    "Thane East",
    "Ghodbunder Road",
    "Majiwada",
    "Manpada",
    "Balkum",
    "Vartak Nagar",
    "Wagle Estate",
    "Pokhran Road",
    "Kolshet",
    "Kapur Bawdi",
    "Brahmand",
    "Patlipada",
    "Hiranandani Estate",
    "Louis Wadi",
    "Teen Hath Naka",
    "Kalwa",
    "Mumbra",
    "Kopri",
    "Kasarvadavli",
    "Manorama Nagar",
    "Anand Nagar",
    "Charai",
    "Naupada",
    "Vasant Vihar",
  ];

const Register = () => {
  const [userType, setUserType] = useState("user");
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    firstname: "",
    lastname: "",
    mobile: "",
    city: "",
    state: "Maharashtra",
    pincode: "",
    adminSecret: "",
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 🔹 Admin role validation
    if (userType === "admin") {
      if (!ADMIN_SECRET) {
        toast.error("Admin registration is disabled. Contact system administrator.");
        return;
      }
      if (formData.adminSecret !== ADMIN_SECRET) {
        toast.error("Invalid admin secret code!");
        return;
      }
    }

    try {
      const requestData = {
        ...formData,
        role: userType, 
      };

      if (userType !== "admin") {
        delete requestData.adminSecret; // Remove adminSecret if not needed
      }

      await axios.post(API_ENDPOINTS.REGISTER, requestData);
      toast.success("Registration successful!");
      navigate("/login");
    } catch (error) {
      console.error("Registration error:", error.response?.data);
      
      // Handle validation errors
      if (error.response?.data?.errors) {
        error.response.data.errors.forEach(err => toast.error(err));
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Error during registration. Please try again.");
      }
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100">
      <div className="card shadow" style={{ width: "30rem", borderRadius: "10px" }}>
        <div className="card-body">
          <h5 className="card-title text-center mb-4">Create Account</h5>
          <div className="d-flex justify-content-center mb-3">
            <button
              className={`btn ${userType === "user" ? "btn-primary" : "btn-outline-primary"} mx-2`}
              onClick={() => setUserType("user")}
            >
              User
            </button>
            <button
              className={`btn ${userType === "admin" ? "btn-primary" : "btn-outline-primary"} mx-2`}
              onClick={() => setUserType("admin")}
            >
              Admin
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-6">
                <input
                  type="text"
                  name="username"
                  placeholder="Username"
                  className="form-control"
                  onChange={handleChange}
                  required
                  minLength="3"
                  maxLength="20"
                />
              </div>
              <div className="col-md-6">
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  className="form-control"
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-md-6 position-relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  className="form-control"
                  onChange={handleChange}
                  required
                  minLength="6"
                  maxLength="30"
                />
                <span
                  className="position-absolute top-50 end-0 translate-middle-y me-2"
                  style={{ cursor: "pointer" }}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </span>
              </div>
              <div className="col-md-6">
                <input
                  type="text"
                  name="firstname"
                  placeholder="First Name"
                  className="form-control"
                  onChange={handleChange}
                  required
                  pattern="[A-Za-z]+"
                />
              </div>
              <div className="col-md-6">
                <input
                  type="text"
                  name="lastname"
                  placeholder="Last Name"
                  className="form-control"
                  onChange={handleChange}
                  required
                  pattern="[A-Za-z]+"
                />
              </div>
              <div className="col-md-6">
                <input
                  type="text"
                  name="mobile"
                  placeholder="Mobile Number"
                  className="form-control"
                  onChange={handleChange}
                  required
                  pattern="\d{10}"
                />
              </div>
              {userType === "user" && (
                <>
                  <div className="col-md-6">
                    <select name="city" className="form-control" onChange={handleChange} required>
                      <option value="">Select Area</option>
                      {THANE_AREAS.map((area, index) => (
                        <option key={index} value={area}>
                          {area}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <input type="text" name="state" value="Maharashtra" className="form-control" readOnly />
                  </div>
                  <div className="col-md-6">
                    <input
                      type="text"
                      name="pincode"
                      placeholder="Pincode"
                      className="form-control"
                      onChange={handleChange}
                      required
                      pattern="\d{6}"
                    />
                  </div>
                </>
              )}
              {userType === "admin" && (
                <div className="col-12">
                  <input
                    type="password"
                    name="adminSecret"
                    placeholder="Admin Secret Code"
                    className="form-control"
                    onChange={handleChange}
                    required
                  />
                </div>
              )}
            </div>
            <button type="submit" className="btn btn-primary w-100 mt-4">
              Register
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
