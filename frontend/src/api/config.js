// Central configuration for API calls
const isLocalhost = window.location.hostname === 'localhost';
const productionBackendUrl = 'https://rankup-v46a.onrender.com';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (isLocalhost ? 'http://localhost:5000' : productionBackendUrl);

// Debug check for deployment
if (!isLocalhost && API_BASE_URL.includes('localhost')) {
  console.error('⚠️ DEPLOYMENT WARNING: Frontend is running in production but trying to talk to localhost! Make sure VITE_API_BASE_URL is set in your Vercel Dashboard.');
} else {
  console.log('--- Frontend: API Connection set to:', API_BASE_URL);
}

// API endpoints to avoid string repetition throughout the app
export const ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    REGISTER: `${API_BASE_URL}/api/auth/register`,
    GOOGLE: `${API_BASE_URL}/api/auth/google`,
    GITHUB: `${API_BASE_URL}/api/auth/github`,
  },
  STUDENT: {
    ROADMAPS: `${API_BASE_URL}/api/student/roadmaps`,
    TESTS: `${API_BASE_URL}/api/student/tests`,
    SUBMIT_TEST: `${API_BASE_URL}/api/student/submit-test`,
  },
  ADMIN: {
    STATS: `${API_BASE_URL}/api/admin/stats`,
    ROADMAPS: `${API_BASE_URL}/api/admin/roadmaps`,
  }
};

export default API_BASE_URL;
