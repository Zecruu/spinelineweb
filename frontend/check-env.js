// Environment check script
console.log('=== Environment Check ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('All env vars:', Object.keys(process.env).filter(key => key.startsWith('VITE_')));

// Read the .env.production file
const fs = require('fs');
const path = require('path');

try {
  const envFile = fs.readFileSync(path.join(__dirname, '.env.production'), 'utf8');
  console.log('.env.production contents:');
  console.log(envFile);
} catch (error) {
  console.log('Error reading .env.production:', error.message);
}
