const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// Local Strategy
passport.use(new LocalStrategy(
  async (username, password, done) => {
    try {
      const user = await User.findOne({ username });
      if (!user) return done(null, false, { message: 'Incorrect email address.' });
      
      const isMatch = await user.comparePassword(password);
      if (!isMatch) return done(null, false, { message: 'Incorrect password.' });
      
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }
));

// Google Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback" // Relative path works if the strategy is configured on the same domain
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const emailObj = profile.emails && profile.emails[0];
      const email = emailObj ? emailObj.value : null;
      
      // Domain validation check for OAuth
      if (!email || (!email.endsWith('@epcet.edu.in') && !email.endsWith('@eastpoint.ac.in'))) {
         return done(new Error('Unauthorized email domain. Please use a college email id.'), null);
      }

      let user = await User.findOne({ googleId: profile.id });
      if (!user) {
        // Find by email in case they registered manually first
        user = await User.findOne({ username: email });
        if (user) {
           user.googleId = profile.id;
           await user.save();
        } else {
           user = await User.create({
             googleId: profile.id,
             username: email,
             role: email.endsWith('@eastpoint.ac.in') ? 'admin' : 'student'
           });
        }
      }
      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }
));



module.exports = passport;
