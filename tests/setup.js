const mongoose = require('mongoose');
require('dotenv').config();

let server;

// Set test environment variables
process.env.PORT = process.env.PORT || 3001;
process.env.NODE_ENV = 'test';
process.env.HOST = 'localhost';
process.env.JWT_EXPIRES_IN = '1h';
process.env.CLIENT_URL = 'http://localhost:3000';
process.env.JWT_SECRET = 'test-secret-key-123456789';

// Connect to test database before running tests
beforeAll(async () => {
  try {
    // Use test database
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/taskmanagerAPI_test';
    
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB:', mongoUri);

    // Start server on a different port for tests
    const app = require('../app');
    server = app.listen(3001);
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
});

// Clear database between tests
beforeEach(async () => {
  try {
    if (mongoose.connection.db) {
      const collections = await mongoose.connection.db.collections();
      for (let collection of collections) {
        await collection.deleteMany({});
      }
    }
  } catch (error) {
    console.error('Error clearing collections:', error);
  }
});

// Close database connection after all tests
afterAll(async () => {
  try {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error('Error closing connections:', error);
  }
}); 