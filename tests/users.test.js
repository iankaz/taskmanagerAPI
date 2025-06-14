const request = require('supertest');
const app = require('../app');
const User = require('../models/User');

describe('User Endpoints', () => {
  describe('POST /api/users/signup', () => {
    it('should create a new user', async () => {
      const res = await request(app)
        .post('/api/users/signup')
        .send({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('email', 'test@example.com');
    });

    it('should not create user with existing email', async () => {
      // First create a user
      await User.create({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      });

      // Try to create another user with same email
      const res = await request(app)
        .post('/api/users/signup')
        .send({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User 2'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error', 'User already exists');
      expect(res.body).toHaveProperty('details');
    });

    it('should not create user with invalid email', async () => {
      const res = await request(app)
        .post('/api/users/signup')
        .send({
          email: 'invalid-email',
          password: 'password123',
          name: 'Test User'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
      expect(res.body).toHaveProperty('details');
    });

    it('should not create user with short password', async () => {
      const res = await request(app)
        .post('/api/users/signup')
        .send({
          email: 'test@example.com',
          password: '123',
          name: 'Test User'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
      expect(res.body).toHaveProperty('details');
    });
  });

  describe('POST /api/users/login', () => {
    beforeEach(async () => {
      await User.create({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      });
    });

    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/users/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('email', 'test@example.com');
    });

    it('should not login with invalid password', async () => {
      const res = await request(app)
        .post('/api/users/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('error', 'Invalid credentials');
      expect(res.body).toHaveProperty('details');
    });

    it('should not login with non-existent email', async () => {
      const res = await request(app)
        .post('/api/users/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('error', 'Invalid credentials');
      expect(res.body).toHaveProperty('details');
    });
  });

  describe('GET /api/users/profile', () => {
    let token;
    let user;

    beforeEach(async () => {
      user = await User.create({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      });

      const loginRes = await request(app)
        .post('/api/users/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      token = loginRes.body.token;
    });

    it('should get user profile with valid token', async () => {
      const res = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('email', 'test@example.com');
    });

    it('should not get profile without token', async () => {
      const res = await request(app)
        .get('/api/users/profile');

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('error', 'Authentication required');
      expect(res.body).toHaveProperty('details');
    });

    it('should not get profile with invalid token', async () => {
      const res = await request(app)
        .get('/api/users/profile')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('error');
      expect(res.body).toHaveProperty('details');
    });
  });
}); 