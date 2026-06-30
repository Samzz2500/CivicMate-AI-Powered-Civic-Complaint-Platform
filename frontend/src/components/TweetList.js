/*import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  Tabs,
  Tab,
  Modal,
  InputGroup,
} from "react-bootstrap";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const TweetList = () => {
  const [recentTweets, setRecentTweets] = useState([]);
  const [topTweets, setTopTweets] = useState([]);
  const [filteredTweets, setFilteredTweets] = useState([]);
  const [activeTab, setActiveTab] = useState("recent");
  const [showModal, setShowModal] = useState(false);
  const [currentImage, setCurrentImage] = useState(null);
  const [comments, setComments] = useState({}); // Object to store comments for each tweet
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchTweets = async () => {
      const [recentResponse, topResponse] = await Promise.all([
        axios.get("http://localhost:5000/api/tweets/recent"),
        axios.get("http://localhost:5000/api/tweets/top"),
      ]);
      setRecentTweets(recentResponse.data);
      setTopTweets(topResponse.data);
      setFilteredTweets(recentResponse.data); // Default to recent tweets
    };

    fetchTweets();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault(); // Prevent default form submission
    if (searchQuery.trim()) {
      try {
        const response = await axios.get(
          `http://localhost:5000/api/tweets?query=${searchQuery}`
        );
        setFilteredTweets(response.data); // Update filtered tweets with search results
      } catch (error) {
        console.error("Error fetching search results:", error);
        toast.error("Error fetching search results.");
      }
    } else {
      // Reset to all tweets if the search query is empty
      setFilteredTweets(activeTab === "recent" ? recentTweets : topTweets);
    }
  };

  const handleTabSelect = (key) => {
    setActiveTab(key);
    setFilteredTweets(key === "recent" ? recentTweets : topTweets); // Switch between recent and top tweets
  };

  const handleCommentChange = (tweetId, text) => {
    setComments((prevComments) => ({ ...prevComments, [tweetId]: text })); // Update comment for specific tweet
  };

  const handleCommentSubmit = async (tweetId) => {
    const token = localStorage.getItem("token");
    const commentText = comments[tweetId]; // Get the specific comment text

    if (!token) {
      toast.warn("Please log in to submit a comment!", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    try {
      await axios.post(
        `http://localhost:5000/api/tweets/${tweetId}/comment`,
        { text: commentText },
        { headers: { Authorization: token } }
      );

      // Update the local state after submitting a comment
      const updatedTweets = recentTweets.map((tweet) => {
        if (tweet._id === tweetId) {
          return {
            ...tweet,
            comments: [...tweet.comments, { text: commentText }],
          };
        }
        return tweet;
      });

      setRecentTweets(updatedTweets);
      setFilteredTweets(updatedTweets); // Ensure filtered tweets reflect the latest updates
      setComments((prevComments) => ({ ...prevComments, [tweetId]: "" })); // Clear the comment input for this tweet
    } catch (error) {
      toast.error("Error submitting comment. Please try again.");
    }
  };

  const handleLikeTweet = async (tweetId) => {
    const token = localStorage.getItem("token");

    if (!token) {
      toast.warn("Please log in to like a tweet!", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    try {
      const response = await axios.post(
        `http://localhost:5000/api/tweets/${tweetId}/like`,
        {},
        { headers: { Authorization: token } }
      );

      const updatedTweets = recentTweets.map((tweet) => {
        if (tweet._id === tweetId) {
          return { ...tweet, likes: response.data.likes };
        }
        return tweet;
      });

      setRecentTweets(updatedTweets);
      setFilteredTweets(updatedTweets); // Update filtered tweets after liking
    } catch (error) {
      toast.error("Error liking tweet. Please try again.");
    }
  };

  const handleImageClick = (image) => {
    setCurrentImage(image);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentImage(null);
  };

  return (
    <Container className="mt-5">
      {/* SearchBar Section */
    /*}
      <Form onSubmit={handleSearch} className="mb-4">
        <InputGroup>
          <Form.Control
            type="text"
            placeholder="Search by keyword or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button variant="primary" type="submit">
            Search
          </Button>
        </InputGroup>
      </Form>

      <Tabs
        id="tweet-tabs"
        activeKey={activeTab}
        onSelect={handleTabSelect}
        className="mb-3"
      >
        <Tab eventKey="recent" title="Recent Tweets">
          <Row className="g-4">
            {filteredTweets.length > 0 ? (
              filteredTweets.map((tweet) => (
                <Col key={tweet._id} md={6} lg={4}>
                  <TweetCard
                    tweet={tweet}
                    onCommentSubmit={handleCommentSubmit}
                    onLikeTweet={handleLikeTweet}
                    comment={comments[tweet._id] || ""} // Use individual comment for each tweet
                    setComment={(text) => handleCommentChange(tweet._id, text)} // Update individual comment
                    onImageClick={handleImageClick}
                  />
                </Col>
              ))
            ) : (
              <p className="text-center">No tweets found.</p>
            )}
          </Row>
        </Tab>
        <Tab eventKey="top" title="Top Tweets">
          <Row className="g-4">
            {filteredTweets.length > 0 ? (
              filteredTweets.map((tweet) => (
                <Col key={tweet._id} md={6} lg={4}>
                  <TweetCard
                    tweet={tweet}
                    onCommentSubmit={handleCommentSubmit}
                    onLikeTweet={handleLikeTweet}
                    comment={comments[tweet._id] || ""} // Use individual comment for each tweet
                    setComment={(text) => handleCommentChange(tweet._id, text)} // Update individual comment
                    onImageClick={handleImageClick}
                  />
                </Col>
              ))
            ) : (
              <p className="text-center">No tweets found.</p>
            )}
          </Row>
        </Tab>
      </Tabs>

      {/* Modal for displaying the image */
    /*}
      <Modal show={showModal} onHide={handleCloseModal} centered>
        <Modal.Body>
          <img
            src={currentImage}
            alt="Tweet"
            style={{ width: "100%", height: "auto" }}
          />
        </Modal.Body>
      </Modal>
    </Container>
  );
};

// TweetCard Component
const TweetCard = ({
  tweet,
  onCommentSubmit,
  onLikeTweet,
  comment,
  setComment,
  onImageClick,
}) => {
  const token = localStorage.getItem("token");
  const user = token ? JSON.parse(atob(token.split(".")[1])) : null;
  const userId = user ? user.id : null;
  const userRole = user ? user.role : "user"; // Default to "user" if role is not found

  const hasLiked =
    tweet.likes && Array.isArray(tweet.likes) && tweet.likes.includes(userId);

  const formattedDate = new Date(tweet.createdAt).toLocaleString();

  return (
    <Card className="tweet-card shadow-sm border-light" style={{ height: "100%" }}>
      <Card.Body>
        <Card.Title className="tweet-title">{tweet.title}</Card.Title>
        <Card.Text className="tweet-description">{tweet.description}</Card.Text>
        <Card.Text className="tweet-location">
          <strong>Location:</strong> {tweet.location}
        </Card.Text>
        <Card.Text className="tweet-date">
          <small className="text-muted">Posted on: {formattedDate}</small>
        </Card.Text>
        <Card.Text className="tweet-status">
          <strong>Status:</strong> {tweet.completed}
        </Card.Text>

        {tweet.image && (
          <Card.Img
            className="tweet-image"
            variant="bottom"
            src={`http://localhost:5000/${tweet.image}`}
            alt={tweet.title}
            style={{ cursor: "pointer", height: "240px", objectFit: "cover" }}
            onClick={() => onImageClick(`http://localhost:5000/${tweet.image}`)}
          />
        )}

        <div className="d-flex flex-column mt-3">
          {userRole !== "admin" && (
            <Form>
              <Form.Control
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment..."
                required
                className="mt-2 w-100"
              />
            </Form>
          )}

          <div className="d-flex justify-content-between align-items-center mt-2">
            {userRole !== "admin" && (
              <>
                <Button
                  variant={hasLiked ? "success" : "outline-danger"}
                  onClick={() => onLikeTweet(tweet._id)}
                  className="me-2"
                  disabled={hasLiked}
                >
                  <i className="fas fa-heart"></i>{" "}
                  {Array.isArray(tweet.likes) && tweet.likes.length > 0 && `(${tweet.likes.length})`}
                </Button>

                <Button variant="primary" onClick={() => onCommentSubmit(tweet._id)}>
                  <i className="fas fa-comment"></i> Comment
                </Button>
              </>
            )}
          </div>
        </div>

        <hr />
        <div className="comments-section">
          <h6 className="comments-title">Comments:</h6>
          {Array.isArray(tweet.comments) && tweet.comments.length === 0 ? (
            <p className="no-comments">No comments yet.</p>
          ) : (
            <ul className="comments-list">
              {Array.isArray(tweet.comments) &&
                tweet.comments.map((comment, index) => (
                  <li key={index} className="comment-item">
                    {comment.text}
                  </li>
                ))}
            </ul>
          )}
        </div> 
      </Card.Body>
    </Card>
  );
};

export default TweetList;
*/















































