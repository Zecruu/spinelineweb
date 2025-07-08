// API Configuration
console.log('Environment:', import.meta.env.MODE);
console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);

// Force production URL for Railway deployment
const API_BASE_URL = import.meta.env.MODE === 'production'
  ? 'https://spinelineweb-production.up.railway.app'
  : (import.meta.env.VITE_API_URL || 'http://localhost:5001');

console.log('Final API_BASE_URL:', API_BASE_URL);

export { API_BASE_URL };
