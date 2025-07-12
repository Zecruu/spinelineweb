console.log('🔄 Starting SpineLine server...');

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
console.log('✅ Express app created');

// Trust proxy for Railway deployment
app.set('trust proxy', 1);

// Connect to MongoDB (non-blocking)
const connectDB = require('./config/database');
connectDB().catch(error => {
  console.log('⚠️ Database connection failed, continuing without database');
});

// Security middleware (simplified)
app.use(helmet({ contentSecurityPolicy: false }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Simple health check (before any other middleware)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'SpineLine API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files from frontend dist
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Routes
const adminRoutes = require('./routes/admin');
const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patients');
const appointmentRoutes = require('./routes/appointments');
const appointmentHistoryRoutes = require('./routes/appointmentHistory');
const ledgerRoutes = require('./routes/ledger');
const auditRoutes = require('./routes/audit');
const billingCodesRoutes = require('./routes/billingCodes');
const diagnosticCodesRoutes = require('./routes/diagnosticCodes');
const carePackagesRoutes = require('./routes/carePackages');
const checkoutRoutes = require('./routes/checkout');
const referralsRoutes = require('./routes/referrals');
const doctorRoutes = require('./routes/doctor');
const soapNotesRoutes = require('./routes/soapNotes');

// API Routes - these must come BEFORE static file serving
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/appointment-history', appointmentHistoryRoutes);
app.use('/api/ledger', ledgerRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/billing-codes', billingCodesRoutes);
app.use('/api/diagnostic-codes', diagnosticCodesRoutes);
app.use('/api/care-packages', carePackagesRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/referrals', referralsRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/soap-notes', soapNotesRoutes);

// Database status endpoint (separate from health check)
app.get('/api/db-status', (req, res) => {
  try {
    const mongoose = require('mongoose');
    const dbStatus = mongoose.connection.readyState;
    const dbStatusText = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    res.status(200).json({
      status: 'success',
      database: {
        status: dbStatusText[dbStatus] || 'unknown',
        connected: dbStatus === 1
      }
    });
  } catch (error) {
    res.status(200).json({
      status: 'success',
      database: {
        status: 'unavailable',
        connected: false
      }
    });
  }
});

// Database test route
app.get('/api/test-db', async (req, res) => {
  try {
    const mongoose = require('mongoose');

    if (mongoose.connection.readyState === 1) {
      // Test database operation
      const collections = await mongoose.connection.db.listCollections().toArray();
      res.status(200).json({
        status: 'success',
        message: 'Database connection successful',
        database: mongoose.connection.name,
        host: mongoose.connection.host,
        collections: collections.length,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: 'Database not connected',
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
      } else if (filePath.endsWith('.html')) {
        res.setHeader('Content-Type', 'text/html');
      } else if (filePath.endsWith('.json')) {
        res.setHeader('Content-Type', 'application/json');
      } else if (filePath.endsWith('.ico')) {
        res.setHeader('Content-Type', 'image/x-icon');
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

    // If it's a static asset request that wasn't found, return 404
    if (req.path.match(/\.(css|js|ico|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/)) {
      console.log('Static asset not found:', req.path);
      return res.status(404).send('Asset not found');
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

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 SpineLine API server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received');
  server.close(() => process.exit(0));
});