import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  Tabs,
  Tab,
  Modal,
  InputGroup,
} from "react-bootstrap";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const TweetList = () => {
  const navigate = useNavigate();
  const [recentTweets, setRecentTweets] = useState([]);
  const [topTweets, setTopTweets] = useState([]);
  const [filteredTweets, setFilteredTweets] = useState([]);
  const [activeTab, setActiveTab] = useState("recent");
  const [showModal, setShowModal] = useState(false);
  const [currentImage, setCurrentImage] = useState(null);
  const [comments, setComments] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [translations, setTranslations] = useState({});

  useEffect(() => {
    const fetchTweets = async () => {
      const [recentResponse, topResponse] = await Promise.all([
        axios.get("http://localhost:5000/api/tweets/recent"),
        axios.get("http://localhost:5000/api/tweets/top"),
      ]);
      setRecentTweets(recentResponse.data);
      setTopTweets(topResponse.data);
      setFilteredTweets(recentResponse.data);
    };

    fetchTweets();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      try {
        const response = await axios.get(
          `http://localhost:5000/api/tweets?query=${searchQuery}`
        );
        setFilteredTweets(response.data);
      } catch (error) {
        console.error("Error fetching search results:", error);
        toast.error("Error fetching search results.");
      }
    } else {
      setFilteredTweets(activeTab === "recent" ? recentTweets : topTweets);
    }
  };

  const handleTabSelect = (key) => {
    setActiveTab(key);
    setFilteredTweets(key === "recent" ? recentTweets : topTweets);
  };

  const handleCommentChange = (tweetId, text) => {
    setComments((prevComments) => ({ ...prevComments, [tweetId]: text }));
  };

  const handleCommentSubmit = async (tweetId) => {
    const token = localStorage.getItem("token");
    const commentText = comments[tweetId];

    if (!token) {
      toast.warn("Please log in to submit a comment!", {
        position: "top-right",
        autoClose: 3000,
      });
      navigate('/login');
      return;
    }

    if (!commentText || !commentText.trim()) {
      toast.warn("Please enter a comment!", {
        position: "top-right",
        autoClose: 2000,
      });
      return;
    }

    try {
      await axios.post(
        `http://localhost:5000/api/tweets/${tweetId}/comment`,
        { text: commentText },
        { headers: { Authorization: token } }
      );

      const updatedTweets = recentTweets.map((tweet) => {
        if (tweet._id === tweetId) {
          return {
            ...tweet,
            comments: [...tweet.comments, { text: commentText }],
          };
        }
        return tweet;
      });

      setRecentTweets(updatedTweets);
      setFilteredTweets(updatedTweets);
      setComments((prevComments) => ({ ...prevComments, [tweetId]: "" }));
      
      toast.success("Comment added successfully!", {
        position: "top-right",
        autoClose: 2000,
      });
    } catch (error) {
      toast.error("Error submitting comment. Please try again.");
    }
  };

  const handleLikeTweet = async (tweetId) => {
    const token = localStorage.getItem("token");

    if (!token) {
      toast.warn("Please log in to like a tweet!", {
        position: "top-right",
        autoClose: 3000,
      });
      navigate('/login');
      return;
    }

    try {
      const response = await axios.post(
        `http://localhost:5000/api/tweets/${tweetId}/like`,
        {},
        { headers: { Authorization: token } }
      );

      const updatedTweets = recentTweets.map((tweet) => {
        if (tweet._id === tweetId) {
          return { ...tweet, likes: response.data.likes };
        }
        return tweet;
      });

      setRecentTweets(updatedTweets);
      setFilteredTweets(updatedTweets);
      
      toast.success("Liked successfully!", {
        position: "top-right",
        autoClose: 2000,
      });
    } catch (error) {
      toast.error("Error liking tweet. Please try again.");
    }
  };

  const handleImageClick = (image) => {
    setCurrentImage(image);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentImage(null);
  };

  const handleTranslateDescription = async (tweetId, text) => {
    if (translations[tweetId]) return;

    try {
      const response = await axios.post(
        "http://localhost:5001/api/tweets/translate",
        { text }
      );
      setTranslations((prev) => ({
        ...prev,
        [tweetId]: response.data.translated,
      }));
    } catch (error) {
      console.error("Translation error:", error);
      toast.error("Failed to translate description.");
    }
  };

  return (
    <Container className="mt-5">
      <Form onSubmit={handleSearch} className="mb-4">
        <InputGroup>
          <Form.Control
            type="text"
            placeholder="Search by keyword or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button variant="primary" type="submit">
            Search
          </Button>
        </InputGroup>
      </Form>

      <Tabs
        id="tweet-tabs"
        activeKey={activeTab}
        onSelect={handleTabSelect}
        className="mb-3"
      >
        <Tab eventKey="recent" title="Recent Tweets">
          <Row className="g-4">
            {filteredTweets.length > 0 ? (
              filteredTweets.map((tweet) => (
                <Col key={tweet._id} md={6} lg={4}>
                  <TweetCard
                    tweet={tweet}
                    onCommentSubmit={handleCommentSubmit}
                    onLikeTweet={handleLikeTweet}
                    comment={comments[tweet._id] || ""}
                    setComment={(text) => handleCommentChange(tweet._id, text)}
                    onImageClick={handleImageClick}
                    onTranslate={() =>
                      handleTranslateDescription(tweet._id, tweet.description)
                    }
                    translation={translations[tweet._id]}
                  />
                </Col>
              ))
            ) : (
              <p className="text-center">No tweets found.</p>
            )}
          </Row>
        </Tab>
        <Tab eventKey="top" title="Top Tweets">
          <Row className="g-4">
            {filteredTweets.length > 0 ? (
              filteredTweets.map((tweet) => (
                <Col key={tweet._id} md={6} lg={4}>
                  <TweetCard
                    tweet={tweet}
                    onCommentSubmit={handleCommentSubmit}
                    onLikeTweet={handleLikeTweet}
                    comment={comments[tweet._id] || ""}
                    setComment={(text) => handleCommentChange(tweet._id, text)}
                    onImageClick={handleImageClick}
                    onTranslate={() =>
                      handleTranslateDescription(tweet._id, tweet.description)
                    }
                    translation={translations[tweet._id]}
                  />
                </Col>
              ))
            ) : (
              <p className="text-center">No tweets found.</p>
            )}
          </Row>
        </Tab>
      </Tabs>

      <Modal show={showModal} onHide={handleCloseModal} centered>
        <Modal.Body>
          <img
            src={currentImage}
            alt="Tweet"
            style={{ width: "100%", height: "auto" }}
          />
        </Modal.Body>
      </Modal>
    </Container>
  );
};

