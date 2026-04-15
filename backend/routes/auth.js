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
    
    // Domain Validation
    const userRole = role || 'student';
    if (userRole === 'admin' && !username.endsWith('@eastpoint.ac.in')) {
      return res.status(400).json({ message: 'Admins must use @eastpoint.ac.in email' });
    }
    if (userRole === 'student' && !username.endsWith('@epcet.edu.in')) {
      return res.status(400).json({ message: 'Students must use @epcet.edu.in email' });
    }

    let user = await User.findOne({ username });
    if (user) return res.status(400).json({ message: 'User already exists' });

    user = new User({ username, password, role: userRole });
    await user.save();
    
    const token = generateToken(user);
    res.json({ token, user: { id: user._id, username: user.username, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Local Login
router.post('/login', (req, res, next) => {
  passport.authenticate('local', { session: false }, (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(400).json({ message: info.message });
    if (user.role === 'admin' && !user.username.endsWith('@eastpoint.ac.in')) {
      return res.status(403).json({ message: 'Access denied. Admin role requires an @eastpoint.ac.in email address.' });
    }
    if (user.role === 'student' && !user.username.endsWith('@epcet.edu.in')) {
      return res.status(403).json({ message: 'Access denied. Student role requires an @epcet.edu.in email address.' });
    }
    
    const token = generateToken(user);
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
