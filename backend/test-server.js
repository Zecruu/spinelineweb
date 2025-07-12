// Ultra minimal test server for Railway debugging
console.log('🔄 Starting ultra minimal test server...');
console.log('Environment variables:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- PORT:', process.env.PORT);
console.log('- PWD:', process.env.PWD);

const express = require('express');
const app = express();

// Health check endpoint
app.get('/api/health', (req, res) => {
  console.log('🔍 Health check requested at', new Date().toISOString());
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    port: process.env.PORT,
    env: process.env.NODE_ENV
  });
});

// Root endpoint (also serves as health check)
app.get('/', (req, res) => {
  console.log('🔍 Root/Health check requested at', new Date().toISOString());
  res.status(200).json({
    status: 'ok',
    message: 'Ultra minimal test server is running',
    timestamp: new Date().toISOString(),
    health: 'healthy'
  });
});

// Catch all other routes
app.get('*', (req, res) => {
  console.log('🔍 Unknown route requested:', req.path);
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 5001;
console.log(`🔌 Starting server on port ${PORT}`);
console.log(`🔌 Railway PORT env var: ${process.env.PORT}`);

const server = app.listen(PORT, () => {
  const address = server.address();
  console.log(`🚀 Server is running on port ${address.port}`);
  console.log(`📊 Health check URL: http://localhost:${address.port}/api/health`);
  console.log(`🌐 Server ready to accept connections`);
  console.log(`🔍 Server address:`, address);
});

server.on('listening', () => {
  console.log('✅ Server is listening');
});

server.on('error', (error) => {
  console.error('❌ Server error:', error);
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// Keep process alive
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled rejection at:', promise, 'reason:', reason);
});

console.log('🔄 Server setup complete, waiting for connections...');
