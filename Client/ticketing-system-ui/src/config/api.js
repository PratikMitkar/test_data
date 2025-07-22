// API Configuration
// Update this base URL to match your server's public IP address
export const API_BASE_URL = 'http://192.168.137.154:5000';

// Create axios instance with base URL
import axios from 'axios';

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true
});

// Helper function to get full API URL
export const getApiUrl = (endpoint) => {
  return `${API_BASE_URL}${endpoint}`;
};

// Export for use in other files
export default api; 