const TweetCard = ({
  tweet,
  onCommentSubmit,
  onLikeTweet,
  comment,
  setComment,
  onImageClick,
  onTranslate,
  translation,
}) => {
  const token = localStorage.getItem("token");
  const user = token ? JSON.parse(atob(token.split(".")[1])) : null;
  const userId = user ? user.id : null;
  const userRole = user ? user.role : "user";

  const hasLiked =
    tweet.likes && Array.isArray(tweet.likes) && tweet.likes.includes(userId);

  const formattedDate = new Date(tweet.createdAt).toLocaleString();

  return (
    <Card className="tweet-card shadow-sm border-light" style={{ height: "100%" }}>
      <Card.Body>
        <Card.Title className="tweet-title">{tweet.title}</Card.Title>
        <Card.Text className="tweet-description">{tweet.description}</Card.Text>

        {!translation && userRole !== "admin" && tweet.description && (
          <Button
            variant="link"
            size="sm"
            className="p-0"
            onClick={onTranslate}
            style={{ textDecoration: "underline" }}
          >
            🔁 Show Translation
          </Button>
        )}

        {translation && (
          <Card.Text className="tweet-translation text-success">
            <em>{translation}</em>
          </Card.Text>
        )}

        <Card.Text className="tweet-location">
          <strong>Location:</strong> {tweet.location}
        </Card.Text>
        <Card.Text className="tweet-date">
          <small className="text-muted">Posted on: {formattedDate}</small>
        </Card.Text>
        <Card.Text className="tweet-status">
          <strong>Status:</strong> {tweet.completed}
        </Card.Text>

        {tweet.image && (
          <Card.Img
            className="tweet-image"
            variant="bottom"
            src={`http://localhost:5000/${tweet.image}`}
            alt={tweet.title}
            style={{ cursor: "pointer", height: "240px", objectFit: "cover" }}
            onClick={() => onImageClick(`http://localhost:5000/${tweet.image}`)}
          />
        )}

        <div className="d-flex flex-column mt-3">
          {userRole !== "admin" && (
            <Form>
              <Form.Control
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment..."
                required
                className="mt-2 w-100"
              />
            </Form>
          )}

          <div className="d-flex justify-content-between align-items-center mt-2">
            {userRole !== "admin" && (
              <>
                <Button
                  variant={hasLiked ? "success" : "outline-danger"}
                  onClick={() => onLikeTweet(tweet._id)}
                  className="me-2"
                  disabled={hasLiked}
                >
                  <i className="fas fa-heart"></i>{" "}
                  {Array.isArray(tweet.likes) && tweet.likes.length > 0 && `(${tweet.likes.length})`}
                </Button>

                <Button variant="primary" onClick={() => onCommentSubmit(tweet._id)}>
                  <i className="fas fa-comment"></i> Comment
                </Button>
              </>
            )}
          </div>
        </div>

        <hr />
        <div className="comments-section">
          <h6 className="comments-title">Comments:</h6>
          {Array.isArray(tweet.comments) && tweet.comments.length === 0 ? (
            <p className="no-comments">No comments yet.</p>
          ) : (
            <ul className="comments-list">
              {Array.isArray(tweet.comments) &&
                tweet.comments.map((comment, index) => (
                  <li key={index} className="comment-item">
                    {comment.text}
                  </li>
                ))}
            </ul>
          )}
        </div>
      </Card.Body>
    </Card>
  );
};

export default TweetList;
