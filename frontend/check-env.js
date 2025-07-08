// Environment check script
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('=== Environment Check ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('All VITE_ env vars:', Object.keys(process.env).filter(key => key.startsWith('VITE_')));
console.log('VITE_API_URL from process.env:', process.env.VITE_API_URL);
console.log('All process.env keys (first 20):', Object.keys(process.env).slice(0, 20));

try {
  const envFile = fs.readFileSync(path.join(__dirname, '.env.production'), 'utf8');
  console.log('.env.production contents:');
  console.log(envFile);
} catch (error) {
  console.log('Error reading .env.production:', error.message);
}
