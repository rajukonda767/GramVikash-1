// src/services/irrigationService.js
import apiClient from './api';

export const irrigationService = {
  /**
   * Calls the FastAPI smart irrigation calculation engine.
   */
  async calculatePlan(payload) {
    try {
      const response = await apiClient.post('/irrigation/predict', {
        crop: payload.crop || 'Paddy',
        growth_stage: payload.growthStage || payload.growth_stage || 'Vegetative Stage',
        soil_moisture: parseFloat(payload.soilMoisture || payload.soil_moisture || 45.0),
        temperature: payload.temperature ? parseFloat(payload.temperature) : null,
        humidity: payload.humidity ? parseFloat(payload.humidity) : null,
        latitude: payload.latitude || 16.5062,
        longitude: payload.longitude || 80.6480,
        language: payload.language || 'te',
      });

      const data = response.data;

      return {
        status: data.status,
        crop: data.crop,
        soilMoisturePercent: data.soil_moisture_percent,
        urgency: data.urgency,
        recommendedDate: data.recommended_date,
        timing: data.timing,
        waterAmountLitersPerSqm: data.water_amount_liters_sqm || 20,
        reasons: (data.reasons || []).map((r) => ({
          en: r.en || r,
          te: r.te || r.en || r,
          hi: r.hi || r.en || r,
        })),
        spokenAdvice: data.spoken_advice,
      };
    } catch (error) {
      console.error('Error calling irrigation API:', error);
      throw error;
    }
  },

  // Alias for backward compatibility
  async calculateIrrigationPlan(payload) {
    return this.calculatePlan(payload);
  },

  /**
   * Logs a confirmed irrigation event to the database.
   */
  async logIrrigation(payload) {
    try {
      const response = await apiClient.post('/irrigation/log', payload);
      return response.data;
    } catch (error) {
      console.error('Error logging irrigation:', error);
      throw error;
    }
  },
};

export default irrigationService;
