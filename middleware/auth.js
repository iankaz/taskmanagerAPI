const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Authentication required',
        details: 'No token provided'
      });
    }

    console.log('JWT Secret:', process.env.JWT_SECRET);
    console.log('Token:', token);

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Decoded token:', decoded);
    } catch (error) {
      console.error('Token verification error:', error);
      return res.status(401).json({ 
        error: 'Invalid token',
        details: 'Token is invalid or expired'
      });
    }
    
    // Find user by id
    const user = await User.findOne({ _id: decoded.userId });
    console.log('Found user:', user ? 'yes' : 'no');
    
    if (!user) {
      return res.status(401).json({ 
        error: 'User not found',
        details: 'The user associated with this token no longer exists'
      });
    }

    // Add user to request object
    req.token = token;
    req.user = user;
    
    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    res.status(500).json({ 
      error: 'Authentication error',
      details: 'An unexpected error occurred during authentication'
    });
  }
};

module.exports = auth; 