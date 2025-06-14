const request = require('supertest');
const app = require('../app');
const User = require('../models/User');
const Task = require('../models/Task');
const Comment = require('../models/Comment');

describe('Comment Endpoints', () => {
  let token;
  let user;
  let task;

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

    // Create a test task
    task = await Task.create({
      title: 'Test Task',
      description: 'Test Description',
      priority: 'high',
      user: user._id
    });
  });

  describe('POST /api/comments', () => {
    it('should create a new comment', async () => {
      const res = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${token}`)
        .send({
          content: 'Test Comment',
          task: task._id
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('content', 'Test Comment');
      expect(res.body).toHaveProperty('task', task._id.toString());
      expect(res.body).toHaveProperty('user', user._id.toString());
    });

    it('should not create comment without content', async () => {
      const res = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${token}`)
        .send({
          task: task._id
        });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
      expect(res.body).toHaveProperty('details');
    });

    it('should not create comment for non-existent task', async () => {
      const res = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${token}`)
        .send({
          content: 'Test Comment',
          task: 'invalidtaskid'
        });

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('error');
      expect(res.body).toHaveProperty('details');
    });
  });

  describe('GET /api/comments/task/:taskId', () => {
    beforeEach(async () => {
      // Create some test comments
      await Comment.create([
        {
          content: 'Comment 1',
          task: task._id,
          user: user._id
        },
        {
          content: 'Comment 2',
          task: task._id,
          user: user._id
        }
      ]);
    });

    it('should get all comments for task', async () => {
      const res = await request(app)
        .get(`/api/comments/task/${task._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.length).toBe(2);
      expect(res.body[0]).toHaveProperty('content');
      expect(res.body[0]).toHaveProperty('user');
    });

    it('should not get comments without auth', async () => {
      const res = await request(app)
        .get(`/api/comments/task/${task._id}`);

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('error', 'Authentication required');
      expect(res.body).toHaveProperty('details');
    });

    it('should not get comments for non-existent task', async () => {
      const res = await request(app)
        .get('/api/comments/task/invalidtaskid')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('error');
      expect(res.body).toHaveProperty('details');
    });
  });

  describe('GET /api/comments/:id', () => {
    let comment;

    beforeEach(async () => {
      comment = await Comment.create({
        content: 'Test Comment',
        task: task._id,
        user: user._id
      });
    });

    it('should get comment by id', async () => {
      const res = await request(app)
        .get(`/api/comments/${comment._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('content', 'Test Comment');
      expect(res.body).toHaveProperty('user');
    });

    it('should not get comment with invalid id', async () => {
      const res = await request(app)
        .get('/api/comments/invalidid')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('error');
      expect(res.body).toHaveProperty('details');
    });

    it('should not get comment without auth', async () => {
      const res = await request(app)
        .get(`/api/comments/${comment._id}`);

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('error', 'Authentication required');
      expect(res.body).toHaveProperty('details');
    });
  });

  describe('PUT /api/comments/:id', () => {
    let comment;

    beforeEach(async () => {
      comment = await Comment.create({
        content: 'Test Comment',
        task: task._id,
        user: user._id
      });
    });

    it('should update comment', async () => {
      const res = await request(app)
        .put(`/api/comments/${comment._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          content: 'Updated Comment'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('content', 'Updated Comment');
    });

    it('should not update comment with empty content', async () => {
      const res = await request(app)
        .put(`/api/comments/${comment._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          content: ''
        });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
      expect(res.body).toHaveProperty('details');
    });

    it('should not update non-existent comment', async () => {
      const res = await request(app)
        .put('/api/comments/invalidid')
        .set('Authorization', `Bearer ${token}`)
        .send({
          content: 'Updated Comment'
        });

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('error');
      expect(res.body).toHaveProperty('details');
    });

    it('should not update comment by another user', async () => {
      // Create another user
      const otherUser = await User.create({
        email: 'other@example.com',
        password: 'password123',
        name: 'Other User'
      });

      // Create comment by other user
      const otherComment = await Comment.create({
        content: 'Other User Comment',
        task: task._id,
        user: otherUser._id
      });

      // Try to update other user's comment
      const res = await request(app)
        .put(`/api/comments/${otherComment._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          content: 'Updated Comment'
        });

      expect(res.statusCode).toBe(403);
      expect(res.body).toHaveProperty('error');
      expect(res.body).toHaveProperty('details');
    });
  });

  describe('DELETE /api/comments/:id', () => {
    let comment;

    beforeEach(async () => {
      comment = await Comment.create({
        content: 'Test Comment',
        task: task._id,
        user: user._id
      });
    });

    it('should delete comment', async () => {
      const res = await request(app)
        .delete(`/api/comments/${comment._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('error', 'Comment deleted successfully');

      // Verify comment is deleted
      const deletedComment = await Comment.findById(comment._id);
      expect(deletedComment).toBeNull();
    });

    it('should not delete non-existent comment', async () => {
      const res = await request(app)
        .delete('/api/comments/invalidid')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('error');
      expect(res.body).toHaveProperty('details');
    });

    it('should not delete comment without auth', async () => {
      const res = await request(app)
        .delete(`/api/comments/${comment._id}`);

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('error', 'Authentication required');
      expect(res.body).toHaveProperty('details');
    });
  });
}); 