// Minimal server for testing Railway deployment health checks
console.log('🔄 Starting minimal test server...');

const express = require('express');
const app = express();

// Minimal health check endpoint
app.get('/api/health', (req, res) => {
  console.log('📊 Health check requested');
  res.status(200).json({
    status: 'success',
    message: 'Minimal server is running',
    timestamp: new Date().toISOString(),
    process: {
      pid: process.pid,
      uptime: process.uptime(),
      memory: process.memoryUsage()
    }
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Minimal SpineLine server is running' });
});

const PORT = process.env.PORT || 5001;

console.log(`🚀 Starting server on port ${PORT}...`);

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Minimal server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
}).on('error', (err) => {
  console.error('❌ Server startup error:', err);
  process.exit(1);
});

// Keep process alive
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

console.log('✅ Minimal server setup complete');
