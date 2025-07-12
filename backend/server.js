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
connectDB().then((connection) => {
  if (connection) {
    console.log('✅ Database connection established');
  } else {
    console.log('⚠️ Server starting without database connection');
  }
}).catch((error) => {
  console.error('❌ Database connection failed:', error.message);
  console.log('⚠️ Server starting without database connection');
});

// Security middleware with CSP configuration
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: [
        "'self'",
        "https://*.railway.app",
        "http://localhost:*",
        "ws://localhost:*"
      ],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "https:", "data:"]
    }
  }
}));

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

// Health check route
app.get('/api/health', (req, res) => {
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
    message: 'SpineLine API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: {
      status: dbStatusText[dbStatus] || 'unknown',
      connected: dbStatus === 1
    }
  });
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

console.log('🔧 Starting server...');
console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`🔌 Port: ${PORT}`);
console.log(`🗄️ MongoDB URI: ${process.env.MONGO_URI ? 'Set' : 'Not set'}`);

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 SpineLine API server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔍 Database test: http://localhost:${PORT}/api/test-db`);
  console.log(`🔄 Update 13 - Deployment fixed at: ${new Date().toISOString()}`);
});

server.on('error', (error) => {
  console.error('❌ Server error:', error);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
