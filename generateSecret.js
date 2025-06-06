const crypto = require('crypto');

// Generate a random string of 64 bytes (512 bits) and convert to base64
const secret = crypto.randomBytes(64).toString('base64');

console.log('Generated JWT Secret:');
console.log(secret);
console.log('\nAdd this to your .env file as:');
console.log('JWT_SECRET=' + secret); 