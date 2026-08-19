// src/services/emergencyService.js
import apiClient from './api';

export const emergencyService = {
  /**
   * Triggers emergency SOS alert via FastAPI backend (dispatches SMS & logs coordinates).
   */
  async triggerSOS(payload) {
    try {
      const response = await apiClient.post('/emergency/sos', {
        emergency_type: payload.emergencyType || payload.emergency_type || 'fire',
        latitude: payload.latitude || 16.5062,
        longitude: payload.longitude || 80.6480,
        location_name: payload.locationName || payload.location_name || 'Vijayawada, Andhra Pradesh',
        farmer_name: payload.farmerName || payload.farmer_name || 'Raju',
        farmer_phone: payload.farmerPhone || payload.farmer_phone || '9390616956',
        language: payload.language || 'te',
      });
      return response.data;
    } catch (error) {
      console.error('Error triggering emergency SOS:', error);
      throw error;
    }
  },
};

export default emergencyService;
