// src/services/diseaseService.js
import apiClient from './api';

export const diseaseService = {
  /**
   * Sends uploaded leaf image to FastAPI Keras Plant Disease Detection pipeline.
   */
  async detectDisease(fileOrBlob, language = 'te') {
    const formData = new FormData();
    formData.append('file', fileOrBlob, fileOrBlob.name || 'leaf.jpg');
    formData.append('language', language);

    try {
      const response = await apiClient.post('/disease/predict', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = response.data;
      if (data.status === 'invalid_image') {
        return {
          status: 'invalid_image',
          isInvalid: true,
          message: data.message,
          messageTe: data.message_te,
          messageHi: data.message_hi,
          diseaseName: { en: 'Invalid Image', te: 'చెల్లని చిత్రం', hi: 'अमान्य चित्र' },
        };
      }

      return {
        status: data.status,
        diseaseKey: data.disease_key,
        crop: data.crop,
        nameEn: data.disease_name?.en || data.disease_name,
        nameTe: data.disease_name?.te || data.disease_name?.en,
        nameHi: data.disease_name?.hi || data.disease_name?.en,
        confidence: data.confidence,
        severity: data.severity,
        isHealthy: data.is_healthy,
        isLowConfidence: data.is_low_confidence,
        symptoms: data.symptoms || { en: 'Detected leaf pattern', te: 'గుర్తించబడిన ఆకు లక్షణాలు', hi: 'पत्ती के लक्षण' },
        treatments: data.treatments || [],
        spokenSummary: data.spoken_summary,
      };
    } catch (error) {
      console.error('Error calling disease prediction API:', error);
      throw error;
    }
  },

  // Alias for backward compatibility
  async predictDisease(fileOrBlob, language = 'te') {
    return this.detectDisease(fileOrBlob, language);
  },
};

export default diseaseService;
