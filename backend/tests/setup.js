// Test setup file
const mongoose = require('mongoose');

// Increase timeout for all tests
jest.setTimeout(30000);

// Close database connection after all tests
afterAll(async () => {
  await mongoose.connection.close();
});

// Global test utilities
global.testUtils = {
  generateToken: (userId) => {
    const jwt = require('jsonwebtoken');
    return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'test-secret', {
      expiresIn: '1h'
    });
  },
  
  createTestUser: async () => {
    const User = require('../models/User');
    const bcrypt = require('bcryptjs');
    
    const hashedPassword = await bcrypt.hash('testpass123', 10);
    const user = await User.create({
      username: `testuser_${Date.now()}`,
      email: `test_${Date.now()}@example.com`,
      password: hashedPassword,
      firstname: 'Test',
      lastname: 'User',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001'
    });
    
    return user;
  },
  
  createTestAdmin: async () => {
    const User = require('../models/User');
    const bcrypt = require('bcryptjs');
    
    const hashedPassword = await bcrypt.hash('adminpass123', 10);
    const admin = await User.create({
      username: `admin_${Date.now()}`,
      email: `admin_${Date.now()}@example.com`,
      password: hashedPassword,
      firstname: 'Admin',
      lastname: 'User',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      role: 'admin'
    });
    
    return admin;
  }
};
