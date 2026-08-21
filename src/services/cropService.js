// src/services/cropService.js
import apiClient from './api';

/**
 * Real Soil Report Parser via Backend AI OCR Endpoint:
 * Uploads document (PDF, JPG, PNG, WEBP) or live camera snapshot to backend.
 * Extracts Nitrogen, Phosphorus, Potassium, and pH values.
 */
async function parseSoilReportDocument(file, lang = 'te') {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('language', lang);

    const response = await apiClient.post('/crop/extract-soil-report', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000,
    });

    const data = response.data;
    return {
      success: Boolean(data.success),
      extractedData: data.extracted_data || {
        nitrogen: data.nitrogen,
        phosphorus: data.phosphorus,
        potassium: data.potassium,
        ph: data.ph,
      },
      missingFields: data.missing_fields || [],
      missingFieldsTe: data.missing_fields_te || [],
      confidenceScore: data.confidence_score || 95,
      labName: data.lab_name,
      farmerName: data.farmer_name,
      message: lang === 'te' ? (data.message_te || data.message) : (data.message_en || data.message),
      voiceNote: data.voice_note,
      error: data.error,
    };
  } catch (error) {
    console.error('Error calling extract-soil-report API:', error);
    const errDetail = error.response?.data?.detail || error.message;
    return {
      success: false,
      error: 'api_error',
      message: lang === 'te'
        ? 'నివేదిక విశ్లేషణ విఫలమైంది. దయచేసి స్పష్టమైన PDF లేదా ఫోటోను అప్‌లోడ్ చేయండి.'
        : `Soil report extraction failed: ${errDetail}. Please ensure the image/PDF is clear.`,
    };
  }
}

export const cropService = {
  /**
   * Calls the FastAPI ML Crop Recommendation endpoint.
   * Temperature, humidity, and rainfall come from live weather (backend auto-fetches).
   */
  async recommendCrops(payload) {
    try {
      const response = await apiClient.post('/crop/recommend', {
        nitrogen: payload.nitrogen !== undefined && payload.nitrogen !== '' ? parseFloat(payload.nitrogen) : null,
        phosphorus: payload.phosphorus !== undefined && payload.phosphorus !== '' ? parseFloat(payload.phosphorus) : null,
        potassium: payload.potassium !== undefined && payload.potassium !== '' ? parseFloat(payload.potassium) : null,
        ph: payload.ph !== undefined && payload.ph !== '' ? parseFloat(payload.ph) : null,
        // Do NOT send temperature/humidity/rainfall — backend fetches from live weather API
        temperature: null,
        humidity: null,
        rainfall: null,
        latitude: payload.latitude || 16.5062,
        longitude: payload.longitude || 80.6480,
        location_name: payload.location_name || 'Vijayawada, Andhra Pradesh',
        farmer_questions: payload.farmer_questions || null,
        language: payload.language || 'te',
      });

      const data = response.data;

      const normalizedRecommendations = (data.recommendations || []).map((c) => ({
        rank: c.rank,
        cropKey: c.crop_key,
        nameEn: c.name_en || c.nameEn || c.crop_key,
        nameTe: c.name_te || c.nameTe || c.name_en,
        nameHi: c.name_hi || c.nameHi || c.name_en,
        suitability: c.suitability_percent || c.suitability || c.confidence || 85,
        expectedYield: c.expected_yield_tonnes_per_acre || c.expectedYield || 3.2,
        growingDays: c.growing_days || c.growingDays || 120,
        netProfit: c.estimated_profit_per_acre || c.netProfit || 52000,
        marketPrice: c.market_price_per_quintal || c.marketPrice || 2320,
        reasons: {
          en: `Soil nutrients (N:${data.soil_inputs?.nitrogen || '-'}, P:${data.soil_inputs?.phosphorus || '-'}, K:${data.soil_inputs?.potassium || '-'}) and current climate are optimal for ${c.name_en || c.crop_key}.`,
          te: `మీ నేల పోషకాలు (N:${data.soil_inputs?.nitrogen || '-'}, P:${data.soil_inputs?.phosphorus || '-'}, K:${data.soil_inputs?.potassium || '-'}) మరియు వాతావరణం ${c.name_te || c.crop_key} పంటకు అనుకూలంగా ఉన్నాయి.`,
          hi: `मिट्टी के पोषक तत्व और जलवायु ${c.name_hi || c.crop_key} के लिए अनुकूल हैं।`,
        },
        action: {
          en: `Prepare seedbed, apply 45 kg/acre basal fertilizer and plant ${c.name_en || c.crop_key} within 7 days.`,
          te: `నారుమడి సిద్ధం చేసి 45 కిలోల బేసల్ ఎరువు వేసి 7 రోజుల్లో ${c.name_te || c.crop_key} నాటండి.`,
          hi: `बीज बेड तैयार करें, 45 किग्रा/एकड़ बेसल खाद लगाएं और 7 दिनों में ${c.name_hi || c.crop_key} बोएं।`,
        },
        spokenDescription: {
          en: `Rank ${c.rank}: ${c.name_en}. Suitability ${c.suitability_percent}%. Expected yield: ${c.expected_yield_tonnes_per_acre} tonnes per acre. Estimated profit: Rupees ${(c.estimated_profit_per_acre || 0).toLocaleString('en-IN')} per acre. Growing period: ${c.growing_days} days.`,
          te: `${c.rank === 1 ? 'మొదటి' : c.rank === 2 ? 'రెండవ' : 'మూడవ'} స్థానం ${c.name_te}. అనుకూలత ${c.suitability_percent} శాతం. ఆశించిన దిగుబడి ఎకరానికి ${c.expected_yield_tonnes_per_acre} టన్నులు. అంచనా లాభం ఎకరానికి ${(c.estimated_profit_per_acre || 0).toLocaleString('en-IN')} రూపాయలు. సాగు కాలం ${c.growing_days} రోజులు.`,
          hi: `रैंक ${c.rank}: ${c.name_hi}। उपयुक्तता ${c.suitability_percent} प्रतिशत। प्रति एकड़ अनुमानित उपज: ${c.expected_yield_tonnes_per_acre} टन। अनुमानित लाभ: ${(c.estimated_profit_per_acre || 0).toLocaleString('en-IN')} रुपये।`,
        },
      }));

      return {
        status: data.status,
        recommendations: normalizedRecommendations,
        explanation: data.explanation,
        spokenSummary: data.spoken_summary || data.spokenSummary,
        weatherContext: data.weather_context,
        soilInputs: data.soil_inputs,
        source: data.source,
      };
    } catch (error) {
      console.error('Error calling crop recommendation API:', error);
      throw error;
    }
  },

  /**
   * Fetch last saved recommendation for this user from Supabase (via backend).
   */
  async getLastRecommendation() {
    try {
      const res = await apiClient.get('/crop/last-recommendation');
      return res.data;
    } catch {
      return null;
    }
  },

  /**
   * Real Soil Health Card document parser with backend AI OCR endpoint.
   */
  async parseSoilReport(file, lang = 'te') {
    return parseSoilReportDocument(file, lang);
  },
};

export default cropService;
