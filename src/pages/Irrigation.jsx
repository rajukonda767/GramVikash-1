// src/pages/Irrigation.jsx
// Smart Irrigation Planning with soil moisture tracking & audio advice

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Droplets,
  CheckCircle2,
  Volume2,
  VolumeX,
  Loader2,
} from 'lucide-react';

import { useFarmer } from '../context/FarmerContext';
import { useVoice } from '../context/VoiceContext';
import AIExplanationCard from '../components/common/AIExplanationCard';
import irrigationService from '../services/irrigationService';

export default function Irrigation() {
  const { t, i18n } = useTranslation();
  const { profile, weather, updateProfile } = useFarmer();
  const { speakText, stopSpeaking, isSpeaking } = useVoice();
  const currentLang = i18n.language || 'en';

  const [formData, setFormData] = useState({
    crop: profile?.activeCrop?.cropName || 'Paddy (వరి)',
    growthStage: profile?.activeCrop?.growthStage || 'Vegetative Stage',
    soilMoisture: profile?.activeCrop?.soilMoisture || 55,
    temperature: weather?.temperature || 32,
    humidity: weather?.humidity || 68,
    irrigationType: profile?.farm?.irrigationType || 'Drip & Borewell',
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCalculate = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const plan = await irrigationService.calculateIrrigationPlan({
        crop: formData.crop,
        growthStage: formData.growthStage,
        soilMoisture: parseFloat(formData.soilMoisture) || 45,
        temperature: parseFloat(formData.temperature) || 32,
        humidity: parseFloat(formData.humidity) || 68,
        irrigationType: formData.irrigationType,
        language: currentLang,
      });

      setResult(plan);

      // Save to global farmer context so Dashboard reflects it dynamically
      updateProfile({
        irrigationPlan: {
          soilMoisture: parseFloat(formData.soilMoisture) || 55,
          growthStage: formData.growthStage,
          crop: formData.crop,
          waterAmountLiters: plan.waterAmountLiters || 20,
          wateringWindow: plan.wateringWindow || 'Tomorrow 6 AM - 8 AM',
          wateringWindowTe: plan.wateringWindowTe || 'రేపు ఉదయం 6:00 నుండి 8:00 వరకు',
          urgency: plan.urgency || 'moderate',
          recommendation: typeof plan.spokenAdvice === 'object' ? plan.spokenAdvice[currentLang] || plan.spokenAdvice.en : String(plan.spokenAdvice || ''),
          calculatedAt: new Date().toISOString(),
        }
      });

      if (plan?.spokenAdvice) {
        speakText(plan.spokenAdvice);
      }
    } catch (err) {
      console.error('Irrigation error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fadeIn pb-12">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-green-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-md">
              <Droplets className="w-6 h-6" />
            </div>
            {t('irrigation.title')}
          </h1>
          <p className="text-sm text-gray-600 mt-1 font-medium">{t('irrigation.subtitle')}</p>
        </div>
      </div>

      {/* Form Card */}
      <form onSubmit={handleCalculate} className="bg-white rounded-3xl p-6 sm:p-8 border border-green-100 shadow-xs space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">{t('irrigation.crop')}</label>
            <input
              type="text"
              name="crop"
              value={formData.crop}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-2xl font-bold text-sm focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">{t('irrigation.growthStage')}</label>
            <select
              name="growthStage"
              value={formData.growthStage}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-2xl font-bold text-sm focus:ring-2 focus:ring-green-500 outline-none"
            >
              <option value="Seedling Stage">Seedling (నారు దశ)</option>
              <option value="Vegetative Stage">Vegetative (దుబ్బు దశ)</option>
              <option value="Flowering Stage">Flowering (పూత దశ)</option>
              <option value="Maturity Stage">Maturity (పాలుపోసుకునే దశ)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">{t('irrigation.soilMoisture')}</label>
            <input
              type="number"
              name="soilMoisture"
              value={formData.soilMoisture}
              onChange={handleChange}
              placeholder="e.g. 45"
              required
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-2xl font-black text-base focus:ring-2 focus:ring-green-500 outline-none text-blue-700"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">{t('irrigation.temperature')}</label>
            <input
              type="number"
              name="temperature"
              value={formData.temperature}
              onChange={handleChange}
              placeholder="e.g. 32"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-2xl font-bold text-sm focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2 text-base active:scale-98 cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>{t('irrigation.calculating')}</span>
            </>
          ) : (
            <>
              <Droplets className="w-5 h-5" />
              <span>{t('irrigation.check')}</span>
            </>
          )}
        </button>
      </form>

      {/* Results */}
      {result && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-green-100 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
              <div>
                <span className={`text-xs font-black px-3.5 py-1 rounded-full ${
                  result.urgency === 'critical'
                    ? 'bg-red-100 text-red-700 animate-pulse'
                    : result.urgency === 'high'
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {result.urgency === 'critical' ? t('irrigation.statusCritical') : result.urgency === 'high' ? t('irrigation.statusRequired') : t('irrigation.statusAdequate')}
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-gray-900 mt-2">
                  {typeof result.timing === 'object' ? result.timing[currentLang] || result.timing['en'] : result.timing}
                </h3>
              </div>

              {/* Speak Audio */}
              <button
                type="button"
                onClick={() => (isSpeaking ? stopSpeaking() : speakText(result.spokenAdvice))}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all shadow-xs ${
                  isSpeaking ? 'bg-red-500 text-white animate-pulse' : 'bg-blue-600 text-white hover:bg-blue-500'
                }`}
              >
                {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                <span>{isSpeaking ? t('app.stopSpeaking') : t('app.speakAloud')}</span>
              </button>
            </div>

            {/* Visual Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                <span className="text-xs font-bold text-blue-700 uppercase">{t('irrigation.dosage')}</span>
                <p className="text-2xl font-black text-blue-900 mt-1">{result.waterAmountLitersPerSqm} L / m²</p>
                <p className="text-xs text-blue-600 mt-0.5">Approx. {result.waterAmountLitersPerSqm * 40} Liters / Guntha</p>
              </div>

              <div className="bg-cyan-50 p-4 rounded-2xl border border-cyan-100">
                <span className="text-xs font-bold text-cyan-700 uppercase">{t('irrigation.bestTime')}</span>
                <p className="text-xl font-black text-cyan-900 mt-1">
                  {typeof result.timing === 'object' ? result.timing[currentLang] || result.timing['en'] : result.timing}
                </p>
                <p className="text-xs text-cyan-600 mt-0.5">Minimizes evaporation loss</p>
              </div>
            </div>

            {/* Reasons List */}
            {result.reasons && result.reasons.length > 0 && (
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-gray-500 uppercase">{t('irrigation.reasons')}</h4>
                {result.reasons.map((r, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs font-semibold text-gray-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>{typeof r === 'object' ? r[currentLang] || r['en'] : r}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <AIExplanationCard
            what={`Recommended watering: ${result.waterAmountLitersPerSqm} L/m²`}
            why={result.reasons && result.reasons[0]}
            action={result.timing}
            spokenText={result.spokenAdvice}
          />
        </div>
      )}
    </div>
  );
}
