import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// API functions for each module
export const cropAPI = {
  recommend: (data) => api.post('/api/crop/recommend', data),
}

export const diseaseAPI = {
  predict: (formData) => api.post('/api/disease/predict', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
}

export const yieldAPI = {
  predict: (data) => api.post('/api/yield/predict', data),
}

export const irrigationAPI = {
  predict: (data) => api.post('/api/irrigation/predict', data),
}

export const profitAPI = {
  calculate: (data) => api.post('/api/profit/calculate', data),
}

export const marketAPI = {
  getPrices: (commodity, state) => api.get('/api/market/prices', { params: { commodity, state } }),
}

export const emergencyAPI = {
  sendSOS: (data) => api.post('/api/emergency/sos', data),
}

export const chatAPI = {
  send: (data) => api.post('/api/chat', data),
}

export default api
