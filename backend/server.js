console.log('🔄 Starting SpineLine server...');

try {
  require('dotenv').config();
  console.log('✅ Environment variables loaded');
} catch (error) {
  console.error('❌ Error loading environment variables:', error);
}

try {
  const express = require('express');
  const cors = require('cors');
  const helmet = require('helmet');
  const rateLimit = require('express-rate-limit');
  const path = require('path');
  console.log('✅ Dependencies loaded');

  const app = express();
  console.log('✅ Express app created');
} catch (error) {
  console.error('❌ Error loading dependencies:', error);
  process.exit(1);
}

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();

// Trust proxy for Railway deployment
try {
  app.set('trust proxy', 1);
  console.log('✅ Proxy trust configured');
} catch (error) {
  console.error('❌ Error configuring proxy trust:', error);
}

// Connect to MongoDB (non-blocking)
try {
  const connectDB = require('./config/database');
  console.log('✅ Database module loaded');

  // Don't wait for database connection
  connectDB().then((connection) => {
    if (connection) {
      console.log('✅ Database connection established');
    } else {
      console.log('⚠️ Server running without database connection');
    }
  }).catch((error) => {
    console.error('❌ Database connection failed:', error.message);
    console.log('⚠️ Server running without database connection');
  });
} catch (error) {
  console.error('❌ Error loading database module:', error);
  console.log('⚠️ Server starting without database module');
}

// Security middleware (simplified for deployment)
try {
  app.use(helmet({
    contentSecurityPolicy: false // Disable CSP for now to avoid conflicts
  }));
  console.log('✅ Security middleware configured');
} catch (error) {
  console.error('❌ Error configuring security middleware:', error);
}

// Rate limiting
try {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
  });
  app.use('/api/', limiter);
  console.log('✅ Rate limiting configured');
} catch (error) {
  console.error('❌ Error configuring rate limiting:', error);
}

// CORS configuration (simplified for deployment)
try {
  app.use(cors({
    origin: true, // Allow all origins for now
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  }));
  console.log('✅ CORS configured');
} catch (error) {
  console.error('❌ Error configuring CORS:', error);
}

// Simple health check (before any other middleware)
app.get('/api/health', (req, res) => {
  console.log('🔍 Health check requested');
  res.status(200).json({
    status: 'success',
    message: 'SpineLine API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Body parsing middleware
try {
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  console.log('✅ Body parsing middleware configured');
} catch (error) {
  console.error('❌ Error configuring body parsing:', error);
}

// Routes
let adminRoutes, authRoutes, patientRoutes, appointmentRoutes, appointmentHistoryRoutes;
let ledgerRoutes, auditRoutes, billingCodesRoutes, diagnosticCodesRoutes, carePackagesRoutes;
let checkoutRoutes, referralsRoutes, doctorRoutes, soapNotesRoutes;

try {
  adminRoutes = require('./routes/admin');
  authRoutes = require('./routes/auth');
  patientRoutes = require('./routes/patients');
  appointmentRoutes = require('./routes/appointments');
  appointmentHistoryRoutes = require('./routes/appointmentHistory');
  ledgerRoutes = require('./routes/ledger');
  auditRoutes = require('./routes/audit');
  billingCodesRoutes = require('./routes/billingCodes');
  diagnosticCodesRoutes = require('./routes/diagnosticCodes');
  carePackagesRoutes = require('./routes/carePackages');
  checkoutRoutes = require('./routes/checkout');
  referralsRoutes = require('./routes/referrals');
  doctorRoutes = require('./routes/doctor');
  soapNotesRoutes = require('./routes/soapNotes');
  console.log('✅ Route modules loaded');
} catch (error) {
  console.error('❌ Error loading route modules:', error);
  console.error('Error details:', error.message);
  process.exit(1);
}

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
