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

// Load route modules
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
const macrosRoutes = require('./routes/macros');
const debugRoutes = require('./debug-endpoints');

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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'SpineLine API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
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

// API Routes (MUST come before static files)
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
app.use('/api/macros', macrosRoutes);
app.use('/api', debugRoutes);

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
