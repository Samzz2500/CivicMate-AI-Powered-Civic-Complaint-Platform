const mongoose = require('mongoose');
const Tweet = require('../../../models/Tweet');
const User = require('../../../models/User');

describe('Tweet Model', () => {
  let testUser;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/urbanml-test', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    testUser = await User.create({
      username: 'tweetuser',
      email: 'tweet@example.com',
      password: 'password',
      firstname: 'Tweet',
      lastname: 'User'
    });
  });

  afterAll(async () => {
    await Tweet.deleteMany({});
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  afterEach(async () => {
    await Tweet.deleteMany({});
  });

  describe('Tweet Creation', () => {
    it('should create a valid tweet', async () => {
      const tweetData = {
        title: 'Pothole on Main Road',
        description: 'Large pothole causing traffic issues',
        location: 'Main Road, Mumbai',
        category: 'potholes',
        user: testUser._id
      };

      const tweet = await Tweet.create(tweetData);

      expect(tweet.title).toBe(tweetData.title);
      expect(tweet.description).toBe(tweetData.description);
      expect(tweet.completed).toBe('pending'); // Default status
      expect(tweet.priority).toBe(0); // Default priority
      expect(tweet.upvotes).toEqual([]);
      expect(tweet.likes).toEqual([]);
    });

    it('should fail without required fields', async () => {
      const tweet = new Tweet({});
      
      let error;
      try {
        await tweet.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.title).toBeDefined();
      expect(error.errors.description).toBeDefined();
      expect(error.errors.location).toBeDefined();
      expect(error.errors.user).toBeDefined();
    });

    it('should only accept valid categories', async () => {
      const tweetData = {
        title: 'Test',
        description: 'Test description',
        location: 'Test location',
        category: 'invalid_category',
        user: testUser._id
      };

      let error;
      try {
        await Tweet.create(tweetData);
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
    });

    it('should only accept valid status values', async () => {
      const tweetData = {
        title: 'Test',
        description: 'Test description',
        location: 'Test location',
        completed: 'invalid_status',
        user: testUser._id
      };

      let error;
      try {
        await Tweet.create(tweetData);
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
    });
  });

  describe('Tweet Features', () => {
    it('should handle upvotes array', async () => {
      const tweet = await Tweet.create({
        title: 'Test',
        description: 'Test',
        location: 'Test',
        user: testUser._id
      });

      tweet.upvotes.push(testUser._id);
      await tweet.save();

      const updated = await Tweet.findById(tweet._id);
      expect(updated.upvotes).toHaveLength(1);
      expect(updated.upvotes[0].toString()).toBe(testUser._id.toString());
    });

    it('should handle comments', async () => {
      const tweet = await Tweet.create({
        title: 'Test',
        description: 'Test',
        location: 'Test',
        user: testUser._id
      });

      tweet.comments.push({
        user: testUser._id,
        text: 'Test comment'
      });
      await tweet.save();

      const updated = await Tweet.findById(tweet._id);
      expect(updated.comments).toHaveLength(1);
      expect(updated.comments[0].text).toBe('Test comment');
    });

    it('should track feedback submission', async () => {
      const tweet = await Tweet.create({
        title: 'Test',
        description: 'Test',
        location: 'Test',
        user: testUser._id,
        completed: 'completed'
      });

      tweet.feedbackSubmitted = true;
      await tweet.save();

      const updated = await Tweet.findById(tweet._id);
      expect(updated.feedbackSubmitted).toBe(true);
    });
  });

  describe('Tweet Timestamps', () => {
    it('should have createdAt and updatedAt timestamps', async () => {
      const tweet = await Tweet.create({
        title: 'Test',
        description: 'Test',
        location: 'Test',
        user: testUser._id
      });

      expect(tweet.createdAt).toBeDefined();
      expect(tweet.updatedAt).toBeDefined();
    });
  });
});
