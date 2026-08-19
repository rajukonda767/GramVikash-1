// src/services/marketService.js
import apiClient from './api';

export const marketService = {
  /**
   * Fetches real APMC Mandi commodity rates.
   */
  async getMandiPrices(state = 'Andhra Pradesh', district = 'NTR District') {
    try {
      const response = await apiClient.get('/market/prices', {
        params: { state, district },
      });
      return response.data.prices || [];
    } catch (error) {
      console.error('Error fetching market prices:', error);
      return [];
    }
  },

  /**
   * Calculates profit using backend business logic.
   */
  async calculateProfit(payload) {
    try {
      const response = await apiClient.post('/market/profit/calculate', {
        crop: payload.crop || 'Paddy',
        area_acres: parseFloat(payload.areaAcres || payload.area_acres || 3.5),
        yield_tonnes_per_acre: parseFloat(payload.yieldTonnesPerAcre || payload.yield_tonnes_per_acre || 3.4),
        market_price_per_quintal: parseFloat(payload.marketPricePerQuintal || payload.market_price_per_quintal || 2320.0),
        seed_cost: parseFloat(payload.seedCost || payload.seed_cost || 3500.0),
        fertilizer_cost: parseFloat(payload.fertilizerCost || payload.fertilizer_cost || 8000.0),
        pesticide_cost: parseFloat(payload.pesticideCost || payload.pesticide_cost || 4500.0),
        labor_cost: parseFloat(payload.laborCost || payload.labor_cost || 12000.0),
        irrigation_cost: parseFloat(payload.irrigationCost || payload.irrigation_cost || 3000.0),
        transport_cost: parseFloat(payload.transportCost || payload.transport_cost || 2500.0),
        language: payload.language || 'te',
      });
      return response.data;
    } catch (error) {
      console.error('Error calculating profit:', error);
      throw error;
    }
  },
};

export default marketService;
