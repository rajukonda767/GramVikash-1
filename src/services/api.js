// src/services/api.js
import axios from 'axios';

// Detect environment and configure production backend URL
const isLocalhost =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1');

export const API_BASE_URL =
  (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '') ||
  (isLocalhost
    ? 'http://localhost:8000/api'
    : 'https://gramvikash-backend-l0nf.onrender.com/api');

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 45000,
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
