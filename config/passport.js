require('dotenv').config();
const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/User');

// Debug: Log environment variables
console.log('GitHub Config:', {
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET ? '***' : undefined,
  callbackURL: 'http://localhost:3000/api/auth/github/callback'
});

passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: 'http://localhost:3000/api/auth/github/callback'
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists
      let user = await User.findOne({ githubId: profile.id });

      if (!user) {
        // Create new user if doesn't exist
        user = await User.create({
          githubId: profile.id,
          email: profile.emails?.[0]?.value || `${profile.username}@github.com`,
          name: profile.displayName || profile.username
        });
      }

      return done(null, user);
    } catch (error) {
      console.error('GitHub Strategy Error:', error);
      return done(error, null);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport; 