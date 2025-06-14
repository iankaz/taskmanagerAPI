const request = require('supertest');
const app = require('../app');
const User = require('../models/User');
const Task = require('../models/Task');
const Category = require('../models/Category');
const Comment = require('../models/Comment');

describe('GET Routes Testing', () => {
  let token;
  let user;
  let task;
  let category;
  let comment;

  // Setup before all tests
  beforeAll(async () => {
    // Delete any existing test user
    await User.deleteOne({ email: 'test@example.com' });

    // Create test user
    user = await User.create({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User'
    });

    // Login to get token
    const loginRes = await request(app)
      .post('/api/users/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });

    token = loginRes.body.token;

    // Create test task
    task = await Task.create({
      title: 'Test Task',
      description: 'Test Description',
      priority: 'high',
      user: user._id
    });

    // Create test category
    category = await Category.create({
      name: 'Test Category',
      description: 'Test Description',
      user: user._id
    });

    // Create test comment
    comment = await Comment.create({
      content: 'Test Comment',
      task: task._id,
      user: user._id
    });

    // Wait for token to be valid
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  // Cleanup after all tests
  afterAll(async () => {
    await User.deleteOne({ email: 'test@example.com' });
    await Task.deleteMany({ user: user._id });
    await Category.deleteMany({ user: user._id });
    await Comment.deleteMany({ user: user._id });
  });

  describe('User GET Routes', () => {
    it('should get user profile with valid token', async () => {
      const res = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('email', 'test@example.com');
      expect(res.body).toHaveProperty('name', 'Test User');
    });

    it('should not get profile without token', async () => {
      const res = await request(app)
        .get('/api/users/profile');

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('error', 'Authentication required');
    });
  });

  describe('Task GET Routes', () => {
    it('should get all tasks for user', async () => {
      const res = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toHaveProperty('title', 'Test Task');
    });

    it('should get task by id', async () => {
      const res = await request(app)
        .get(`/api/tasks/${task._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('title', 'Test Task');
      expect(res.body).toHaveProperty('description', 'Test Description');
    });

    it('should filter tasks by priority', async () => {
      const res = await request(app)
        .get('/api/tasks?priority=high')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.every(task => task.priority === 'high')).toBeTruthy();
    });

    it('should not get task with invalid id', async () => {
      const res = await request(app)
        .get('/api/tasks/invalidid')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('error', 'Invalid task ID');
      expect(res.body).toHaveProperty('details');
    });
  });

  describe('Category GET Routes', () => {
    it('should get all categories for user', async () => {
      const res = await request(app)
        .get('/api/categories')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toHaveProperty('name', 'Test Category');
    });

    it('should get category by id', async () => {
      const res = await request(app)
        .get(`/api/categories/${category._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('name', 'Test Category');
      expect(res.body).toHaveProperty('description', 'Test Description');
    });

    it('should not get category with invalid id', async () => {
      const res = await request(app)
        .get('/api/categories/invalidid')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('error', 'Invalid category ID');
      expect(res.body).toHaveProperty('details');
    });
  });

  describe('Comment GET Routes', () => {
    it('should get all comments for a task', async () => {
      const res = await request(app)
        .get(`/api/comments/task/${task._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toHaveProperty('content', 'Test Comment');
    });

    it('should get comment by id', async () => {
      const res = await request(app)
        .get(`/api/comments/${comment._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('content', 'Test Comment');
      expect(res.body).toHaveProperty('task', task._id.toString());
    });

    it('should not get comments for non-existent task', async () => {
      const res = await request(app)
        .get('/api/comments/task/invalidtaskid')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('error', 'Invalid task ID');
      expect(res.body).toHaveProperty('details');
    });

    it('should not get comment with invalid id', async () => {
      const res = await request(app)
        .get('/api/comments/invalidid')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('error', 'Invalid comment ID');
      expect(res.body).toHaveProperty('details');
    });
  });

  // Test unauthorized access
  describe('Unauthorized Access', () => {
    it('should not access any routes without token', async () => {
      const routes = [
        '/api/users/profile',
        '/api/tasks',
        '/api/categories',
        `/api/comments/task/${task._id}`
      ];

      for (const route of routes) {
        const res = await request(app).get(route);
        expect(res.statusCode).toBe(401);
        expect(res.body).toHaveProperty('error', 'Authentication required');
      }
    });
  });
}); 