// src/components/CreateTweet.js
import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { API_ENDPOINTS } from "../config/api";
import "bootstrap/dist/css/bootstrap.min.css"; // Ensure Bootstrap CSS is imported

const CreateTweet = () => {
  const [tweetData, setTweetData] = useState({
    title: "",
    description: "",
    location: "",
    specificArea: "",
    category: "",
    image: null,
  });

  // List of civic issue categories
  const categories = [
    { value: "potholes", label: "Potholes" },
    { value: "streetlight", label: "Street Light" },
    { value: "garbage", label: "Garbage" },
    { value: "drainage", label: "Drainage" },
    { value: "water_leakage", label: "Water Leakage" },
    { value: "public washroom", label: "Public Washroom" },
    { value: "others", label: "Others" },
  ];

  // List of Thane areas for dropdown
  const thaneAreas = [
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

  // ✅ Handle input changes with description word limit
  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "image") {
      setTweetData({ ...tweetData, image: files[0] });
    } else if (name === "description") {
      const wordCount = value.trim().split(/\s+/).filter(Boolean).length;
      if (wordCount <= 100) {
        setTweetData({ ...tweetData, description: value });
      } else {
        toast.warn("Description can only be up to 100 words!");
      }
    } else {
      setTweetData({ ...tweetData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate 100-word limit before submit
    const wordCount = tweetData.description.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount > 100) {
      toast.error("Description exceeds 100 words!");
      return;
    }

    // Combine specific area if Thane East/West is selected
    let finalLocation = tweetData.location;
    if (
      (tweetData.location === "Thane East" || tweetData.location === "Thane West") &&
      tweetData.specificArea.trim() !== ""
    ) {
      finalLocation = `${tweetData.location} - ${tweetData.specificArea.trim()}`;
    }

    const formData = new FormData();
    formData.append("title", tweetData.title);
    formData.append("description", tweetData.description);
    formData.append("location", finalLocation);
    formData.append("category", tweetData.category);
    if (tweetData.image) {
      formData.append("image", tweetData.image);
    }

    try {
      const token = localStorage.getItem("token");
      await axios.post(API_ENDPOINTS.TWEETS, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: token,
        },
      });
      toast.success("Tweet created successfully!");
      window.location.reload();
    } catch (error) {
      const data = error?.response?.data || {};
      const parts = [data.message, data.error, data.details, error?.message]
        .filter(Boolean)
        .map(String);
      const msg = parts[0] || "Failed to create tweet";
      toast.error(msg);
      if (parts.length > 1) {
        console.warn("Details:", parts.slice(1).join(" | "));
      }
      console.error("CreateTweet error:", data || error?.message);
    }
  };

  // Calculate current word count
  const currentWordCount = tweetData.description
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  return (
    <div className="d-flex justify-content-center align-items-center vh-100">
      <div className="card" style={{ width: "25rem" }}>
        <div className="card-body text-center">
          <h5 className="card-title">Create Tweet</h5>
          <i
            className="fas fa-pencil-alt fa-3x mb-3"
            style={{ color: "#007bff" }}
          ></i>
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <input
                type="text"
                name="title"
                placeholder="Title"
                className="form-control"
                value={tweetData.title}
                onChange={handleChange}
                required
              />
            </div>

            {/* 🔽 Description field with word limit */}
            <div className="mb-3 text-start">
              <textarea
                name="description"
                placeholder="Description (max 100 words)"
                className="form-control"
                value={tweetData.description}
                onChange={handleChange}
                required
              ></textarea>
              <small
                className={`${
                  currentWordCount > 100 ? "text-danger" : "text-muted"
                }`}
              >
                {currentWordCount}/100 words
              </small>
            </div>

            {/* 🔽 Thane Area Dropdown */}
            <div className="mb-3">
              <select
                name="location"
                className="form-control"
                value={tweetData.location}
                onChange={handleChange}
                required
              >
                <option value="">Select Location</option>
                {thaneAreas.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
            </div>

            {/* 🔽 Category Dropdown */}
            <div className="mb-3">
              <select
                name="category"
                className="form-control"
                value={tweetData.category}
                onChange={handleChange}
                required
              >
                <option value="">Select Issue Category</option>
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 🧭 Extra field for specifying area (if Thane East/West selected) */}
            {(tweetData.location === "Thane East" ||
              tweetData.location === "Thane West") && (
              <div className="mb-3 text-start">
                <textarea
                  name="specificArea"
                  placeholder="Specify exact area within Thane East/West"
                  className="form-control"
                  value={tweetData.specificArea}
                  onChange={handleChange}
                  required
                ></textarea>
                <small className="text-muted">Example: Panchpakhadi, Naupada, etc.</small>
              </div>
            )}

            <div className="mb-3">
              <input
                type="file"
                name="image"
                accept="image/*"
                className="form-control"
                onChange={handleChange}
              />
            </div>

            <button type="submit" className="btn btn-primary">
              Create Tweet
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateTweet;
