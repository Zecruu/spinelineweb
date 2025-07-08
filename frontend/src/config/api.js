// API Configuration
console.log('Environment:', import.meta.env.MODE);
console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);

// Hardcode production URL for Railway deployment testing
const API_BASE_URL = 'https://spinelineweb-production.up.railway.app';

console.log('Final API_BASE_URL:', API_BASE_URL);

export { API_BASE_URL };
