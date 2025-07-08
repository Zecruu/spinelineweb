// API Configuration
console.log('Environment:', import.meta.env.MODE);
console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);

// Use environment variable or fallback to production URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://spinelineweb-production.up.railway.app';

console.log('Final API_BASE_URL:', API_BASE_URL);

export { API_BASE_URL };
