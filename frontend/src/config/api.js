// API Configuration
console.log('Environment:', import.meta.env.MODE);
console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);

// Force local development URL when in development mode
let API_BASE_URL;
if (import.meta.env.MODE === 'development' || window.location.hostname === 'localhost') {
  API_BASE_URL = 'http://localhost:5001';
  console.log('🔧 Using local development API URL');
} else {
  API_BASE_URL = import.meta.env.VITE_API_URL || 'https://spinelineweb-production.up.railway.app';
  console.log('🌐 Using production API URL');
}

console.log('Final API_BASE_URL:', API_BASE_URL);

export { API_BASE_URL };
