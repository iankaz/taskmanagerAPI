const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * @swagger
 * /api/auth/github:
 *   get:
 *     summary: Initiate GitHub OAuth login
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: Redirect to GitHub login page
 */
router.get('/github',
  passport.authenticate('github', { 
    scope: ['user:email'],
    session: false 
  })
);

/**
 * @swagger
 * /api/auth/github/callback:
 *   get:
 *     summary: GitHub OAuth callback
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Authentication successful
 *       401:
 *         description: Authentication failed
 */
router.get('/github/callback',
  passport.authenticate('github', { 
    failureRedirect: '/api/auth/github/failure',
    session: false 
  }),
  async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          error: 'Authentication failed',
          details: 'No user found after GitHub authentication'
        });
      }

      const token = jwt.sign(
        { userId: req.user._id },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      res.json({
        message: 'Authentication successful',
        token,
        user: {
          id: req.user._id,
          email: req.user.email,
          name: req.user.name,
          githubId: req.user.githubId
        }
      });
    } catch (error) {
      console.error('GitHub Callback Error:', error);
      res.status(500).json({ 
        error: 'Authentication failed',
        details: error.message
      });
    }
  }
);

/**
 * @swagger
 * /api/auth/github/failure:
 *   get:
 *     summary: GitHub OAuth failure
 *     tags: [Auth]
 *     responses:
 *       401:
 *         description: Authentication failed
 */
router.get('/github/failure', (req, res) => {
  res.status(401).json({ 
    error: 'GitHub authentication failed',
    details: 'Could not authenticate with GitHub'
  });
});

// Error route for authentication failures
router.get('/error', (req, res) => {
  res.status(401).json({ 
    message: 'Authentication failed',
    error: 'GitHub authentication failed'
  });
});

// Logout route
router.get('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

module.exports = router; 