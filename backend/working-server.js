console.log('🔄 Starting SpineLine Working Server...');

// Load environment variables
require('dotenv').config();

// Basic imports
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 5001;

// Basic middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`📡 ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MongoDB URI not found in environment variables');
    }
    
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    // Don't exit, continue without database for now
  }
};

// Load essential routes with error handling
const loadRoute = (path, name) => {
  try {
    return require(path);
  } catch (error) {
    console.warn(`⚠️ Failed to load ${name} route:`, error.message);
    return null;
  }
};

// Health check endpoint
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const dbStatusText = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  res.json({
    status: 'ok',
    message: 'SpineLine Working Server is running',
    timestamp: new Date().toISOString(),
    database: {
      status: dbStatusText[dbStatus] || 'unknown',
      connected: dbStatus === 1
    },
    environment: process.env.NODE_ENV || 'development'
  });
});

// Load and register routes
const authRoutes = loadRoute('./routes/auth', 'auth');
const adminRoutes = loadRoute('./routes/admin', 'admin');
const doctorRoutes = loadRoute('./routes/doctor', 'doctor');
const soapNotesRoutes = loadRoute('./routes/soapNotes', 'soapNotes');
const carePackagesRoutes = loadRoute('./routes/carePackages', 'carePackages');
const patientsRoutes = loadRoute('./routes/patients', 'patients');
const appointmentsRoutes = loadRoute('./routes/appointments', 'appointments');
const testUserRoutes = loadRoute('./create-test-user', 'test-user');

// Register routes
if (authRoutes) app.use('/api/auth', authRoutes);
if (adminRoutes) app.use('/api/admin', adminRoutes);
if (doctorRoutes) app.use('/api/doctor', doctorRoutes);
if (soapNotesRoutes) app.use('/api/soap-notes', soapNotesRoutes);
if (carePackagesRoutes) app.use('/api/care-packages', carePackagesRoutes);
if (patientsRoutes) app.use('/api/patients', patientsRoutes);
if (appointmentsRoutes) app.use('/api/appointments', appointmentsRoutes);
if (testUserRoutes) app.use('/api', testUserRoutes);

console.log('✅ Routes registered');

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: `API endpoint ${req.originalUrl} not found`
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('❌ Server error:', error);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Start server
const startServer = async () => {
  try {
    await connectDB();
    
    app.listen(PORT, () => {
      console.log(`✅ SpineLine Working Server running on port ${PORT}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🔗 Admin login: http://localhost:7890/admin`);
      console.log(`🔗 User login: http://localhost:7890`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start the server
startServer();
