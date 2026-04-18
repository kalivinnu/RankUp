require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const passport = require('passport');

// Import routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const studentRoutes = require('./routes/student');

// Need passport config run
require('./config/passport');

const app = express();
const PORT = process.env.PORT || 5000;

// Environment Variable Validation for Deployment
const requiredEnv = ['MONGODB_URI', 'JWT_SECRET', 'SESSION_SECRET'];
const missingEnv = requiredEnv.filter(k => !process.env[k]);

if (missingEnv.length > 0) {
  console.error('❌ DEPLOYMENT ERROR: Missing required environment variables:', missingEnv.join(', '));
  console.error('Check your Render Dashboard -> Environment tab.');
  process.exit(1); 
}

// Middleware
const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';
console.log(`--- CORS: Allowed Origin set to: ${allowedOrigin} ---`);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // In production, we strictly check against allowedOrigin. 
    // In development, we allow localhost.
    if (origin === allowedOrigin || origin.includes('localhost')) {
      callback(null, true);
    } else {
      console.warn(`⚠️ CORS Blocked: Request from origin ${origin} not allowed by ${allowedOrigin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(passport.initialize());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);

// Database Connection
console.log('--- Startup: Attempting to connect to MongoDB ---');
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB Atlas');
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('❌ MongoDB Connection Error:', err.message);
    process.exit(1);
  });
