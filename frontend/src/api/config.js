// Central configuration for API calls
// Use the VITE_API_BASE_URL environment variable if set, otherwise fallback to localhost for development
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
console.log('--- Frontend: API Base URL set to:', API_BASE_URL);

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
