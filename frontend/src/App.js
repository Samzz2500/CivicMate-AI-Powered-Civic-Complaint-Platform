/*import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { CSSTransition, TransitionGroup } from "react-transition-group"; // Import transition components
import "react-toastify/dist/ReactToastify.css";
import Navbar from "./components/Navbar";
import Register from "./components/Register";
import Login from "./components/Login";
import CreateTweet from "./components/CreateTweet";
import TweetList from "./components/TweetList";
import Profile from "./components/Profile";
import AboutUs from "./components/AboutUs";
import Contact from "./components/Contact";
import PrivacyPolicy from "./components/PrivacyPolicy";
import Footer from "./components/Footer";
import BrandLoading from "./components/BrandLoading"; // Import the loading component
import "./App.css"; // Ensure your CSS is imported
import "./transitions.css"; // Import your transitions CSS file

const App = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate a loading delay
    const timer = setTimeout(() => {
      setLoading(false); // Set loading to false after 3 seconds
    }, 3000); // Change the duration as needed

    return () => clearTimeout(timer); // Cleanup the timer on unmount
  }, []);

  return (
    <Router>
      <div className="d-flex flex-column min-vh-100">
        {loading ? (
          <BrandLoading /> // Show brand loading screen while loading
        ) : (
          <>
            <Navbar />
            <main className="flex-grow-1">
              <AppRoutes />
            </main>
            <Footer /> {/* Add Footer here }*/
          // </>
        // )}
        // <ToastContainer />
      // </div>
    // </Router>
  // );
// };

/*// Separate component for handling routes with transitions
const AppRoutes = () => {
  const location = useLocation(); // Get the current location for transitions

  return (
    <TransitionGroup>
      <CSSTransition key={location.key} classNames="fade" timeout={300}>
        <Routes location={location}>
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/create-tweet" element={<CreateTweet />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route
            path="/"
            element={
              <>
                <TweetList />
                // <AboutUs /> {/* Add AboutUs here }*/
              //</>
            //}
          ///>
          //<Route path="/profile" element={<Profile />} />
        //</Routes>
      // </CSSTransition>
    // </TransitionGroup>
  // );
// };

// export default App;


import React, { useEffect, useState, useRef } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import "react-toastify/dist/ReactToastify.css";

import Navbar from "./components/Navbar";
import Homepage from "./components/Homepage";
import Register from "./components/Register";
import Login from "./components/Login";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";
import CreateTweet from "./components/CreateTweet";
import CreateComplaint from "./components/CreateComplaint";
import TweetList from "./components/TweetList";
import Profile from "./components/Profile";
import AdminDashboard from "./components/AdminDashboard";
import AdminWorkflow from "./components/AdminWorkflow";
import ComplaintTracking from "./components/ComplaintTracking";
import AboutUs from "./components/AboutUs";
import Contact from "./components/Contact";
import PrivacyPolicy from "./components/PrivacyPolicy";
import Footer from "./components/Footer";
import BrandLoading from "./components/BrandLoading";
import Chatbot from "./components/Chatbot";

import "./App.css";
import "./transitions.css";

const App = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Router>
      <div className="d-flex flex-column min-vh-100">
        {loading ? (
          <BrandLoading />
        ) : (
          <>
            <Navbar />
            <main className="flex-grow-1">
              <AppRoutes />
            </main>
            <Chatbot />
            <Footer />
          </>
        )}
        <ToastContainer />
      </div>
    </Router>
  );
};

const AppRoutes = () => {
  const location = useLocation();
  const nodeRef = useRef(null);

  return (
    <TransitionGroup>
      <CSSTransition
        key={location.key}
        classNames="fade"
        timeout={300}
        nodeRef={nodeRef}
      >
        <div ref={nodeRef}>
          <Routes location={location}>
            <Route path="/" element={<Homepage />} />
            <Route path="/tweets" element={<><TweetList /><AboutUs /></>} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/create-tweet" element={<CreateTweet />} />
            <Route path="/create-complaint" element={<CreateComplaint />} />
            <Route path="/tracking/:complaintId" element={<ComplaintTracking />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/workflow" element={<AdminWorkflow />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </div>
      </CSSTransition>
    </TransitionGroup>
  );
};

export default App;
