const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../server-improved');
const User = require('../../models/User');

describe('Auth Routes Integration Tests', () => {
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

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123',
        firstname: 'New',
        lastname: 'User',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User registered successfully');

      const user = await User.findOne({ username: 'newuser' });
      expect(user).toBeDefined();
      expect(user.email).toBe(userData.email);
    });

    it('should fail with duplicate username', async () => {
      const userData = {
        username: 'duplicate',
        email: 'user1@example.com',
        password: 'password123',
        firstname: 'User',
        lastname: 'One'
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      const response = await request(app)
        .post('/api/auth/register')
        .send({ ...userData, email: 'user2@example.com' })
        .expect(400);

      expect(response.body.message).toBe('Username already exists');
    });

    it('should fail without required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'incomplete'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should create admin with valid admin secret', async () => {
      const adminData = {
        username: 'adminuser',
        email: 'admin@example.com',
        password: 'adminpass123',
        firstname: 'Admin',
        lastname: 'User',
        role: 'admin',
        adminSecret: process.env.ADMIN_SECRET || 'test-admin-secret'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(adminData)
        .expect(201);

      const admin = await User.findOne({ username: 'adminuser' });
      expect(admin.role).toBe('admin');
    });

    it('should fail to create admin with invalid secret', async () => {
      const adminData = {
        username: 'fakeadmin',
        email: 'fake@example.com',
        password: 'password123',
        firstname: 'Fake',
        lastname: 'Admin',
        role: 'admin',
        adminSecret: 'wrong-secret'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(adminData)
        .expect(403);

      expect(response.body.message).toBe('Invalid admin secret');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      await User.create({
        username: 'loginuser',
        email: 'login@example.com',
        password: hashedPassword,
        firstname: 'Login',
        lastname: 'User'
      });
    });

    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'loginuser',
          password: 'password123'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.user).toBeDefined();
      expect(response.body.user.username).toBe('loginuser');
    });

    it('should fail with invalid username', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistent',
          password: 'password123'
        })
        .expect(400);

      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should fail with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'loginuser',
          password: 'wrongpassword'
        })
        .expect(400);

      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should fail without credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/profile', () => {
    let token;
    let userId;

    beforeEach(async () => {
      const user = await global.testUtils.createTestUser();
      userId = user._id;
      token = global.testUtils.generateToken(userId);
    });

    it('should get user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.password).toBeUndefined(); // Password should be excluded
    });

    it('should fail without token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .expect(401);

      expect(response.body.message).toBe('No token provided');
    });

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.message).toBe('Invalid token');
    });
  });
});
