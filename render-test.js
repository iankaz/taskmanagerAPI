const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

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

try {
  // Run the tests with the test environment
  console.log('\nRunning tests...');
  
  // Set environment variables for the child process
  const testEnv = {
    ...process.env,
    NODE_ENV: 'test',
    PORT: '3001'
  };

  // Use platform-specific command
  const command = process.platform === 'win32' 
    ? 'set NODE_ENV=test&& set PORT=3001&& npm test -- --detectOpenHandles'
    : 'NODE_ENV=test PORT=3001 npm test -- --detectOpenHandles';

  execSync(command, { 
    stdio: 'inherit',
    env: testEnv
  });
  
  console.log('\nTests completed successfully!');
} catch (error) {
  console.error('\nTests failed:', error.message);
  process.exit(1);
} 