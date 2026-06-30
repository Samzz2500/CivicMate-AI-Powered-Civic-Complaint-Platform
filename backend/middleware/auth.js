const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
  const rawAuthHeader = req.headers["authorization"] || "";
  const token = rawAuthHeader.startsWith("Bearer ")
    ? rawAuthHeader.slice(7)
    : rawAuthHeader;

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    return res.status(500).json({ message: "Server misconfiguration: missing JWT_SECRET" });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: "Invalid token" });
    }

    req.user = {
      user,
      id: user.id,
      role: user.role,
    };

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

const adminMiddleware = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    return next();
  } else {
    return res.status(403).json({
      message: "Access denied. Admins only",
    });
  }
};

// Backwards-compatible aliases for existing code that expects `auth` and `adminAuth`
const auth = authMiddleware;
const adminAuth = adminMiddleware;

module.exports = { authMiddleware, adminMiddleware, auth, adminAuth };
