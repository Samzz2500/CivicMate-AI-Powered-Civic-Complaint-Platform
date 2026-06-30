const mongoose = require('mongoose');
const User = require('../../../models/User');

describe('User Model', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/urbanml-test', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterAll(async () => {
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  describe('User Creation', () => {
    it('should create a valid user', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
        firstname: 'Test',
        lastname: 'User',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001'
      };

      const user = await User.create(userData);

      expect(user.username).toBe(userData.username);
      expect(user.email).toBe(userData.email);
      expect(user.role).toBe('user'); // Default role
      expect(user._id).toBeDefined();
    });

    it('should fail without required fields', async () => {
      const user = new User({});
      
      let error;
      try {
        await user.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.username).toBeDefined();
      expect(error.errors.email).toBeDefined();
      expect(error.errors.password).toBeDefined();
    });

    it('should not allow duplicate username', async () => {
      const userData = {
        username: 'duplicate',
        email: 'test1@example.com',
        password: 'password',
        firstname: 'Test',
        lastname: 'User'
      };

      await User.create(userData);

      let error;
      try {
        await User.create({ ...userData, email: 'test2@example.com' });
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.code).toBe(11000); // Duplicate key error
    });

    it('should create admin user with correct role', async () => {
      const adminData = {
        username: 'admin',
        email: 'admin@example.com',
        password: 'hashedpassword',
        firstname: 'Admin',
        lastname: 'User',
        role: 'admin'
      };

      const admin = await User.create(adminData);

      expect(admin.role).toBe('admin');
    });
  });

  describe('User Validation', () => {
    it('should only accept valid roles', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password',
        firstname: 'Test',
        lastname: 'User',
        role: 'invalid_role'
      };

      let error;
      try {
        await User.create(userData);
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
    });
  });
});
