// Central API base URL config.
// In development: uses http://localhost:5000
// In production (Render): set VITE_API_URL in Render's Environment Variables
//   e.g.  VITE_API_URL = https://your-backend.onrender.com

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default API_BASE;
