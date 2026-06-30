// Input validation and sanitization middleware

const validator = require('validator');

// Sanitize string input
const sanitizeString = (str) => {
  if (!str) return str;
  return validator.escape(validator.trim(str));
};

// Validate registration input
const validateRegister = (req, res, next) => {
  const { username, email, password, firstname, lastname } = req.body;
  const errors = [];

  // Username validation
  if (!username || username.length < 3) {
    errors.push('Username must be at least 3 characters');
  }
  if (username && !/^[a-zA-Z0-9_]+$/.test(username)) {
    errors.push('Username can only contain letters, numbers, and underscores');
  }

  // Email validation
  if (!email || !validator.isEmail(email)) {
    errors.push('Valid email is required');
  }

  // SECURITY FIX #6: Enhanced password validation
  if (!password) {
    errors.push('Password is required');
  } else {
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters');
    }
    if (password.length > 128) {
      errors.push('Password must not exceed 128 characters');
    }
    
    // Check password strength
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    const strengthCount = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean).length;
    
    if (strengthCount < 3) {
      errors.push('Password must contain at least 3 of: uppercase letters, lowercase letters, numbers, special characters');
    }
    
    // Check for common weak passwords
    const commonPasswords = ['password', '12345678', 'qwerty', 'abc123', 'password123', '123456789'];
    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push('Password is too common. Please choose a stronger password');
    }
  }

  // Name validation
  if (!firstname || firstname.length < 2) {
    errors.push('First name must be at least 2 characters');
  }
  if (!lastname || lastname.length < 2) {
    errors.push('Last name must be at least 2 characters');
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  // Sanitize inputs
  req.body.username = sanitizeString(username);
  req.body.email = validator.normalizeEmail(email);
  req.body.firstname = sanitizeString(firstname);
  req.body.lastname = sanitizeString(lastname);
  req.body.city = sanitizeString(req.body.city);
  req.body.state = sanitizeString(req.body.state);

  next();
};

// Validate login input
const validateLogin = (req, res, next) => {
  const { username, password } = req.body;
  const errors = [];

  if (!username) {
    errors.push('Username is required');
  }
  if (!password) {
    errors.push('Password is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  req.body.username = sanitizeString(username);
  next();
};

// Validate tweet creation
const validateTweet = (req, res, next) => {
  const { title, description, location } = req.body;
  const errors = [];

  if (!title || title.length < 5) {
    errors.push('Title must be at least 5 characters');
  }
  if (title && title.length > 200) {
    errors.push('Title must not exceed 200 characters');
  }

  if (!description || description.length < 10) {
    errors.push('Description must be at least 10 characters');
  }
  if (description && description.length > 1000) {
    errors.push('Description must not exceed 1000 characters');
  }

  if (!location || location.length < 3) {
    errors.push('Location is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  // Sanitize inputs
  req.body.title = sanitizeString(title);
  req.body.description = sanitizeString(description);
  req.body.location = sanitizeString(location);

  next();
};

// Validate comment
const validateComment = (req, res, next) => {
  const { text } = req.body;
  const errors = [];

  if (!text || text.trim().length < 1) {
    errors.push('Comment cannot be empty');
  }
  if (text && text.length > 500) {
    errors.push('Comment must not exceed 500 characters');
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  // SECURITY FIX #7: Sanitize comment to prevent XSS
  // Remove all HTML tags and escape special characters
  let sanitized = text.replace(/<[^>]*>/g, ''); // Remove HTML tags
  sanitized = validator.escape(sanitized); // Escape HTML entities
  
  req.body.text = sanitized;
  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validateTweet,
  validateComment,
  sanitizeString,
};
