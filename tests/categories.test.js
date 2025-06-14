const request = require('supertest');
const app = require('../app');
const User = require('../models/User');
const Category = require('../models/Category');

describe('Category Endpoints', () => {
  let token;
  let user;

  beforeEach(async () => {
    // Create a test user and get token
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

  describe('POST /api/categories', () => {
    it('should create a new category', async () => {
      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Test Category',
          description: 'Test Description'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('name', 'Test Category');
      expect(res.body).toHaveProperty('user', user._id.toString());
    });

    it('should not create category without name', async () => {
      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({
          description: 'Test Description'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
      expect(res.body).toHaveProperty('details');
    });

    it('should not create duplicate category names for same user', async () => {
      // Create first category
      await Category.create({
        name: 'Test Category',
        user: user._id
      });

      // Try to create duplicate
      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Test Category',
          description: 'Test Description'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error', 'Category already exists');
      expect(res.body).toHaveProperty('details');
    });
  });

  describe('GET /api/categories', () => {
    beforeEach(async () => {
      // Create some test categories
      await Category.create([
        {
          name: 'Category 1',
          description: 'Description 1',
          user: user._id
        },
        {
          name: 'Category 2',
          description: 'Description 2',
          user: user._id
        }
      ]);
    });

    it('should get all categories for user', async () => {
      const res = await request(app)
        .get('/api/categories')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.length).toBe(2);
    });

    it('should not get categories without auth', async () => {
      const res = await request(app)
        .get('/api/categories');

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('error', 'Authentication required');
      expect(res.body).toHaveProperty('details');
    });
  });

  describe('GET /api/categories/:id', () => {
    let category;

    beforeEach(async () => {
      category = await Category.create({
        name: 'Test Category',
        description: 'Test Description',
        user: user._id
      });
    });

    it('should get category by id', async () => {
      const res = await request(app)
        .get(`/api/categories/${category._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('name', 'Test Category');
    });

    it('should not get category with invalid id', async () => {
      const res = await request(app)
        .get('/api/categories/invalidid')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('error');
      expect(res.body).toHaveProperty('details');
    });

    it('should not get category without auth', async () => {
      const res = await request(app)
        .get(`/api/categories/${category._id}`);

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('error', 'Authentication required');
      expect(res.body).toHaveProperty('details');
    });
  });

  describe('PUT /api/categories/:id', () => {
    let category;

    beforeEach(async () => {
      category = await Category.create({
        name: 'Test Category',
        description: 'Test Description',
        user: user._id
      });
    });

    it('should update category', async () => {
      const res = await request(app)
        .put(`/api/categories/${category._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Updated Category',
          description: 'Updated Description'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('name', 'Updated Category');
      expect(res.body).toHaveProperty('description', 'Updated Description');
    });

    it('should not update category with empty name', async () => {
      const res = await request(app)
        .put(`/api/categories/${category._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: ''
        });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
      expect(res.body).toHaveProperty('details');
    });

    it('should not update non-existent category', async () => {
      const res = await request(app)
        .put('/api/categories/invalidid')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Updated Category'
        });

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('error');
      expect(res.body).toHaveProperty('details');
    });
  });

  describe('DELETE /api/categories/:id', () => {
    let category;

    beforeEach(async () => {
      category = await Category.create({
        name: 'Test Category',
        description: 'Test Description',
        user: user._id
      });
    });

    it('should delete category', async () => {
      const res = await request(app)
        .delete(`/api/categories/${category._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('error', 'Category deleted successfully');

      // Verify category is deleted
      const deletedCategory = await Category.findById(category._id);
      expect(deletedCategory).toBeNull();
    });

    it('should not delete non-existent category', async () => {
      const res = await request(app)
        .delete('/api/categories/invalidid')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('error');
      expect(res.body).toHaveProperty('details');
    });
  });
}); 