require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const connectDB = require('./config/database');

const app = express();

// Trust proxy for Railway deployment
app.set('trust proxy', 1);

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

    // In production, allow same-origin requests (frontend served from same domain)
    if (process.env.NODE_ENV === 'production') {
      return callback(null, true);
    }

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

// API Routes - these must come BEFORE static file serving
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/appointment-history', appointmentHistoryRoutes);
app.use('/api/ledger', ledgerRoutes);

// Production: Serve React app - AFTER API routes
if (process.env.NODE_ENV === 'production') {
  const fs = require('fs');
  const staticPath = path.join(__dirname, '../frontend/dist');

  // Debug: Check if build files exist
  console.log('Static path:', staticPath);
  console.log('Build files exist:', fs.existsSync(staticPath));
  if (fs.existsSync(staticPath)) {
    console.log('Build directory contents:', fs.readdirSync(staticPath));
  }

  // Serve static files with explicit options
  app.use(express.static(staticPath, {
    maxAge: '1d',
    setHeaders: (res, filePath) => {
      console.log('Serving static file:', filePath);
      if (filePath.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css');
      } else if (filePath.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript');
      }
    }
  }));

  // Handle React routing - send all non-API requests to React app
  app.get('*', (req, res) => {
    console.log('Catch-all route hit:', req.path);

    // If it's an API route, return 404
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({
        status: 'error',
        message: 'API route not found'
      });
    }

    // For all other routes, serve the React app
    const indexPath = path.join(staticPath, 'index.html');
    console.log('Serving index.html from:', indexPath);

    // Check if index.html exists before serving
    const fs = require('fs');
    if (!fs.existsSync(indexPath)) {
      console.error('index.html not found at:', indexPath);
      return res.status(500).json({
        status: 'error',
        message: 'Frontend build not found. Please check build process.'
      });
    }

    res.sendFile(indexPath, (err) => {
      if (err) {
        console.error('Error serving index.html:', err);
        res.status(500).json({
          status: 'error',
          message: 'Error serving frontend'
        });
      }
    });
  });
}

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

// Development mode - basic route for non-production
if (process.env.NODE_ENV !== 'production') {
  app.get('/', (req, res) => {
    res.json({
      message: 'Welcome to SpineLine API',
      version: '1.0.0',
      documentation: '/api/health',
      frontend: 'Run frontend separately in development mode'
    });
  });

  // 404 handler for development
  app.use('*', (req, res) => {
    res.status(404).json({
      status: 'error',
      message: 'Route not found'
    });
  });
}

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
