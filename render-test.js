const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const request = require('supertest');
const app = require('./app');
const User = require('./models/User');
const Task = require('./models/Task');
const Category = require('./models/Category');
const Comment = require('./models/Comment');

// Set test environment variables
process.env.PORT = 3001;
process.env.NODE_ENV = 'test';
process.env.HOST = 'localhost';
process.env.JWT_EXPIRES_IN = '1h';
process.env.CLIENT_URL = 'http://localhost:3001';

// Load environment variables from .env file
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envConfig = require('dotenv').parse(fs.readFileSync(envPath));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
}

// Ensure we're using the test database
if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI environment variable is required');
  process.exit(1);
}

// Ensure we have JWT secrets
if (!process.env.JWT_SECRET || !process.env.SESSION_SECRET) {
  console.error('JWT_SECRET and SESSION_SECRET environment variables are required');
  process.exit(1);
}

// Ensure we have GitHub OAuth credentials
if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET || !process.env.GITHUB_CALLBACK_URL) {
  console.error('GitHub OAuth credentials are required');
  process.exit(1);
}

console.log('Starting tests with environment:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('MONGODB_URI:', process.env.MONGODB_URI);
console.log('PORT:', process.env.PORT);
console.log('HOST:', process.env.HOST);

async function runTests() {
  console.log('Starting GET Routes Tests...\n');

  // Create test user
  const user = await User.create({
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

  const token = loginRes.body.token;

  // Create test data
  const task = await Task.create({
    title: 'Test Task',
    description: 'Test Description',
    priority: 'high',
    user: user._id
  });

  const category = await Category.create({
    name: 'Test Category',
    description: 'Test Description',
    user: user._id
  });

  const comment = await Comment.create({
    content: 'Test Comment',
    task: task._id,
    user: user._id
  });

  // Test GET routes
  console.log('Testing User GET Routes...');
  const userProfileRes = await request(app)
    .get('/api/users/profile')
    .set('Authorization', `Bearer ${token}`);
  console.log('User Profile GET:', userProfileRes.statusCode === 200 ? 'PASS' : 'FAIL');

  console.log('\nTesting Task GET Routes...');
  const tasksRes = await request(app)
    .get('/api/tasks')
    .set('Authorization', `Bearer ${token}`);
  console.log('Get All Tasks:', tasksRes.statusCode === 200 ? 'PASS' : 'FAIL');

  const taskByIdRes = await request(app)
    .get(`/api/tasks/${task._id}`)
    .set('Authorization', `Bearer ${token}`);
  console.log('Get Task by ID:', taskByIdRes.statusCode === 200 ? 'PASS' : 'FAIL');

  console.log('\nTesting Category GET Routes...');
  const categoriesRes = await request(app)
    .get('/api/categories')
    .set('Authorization', `Bearer ${token}`);
  console.log('Get All Categories:', categoriesRes.statusCode === 200 ? 'PASS' : 'FAIL');

  const categoryByIdRes = await request(app)
    .get(`/api/categories/${category._id}`)
    .set('Authorization', `Bearer ${token}`);
  console.log('Get Category by ID:', categoryByIdRes.statusCode === 200 ? 'PASS' : 'FAIL');

  console.log('\nTesting Comment GET Routes...');
  const commentsRes = await request(app)
    .get(`/api/comments/task/${task._id}`)
    .set('Authorization', `Bearer ${token}`);
  console.log('Get Comments for Task:', commentsRes.statusCode === 200 ? 'PASS' : 'FAIL');

  const commentByIdRes = await request(app)
    .get(`/api/comments/${comment._id}`)
    .set('Authorization', `Bearer ${token}`);
  console.log('Get Comment by ID:', commentByIdRes.statusCode === 200 ? 'PASS' : 'FAIL');

  // Cleanup
  await User.deleteOne({ email: 'test@example.com' });
  await Task.deleteMany({ user: user._id });
  await Category.deleteMany({ user: user._id });
  await Comment.deleteMany({ user: user._id });

  console.log('\nAll GET route tests completed!');
}

runTests().catch(console.error); 