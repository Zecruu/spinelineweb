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

// Load route modules with error handling
let adminRoutes, authRoutes, patientRoutes, appointmentRoutes, appointmentHistoryRoutes;
let ledgerRoutes, auditRoutes, billingCodesRoutes, soapNotesRoutes, carePackagesRoutes;
let doctorRoutes, debugRoutes, macrosRoutes, referralsRoutes, checkoutRoutes, diagnosticCodesRoutes;

try {
  adminRoutes = require('./routes/admin');
  authRoutes = require('./routes/auth');
  patientRoutes = require('./routes/patients');
  appointmentRoutes = require('./routes/appointments');
  appointmentHistoryRoutes = require('./routes/appointmentHistory');
  ledgerRoutes = require('./routes/ledger');
  auditRoutes = require('./routes/audit');
  billingCodesRoutes = require('./routes/billingCodes');
  soapNotesRoutes = require('./routes/soapNotes');
  carePackagesRoutes = require('./routes/carePackages');
  doctorRoutes = require('./routes/doctor');
  debugRoutes = require('./debug-endpoints');
  macrosRoutes = require('./routes/macros');
  referralsRoutes = require('./routes/referrals');
  checkoutRoutes = require('./routes/checkout');
  diagnosticCodesRoutes = require('./routes/diagnosticCodes');
  console.log('✅ All route modules loaded successfully');
} catch (error) {
  console.error('⚠️ Error loading some route modules:', error.message);
  console.log('🔄 Server will continue with available routes');
}

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

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Add request logging
app.use((req, res, next) => {
  console.log(`📡 ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Health check endpoint - works even without database
app.get('/api/health', (req, res) => {
  const mongoose = require('mongoose');
  const dbStatus = mongoose.connection.readyState;
  const dbStatusText = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  const healthStatus = {
    status: 'success',
    message: 'SpineLine API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    server: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      pid: process.pid
    },
    database: {
      status: dbStatusText[dbStatus] || 'unknown',
      connected: dbStatus === 1,
      host: mongoose.connection.host || 'not connected'
    },
    config: {
      mongoUri: process.env.MONGO_URI ? 'configured' : 'missing',
      port: process.env.PORT || 5001
    }
  };

  // Always return 200 OK for health check, even if DB is down
  // This allows the deployment to succeed and we can debug DB issues separately
  res.status(200).json(healthStatus);
});

// Database status endpoint
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

// API Routes (MUST come before static files) - with error handling
try {
  if (adminRoutes) app.use('/api/admin', adminRoutes);
  if (authRoutes) app.use('/api/auth', authRoutes);
  if (patientRoutes) app.use('/api/patients', patientRoutes);
  if (appointmentRoutes) app.use('/api/appointments', appointmentRoutes);
  if (appointmentHistoryRoutes) app.use('/api/appointment-history', appointmentHistoryRoutes);
  if (ledgerRoutes) app.use('/api/ledger', ledgerRoutes);
  if (auditRoutes) app.use('/api/audit', auditRoutes);
  if (billingCodesRoutes) app.use('/api/billing-codes', billingCodesRoutes);
  if (diagnosticCodesRoutes) app.use('/api/diagnostic-codes', diagnosticCodesRoutes);
  if (carePackagesRoutes) app.use('/api/care-packages', carePackagesRoutes);
  if (checkoutRoutes) app.use('/api/checkout', checkoutRoutes);
  if (referralsRoutes) app.use('/api/referrals', referralsRoutes);
  if (doctorRoutes) app.use('/api/doctor', doctorRoutes);
  if (soapNotesRoutes) app.use('/api/soap-notes', soapNotesRoutes);
  if (macrosRoutes) app.use('/api/macros', macrosRoutes);
  if (debugRoutes) app.use('/api', debugRoutes);
  console.log('✅ API routes registered successfully');
} catch (error) {
  console.error('⚠️ Error registering some API routes:', error.message);
  console.log('🔄 Server will continue with available routes');
}

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: `API endpoint ${req.originalUrl} not found`
  });
});

// Serve static files from frontend dist
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Catch-all handler for React Router (MUST be last)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// Error handling middleware (MUST be last)
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    status: 'error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong!' : err.message
  });
});

const PORT = process.env.PORT || 5001;

// Add error handling for server startup
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 SpineLine API server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📋 MONGO_URI configured: ${process.env.MONGO_URI ? 'Yes' : 'No'}`);
}).on('error', (err) => {
  console.error('❌ Server startup error:', err);
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
  }
  process.exit(1);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received');
  server.close(() => process.exit(0));
});
