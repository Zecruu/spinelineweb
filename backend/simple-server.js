console.log('🔄 Starting Simple SpineLine server...');

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5001;

// Basic middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

// Connect to database
const connectDB = require('./config/database');
connectDB().catch(error => {
  console.log('⚠️ Database connection failed:', error.message);
});

// Load essential routes only
try {
  const authRoutes = require('./routes/auth');
  const adminRoutes = require('./routes/admin');
  const testUserRoutes = require('./create-test-user');
  
  app.use('/api/auth', authRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api', testUserRoutes);
  
  console.log('✅ Essential routes loaded');
} catch (error) {
  console.error('❌ Error loading routes:', error.message);
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Simple server is running',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Simple SpineLine server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔗 Create test data: POST http://localhost:${PORT}/api/create-test-account`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});
