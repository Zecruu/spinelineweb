// API Configuration
console.log('Environment:', import.meta.env.MODE);
console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);

// Smart API URL detection for both local development and production
let API_BASE_URL;

if (import.meta.env.MODE === 'development' || window.location.hostname === 'localhost') {
  // Local development
  API_BASE_URL = 'http://localhost:5001';
  console.log('🔧 Using local development API URL');
} else {
  // Production - use same domain as frontend
  API_BASE_URL = window.location.origin;
  console.log('🌐 Using production API URL (same domain)');
}

console.log('Final API_BASE_URL:', API_BASE_URL);

export { API_BASE_URL };
