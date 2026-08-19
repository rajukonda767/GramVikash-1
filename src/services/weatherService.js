// src/services/weatherService.js
import axios from 'axios';
import { MOCK_WEATHER_DATA } from './mockData';

export const weatherService = {
  async getWeather(latitude = 16.5062, longitude = 80.6480, locationName = 'Vijayawada, Andhra Pradesh') {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,wind_speed_10m&hourly=soil_temperature_0cm,soil_moisture_0_to_1cm&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FKolkata&forecast_days=4`;
      
      const response = await axios.get(url, { timeout: 4000 });
      const data = response.data;

      if (!data || !data.current) {
        return { ...MOCK_WEATHER_DATA, location: locationName };
      }

      const current = data.current;
      const daily = data.daily;

      const conditionMap = {
        0: { text: 'Clear Sky (నిర్మలమైన ఆకాశం)', textHi: 'साफ आसमान', code: 'clear' },
        1: { text: 'Mainly Clear (ప్రధానంగా నిర్మలం)', textHi: 'मुख्यतः साफ', code: 'clear' },
        2: { text: 'Partly Cloudy (పాక్షికంగా మేఘావృతం)', textHi: 'आंशिक बादल', code: 'partly_cloudy' },
        3: { text: 'Overcast (దట్టమైన మేఘాలు)', textHi: 'बादल छाए', code: 'cloudy' },
        51: { text: 'Light Drizzle (తేలికపాటి జల్లులు)', textHi: 'हल्की बूंदाबांदी', code: 'rain' },
        61: { text: 'Slight Rain (తేలికపాటి వర్షం)', textHi: 'हल्की बारिश', code: 'rain' },
        63: { text: 'Moderate Rain (మోస్తరు వర్షం)', textHi: 'मध्यम बारिश', code: 'rain' },
        65: { text: 'Heavy Rain (భారీ వర్షం)', textHi: 'भारी बारिश', code: 'heavy_rain' },
        80: { text: 'Rain Showers (వర్షపు జల్లులు)', textHi: 'वर्षा की बौछारें', code: 'rain' },
      };

      const weatherCondition = conditionMap[current.weather_code] || { text: 'Partly Cloudy', textHi: 'आंशिक बादल', code: 'partly_cloudy' };

      const forecast = (daily.time || []).map((dateStr, idx) => {
        const d = new Date(dateStr);
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayNamesTe = ['ఆదివారం', 'సోమవారం', 'మంగళవారం', 'బుధవారం', 'గురువారం', 'శుక్రవారం', 'శనివారం'];
        const dayNamesHi = ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];

        const dayName = idx === 0 ? 'Today' : idx === 1 ? 'Tomorrow' : dayNames[d.getDay()];
        const dayNameTe = idx === 0 ? 'ఈరోజు' : idx === 1 ? 'రేపు' : dayNamesTe[d.getDay()];
        const dayNameHi = idx === 0 ? 'आज' : idx === 1 ? 'कल' : dayNamesHi[d.getDay()];

        return {
          day: dayName,
          dayTe: dayNameTe,
          dayHi: dayNameHi,
          tempMax: Math.round(daily.temperature_2m_max[idx]),
          tempMin: Math.round(daily.temperature_2m_min[idx]),
          rainChance: daily.precipitation_probability_max[idx] || 10,
        };
      });

      return {
        location: locationName,
        temperature: Math.round(current.temperature_2m),
        feelsLike: Math.round(current.apparent_temperature),
        condition: weatherCondition.text,
        conditionHi: weatherCondition.textHi,
        conditionCode: weatherCondition.code,
        humidity: Math.round(current.relative_humidity_2m),
        windSpeedKm: Math.round(current.wind_speed_10m),
        rainProbabilityPercent: daily.precipitation_probability_max ? daily.precipitation_probability_max[0] : 15,
        rainfallForecastMm: current.rain || 0,
        uvIndex: 6,
        soilTemperature: Math.round(data.hourly?.soil_temperature_0cm?.[0] || 27),
        forecast: forecast.slice(0, 4),
      };
    } catch (error) {
      console.warn('Live weather fetch failed, using reliable fallback:', error);
      return { ...MOCK_WEATHER_DATA, location: locationName };
    }
  },

  async reverseGeocode(latitude, longitude) {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14&addressdetails=1`;
      const res = await axios.get(url, { headers: { 'User-Agent': 'GramVikas-App/1.0' }, timeout: 3000 });
      if (res.data && res.data.address) {
        const addr = res.data.address;
        const village = addr.village || addr.suburb || addr.town || addr.city_district || '';
        const city = addr.city || addr.county || addr.state_district || 'Vijayawada';
        const state = addr.state || 'Andhra Pradesh';
        return `${village ? village + ', ' : ''}${city}, ${state}`;
      }
    } catch (e) {
      console.warn('Geocoding fallback:', e);
    }
    return 'Vijayawada, Andhra Pradesh';
  }
};

export default weatherService;
