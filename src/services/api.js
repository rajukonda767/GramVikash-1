// src/services/api.js
import axios from 'axios';

// Detect whether running in localhost browser
export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:8000/api'
    : 'http://127.0.0.1:8000/api');

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Interceptor to attach Supabase JWT token if available
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('supabase_token');
  if (token && token !== 'undefined' && token !== 'null') {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
