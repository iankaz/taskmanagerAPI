const request = require('supertest');
const app = require('../app');
const User = require('../models/User');
const Task = require('../models/Task');

describe('Task Endpoints', () => {
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

  describe('POST /api/tasks', () => {
    it('should create a new task', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Test Task',
          description: 'Test Description',
          priority: 'high'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('title', 'Test Task');
      expect(res.body).toHaveProperty('user', user._id.toString());
    });

    it('should not create task without title', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({
          description: 'Test Description',
          priority: 'high'
        });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /api/tasks', () => {
    beforeEach(async () => {
      // Create some test tasks
      await Task.create([
        {
          title: 'Task 1',
          description: 'Description 1',
          priority: 'high',
          user: user._id
        },
        {
          title: 'Task 2',
          description: 'Description 2',
          priority: 'low',
          user: user._id
        }
      ]);
    });

    it('should get all tasks for user', async () => {
      const res = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.length).toBe(2);
    });

    it('should filter tasks by priority', async () => {
      const res = await request(app)
        .get('/api/tasks?priority=high')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].priority).toBe('high');
    });
  });

  describe('GET /api/tasks/:id', () => {
    let task;

    beforeEach(async () => {
      task = await Task.create({
        title: 'Test Task',
        description: 'Test Description',
        priority: 'high',
        user: user._id
      });
    });

    it('should get task by id', async () => {
      const res = await request(app)
        .get(`/api/tasks/${task._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('title', 'Test Task');
    });

    it('should not get task with invalid id', async () => {
      const res = await request(app)
        .get('/api/tasks/invalidid')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(500);
    });
  });

  describe('PUT /api/tasks/:id', () => {
    let task;

    beforeEach(async () => {
      task = await Task.create({
        title: 'Test Task',
        description: 'Test Description',
        priority: 'high',
        user: user._id
      });
    });

    it('should update task', async () => {
      const res = await request(app)
        .put(`/api/tasks/${task._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Updated Task',
          priority: 'low'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('title', 'Updated Task');
      expect(res.body).toHaveProperty('priority', 'low');
    });

    it('should not update task with invalid priority', async () => {
      const res = await request(app)
        .put(`/api/tasks/${task._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          priority: 'invalid'
        });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    let task;

    beforeEach(async () => {
      task = await Task.create({
        title: 'Test Task',
        description: 'Test Description',
        priority: 'high',
        user: user._id
      });
    });

    it('should delete task', async () => {
      const res = await request(app)
        .delete(`/api/tasks/${task._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('message', 'Task deleted successfully');

      // Verify task is deleted
      const deletedTask = await Task.findById(task._id);
      expect(deletedTask).toBeNull();
    });

    it('should not delete non-existent task', async () => {
      const res = await request(app)
        .delete('/api/tasks/invalidid')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(404);
    });
  });
}); 