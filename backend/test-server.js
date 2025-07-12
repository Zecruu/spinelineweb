// Minimal test server to debug Railway deployment issues
console.log('🔄 Starting minimal test server...');

try {
  const express = require('express');
  console.log('✅ Express loaded');
  
  const app = express();
  console.log('✅ Express app created');
  
  // Minimal health check
  app.get('/api/health', (req, res) => {
    console.log('🔍 Health check requested');
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });
  
  app.get('/', (req, res) => {
    console.log('🔍 Root requested');
    res.json({ message: 'Test server is running' });
  });
  
  const PORT = process.env.PORT || 5001;
  console.log(`🔌 Attempting to start server on port ${PORT}`);
  
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Test server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  });
  
  server.on('error', (error) => {
    console.error('❌ Server error:', error);
  });
  
  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received');
    server.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  });
  
} catch (error) {
  console.error('❌ Fatal error:', error);
  process.exit(1);
}
