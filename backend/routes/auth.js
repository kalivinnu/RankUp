const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
};

// Local Registration
router.post('/register', async (req, res) => {
  try {
    const { username, password, role } = req.body;
    console.log(`--- Registration Attempt: ${username} (${role || 'student'}) ---`);
    
    // Domain Validation
    const userRole = role || 'student';
    if (userRole === 'admin' && !username.endsWith('@eastpoint.ac.in')) {
      console.warn(`❌ Registration Rejected: ${username} - MUST use @eastpoint.ac.in for Admin`);
      return res.status(400).json({ message: 'Admins must use @eastpoint.ac.in email' });
    }
    if (userRole === 'student' && !username.endsWith('@epcet.edu.in')) {
      console.warn(`❌ Registration Rejected: ${username} - MUST use @epcet.edu.in for Student`);
      return res.status(400).json({ message: 'Students must use @epcet.edu.in email' });
    }

    let user = await User.findOne({ username });
    if (user) return res.status(400).json({ message: 'User already exists' });

    user = new User({ username, password, role: userRole });
    await user.save();
    
    const token = generateToken(user);
    console.log(`✅ Registration Successful: ${username}`);
    res.json({ token, user: { id: user._id, username: user.username, role: user.role } });
  } catch (err) {
    console.error('❌ Registration Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Local Login
router.post('/login', (req, res, next) => {
  passport.authenticate('local', { session: false }, (err, user, info) => {
    if (err) {
      console.error('❌ Login Error:', err);
      return next(err);
    }
    if (!user) {
      console.warn(`❌ Login Failed: ${info.message}`);
      return res.status(400).json({ message: info.message });
    }
    if (user.role === 'admin' && !user.username.endsWith('@eastpoint.ac.in')) {
      console.warn(`❌ Login Domain Violation: ${user.username} (Admin)`);
      return res.status(403).json({ message: 'Access denied. Admin role requires an @eastpoint.ac.in email address.' });
    }
    if (user.role === 'student' && !user.username.endsWith('@epcet.edu.in')) {
      console.warn(`❌ Login Domain Violation: ${user.username} (Student)`);
      return res.status(403).json({ message: 'Access denied. Student role requires an @epcet.edu.in email address.' });
    }
    
    const token = generateToken(user);
    console.log(`✅ Login Successful: ${user.username}`);
    res.json({ token, user: { id: user._id, username: user.username, role: user.role } });
  })(req, res, next);
});

// Google Auth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login', session: false }),
  (req, res) => {
    const token = generateToken(req.user);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/auth/success?token=${token}`);
  }
);

module.exports = router;
