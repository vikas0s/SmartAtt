const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

// Route imports
const authRoutes = require('../server/routes/authRoutes');
const faceRoutes = require('../server/routes/faceRoutes');
const sessionRoutes = require('../server/routes/sessionRoutes');
const attendanceRoutes = require('../server/routes/attendanceRoutes');
const errorHandler = require('../server/middleware/errorHandler');

const app = express();

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// MongoDB connection (cached for serverless)
let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;

  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI environment variable is not set');
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    throw error;
  }
};

// Connect before handling requests
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
    });
  }
});

// Set up env vars that server modules expect
process.env.JWT_SECRET = process.env.JWT_SECRET || 'smart_attendance_jwt_secret_key_2024';
process.env.JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'smart_attendance_refresh_secret_key_2024';
process.env.JWT_REFRESH_EXPIRE = process.env.JWT_REFRESH_EXPIRE || '30d';
process.env.QR_EXPIRY_MINUTES = process.env.QR_EXPIRY_MINUTES || '5';

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/face', faceRoutes);
app.use('/api/session', sessionRoutes);
app.use('/api/attendance', attendanceRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    db: isConnected ? 'connected' : 'disconnected',
  });
});

// Error handler
app.use(errorHandler);

// Export for Vercel serverless
module.exports = app;
