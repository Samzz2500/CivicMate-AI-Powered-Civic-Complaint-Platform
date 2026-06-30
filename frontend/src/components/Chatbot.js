import React, { useState } from "react";
import { API_ENDPOINTS } from "../config/api";
import "./Chatbot.css";

const Chatbot = () => {
  const [open, setOpen] = useState(false); // Toggle chatbot
  const [messages, setMessages] = useState([]); // Chat messages
  const [input, setInput] = useState(""); // User input
  const [menuOpen, setMenuOpen] = useState(false); // Toggle menu

  // Send message to backend AI chatbot API
  const sendMessage = async () => {
    if (input.trim() === "") return; // Prevent empty messages

    const userMessage = { text: input, sender: "user" };
    setMessages((prevMessages) => [...prevMessages, userMessage]); // Update UI with user message
    setInput(""); // Clear input field

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setMessages((prev) => [
          ...prev,
          { text: "Please login to use the assistant.", sender: "bot" },
        ]);
        return;
      }

      const response = await fetch(`${API_ENDPOINTS.CHATBOT}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: input }),
      });

      if (!response.ok) {
        throw new Error(`Server Error: ${response.status}`);
      }

      const data = await response.json();
      const botMessage = {
        text: data.reply || "Sorry, I couldn't understand.",
        sender: "bot",
      };

      setMessages((prevMessages) => [...prevMessages, botMessage]); // Update UI with bot response
    } catch (error) {
      console.error("Error:", error);
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: "Error connecting to chatbot.", sender: "bot" },
      ]);
    }
  };

  // Start new chat (clear messages & close menu)
  const newChat = () => {
    setMessages([]);
    setMenuOpen(false); // Hide menu after selecting option
  };

  // Close chat (hide chatbot & menu)
  const closeChat = () => {
    setOpen(false);
    setMenuOpen(false);
  };

  return (
    <div className="chatbot-wrapper">
      {/* Floating Chatbot Button */}
      <button className="chatbot-button" onClick={() => setOpen(!open)}>💬 Chat</button>

      {/* Chatbot Popup */}
      {open && (
        <div className="chatbot-container">
          {/* Chatbot Header */}
          <div className="chatbot-header">
            <h3>CivicMate</h3>
            <div className="menu-container">
              <button className="menu-btn" onClick={() => setMenuOpen(!menuOpen)}>⋮</button>
              {menuOpen && (
                <div className="menu-options">
                  <button onClick={newChat}>🆕 New Chat</button>
                  <button onClick={closeChat}>❌ End Chat</button>
                </div>
              )}
            </div>
          </div>

          {/* Chat Messages */}
          <div className="messages">
            {messages.map((msg, index) => (
              <div key={index} className={`message ${msg.sender}`}>
                {msg.text}
              </div>
            ))}
          </div>

          {/* Chat Input */}
          <div className="chat-input">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
            />
            <button onClick={sendMessage}>Send</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;
