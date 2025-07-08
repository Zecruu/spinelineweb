// Environment check script
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('=== Environment Check ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('All VITE_ env vars:', Object.keys(process.env).filter(key => key.startsWith('VITE_')));
console.log('VITE_API_URL from process.env:', process.env.VITE_API_URL);
console.log('RAILWAY_PUBLIC_DOMAIN:', process.env.RAILWAY_PUBLIC_DOMAIN);

// Create .env.production if VITE_API_URL is set
if (process.env.VITE_API_URL) {
  const envContent = `VITE_API_URL=${process.env.VITE_API_URL}\n`;
  fs.writeFileSync(path.join(__dirname, '.env.production'), envContent);
  console.log('Created .env.production with:', envContent.trim());
}

try {
  const envFile = fs.readFileSync(path.join(__dirname, '.env.production'), 'utf8');
  console.log('.env.production contents:');
  console.log(envFile);
} catch (error) {
  console.log('Error reading .env.production:', error.message);
}
