require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const connectDB = require('./config/database');

const app = express();

// Connect to MongoDB
connectDB();

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// CORS configuration
const allowedOrigins = [
  'http://localhost:7890',
  'http://localhost:7891',
  'http://localhost:7892',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
const adminRoutes = require('./routes/admin');
const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patients');
const appointmentRoutes = require('./routes/appointments');
const appointmentHistoryRoutes = require('./routes/appointmentHistory');
const ledgerRoutes = require('./routes/ledger');

app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/appointment-history', appointmentHistoryRoutes);
app.use('/api/ledger', ledgerRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'SpineLine API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Database test route
app.get('/api/test-db', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    
    if (mongoose.connection.readyState === 1) {
      // Test database operation
      const db = mongoose.connection.db;
      const admin = db.admin();
      const result = await admin.ping();
      
      res.status(200).json({
        status: 'success',
        message: 'MongoDB connection successful',
        database: mongoose.connection.name,
        host: mongoose.connection.host,
        readyState: mongoose.connection.readyState,
        ping: result
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: 'MongoDB not connected',
        readyState: mongoose.connection.readyState
      });
    }
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Database test failed',
      error: error.message
    });
  }
});

// Serve static files from the React app build directory
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));

  // Catch all handler: send back React's index.html file for any non-API routes
  app.get('*', (req, res) => {
    // Don't serve index.html for API routes
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({
        status: 'error',
        message: 'API route not found'
      });
    }
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  });
} else {
  // Development mode - basic route
  app.get('/', (req, res) => {
    res.json({
      message: 'Welcome to SpineLine API',
      version: '1.0.0',
      documentation: '/api/health',
      frontend: 'Run frontend separately in development mode'
    });
  });
}

// 404 handler for API routes only
app.use('/api/*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'API route not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error:', err.stack);
  res.status(500).json({
    status: 'error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong!' : err.message
  });
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`🚀 SpineLine API server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔍 Database test: http://localhost:${PORT}/api/test-db`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
