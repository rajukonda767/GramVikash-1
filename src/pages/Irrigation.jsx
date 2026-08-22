// src/pages/Irrigation.jsx
// Smart Real-time Irrigation Schedule with 2-3 min Live Weather Auto-Sync & Spoken Advice

import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Droplets,
  CheckCircle2,
  Volume2,
  VolumeX,
  Loader2,
  RefreshCw,
  Clock,
  Thermometer,
  CloudRain,
  Wind,
  AlertTriangle,
  Sparkles,
  Zap,
} from 'lucide-react';

import { useFarmer } from '../context/FarmerContext';
import { useVoice } from '../context/VoiceContext';
import AIExplanationCard from '../components/common/AIExplanationCard';
import irrigationService from '../services/irrigationService';

const AUTO_SYNC_INTERVAL_SECONDS = 150; // 2.5 minutes

export default function Irrigation() {
  const { t, i18n } = useTranslation();
  const {
    profile,
    weather,
    syncCountdown,
    lastSyncedTime,
    triggerGlobalSync,
    updateProfile,
  } = useFarmer();
  const { speakText, stopSpeaking, isSpeaking } = useVoice();
  const lang = i18n.language || 'en';

  const [formData, setFormData] = useState({
    crop: profile?.activeCrop?.cropName || 'Paddy (వరి)',
    growthStage: profile?.activeCrop?.growthStage || 'Vegetative Stage',
    soilMoisture: profile?.activeCrop?.soilMoisture || 55,
    temperature: weather?.temperature || 29,
    humidity: weather?.humidity || 68,
    irrigationType: profile?.farm?.irrigationType || 'Drip & Borewell',
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  // Sync formData with latest live weather from context
  useEffect(() => {
    if (weather?.temperature) {
      setFormData((prev) => ({
        ...prev,
        temperature: weather.temperature,
        humidity: weather.humidity || prev.humidity,
      }));
    }
  }, [weather]);

  // Initial Calculation on Page Mount
  useEffect(() => {
    calculatePlan(false);
  }, [formData.crop, formData.growthStage]);

  const calculatePlan = async (isAuto = false) => {
    setLoading(true);
    try {
      const plan = await irrigationService.calculateIrrigationPlan({
        crop: formData.crop,
        growthStage: formData.growthStage,
        soilMoisture: parseFloat(formData.soilMoisture) || 45,
        temperature: parseFloat(formData.temperature) || weather?.temperature || 29,
        humidity: parseFloat(formData.humidity) || weather?.humidity || 68,
        irrigationType: formData.irrigationType,
        language: lang,
      });

      setResult(plan);
      setLastSyncedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

      // Save to global farmer context
      if (updateProfile) {
        updateProfile({
          irrigationPlan: {
            soilMoisture: parseFloat(formData.soilMoisture) || 55,
            growthStage: formData.growthStage,
            crop: formData.crop,
            waterAmountLiters: plan.waterAmountLiters || 20,
            wateringWindow: plan.wateringWindow || 'Tomorrow 6 AM - 8 AM',
            wateringWindowTe: plan.wateringWindowTe || 'రేపు ఉదయం 6:00 నుండి 8:00 వరకు',
            urgency: plan.urgency || 'moderate',
            recommendation: typeof plan.spokenAdvice === 'object' ? plan.spokenAdvice[lang] || plan.spokenAdvice.en : String(plan.spokenAdvice || ''),
            calculatedAt: new Date().toISOString(),
          }
        });
      }

      if (!isAuto && plan?.spokenAdvice) {
        speakText(plan.spokenAdvice);
      }
    } catch (err) {
      console.error('Irrigation plan calculation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleManualSync = async () => {
    if (triggerGlobalSync) {
      await triggerGlobalSync();
    }
    calculatePlan(false);
  };

  const formatSeconds = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `0${m}:${s < 10 ? `0${s}` : s}`;
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

        {/* Live Weather Auto-Sync Timer Badge */}
        <div className="flex items-center gap-2.5 bg-blue-50 border border-blue-200 px-4 py-2.5 rounded-2xl shadow-xs">
          <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping flex-shrink-0" />
          <div className="text-left">
            <p className="text-[10px] font-black text-blue-900 uppercase tracking-wider flex items-center gap-1">
              <Clock className="w-3 h-3 text-blue-700" />
              {lang === 'te' ? 'లైవ్ వెదర్ ఆటో-సింక్' : 'Weather Auto-Sync'}
            </p>
            <p className="text-xs font-mono font-black text-blue-800">
              {formatSeconds(syncCountdown)}
            </p>
          </div>
          <button
            type="button"
            onClick={handleManualSync}
            disabled={loading}
            className="ml-2 p-1.5 bg-white hover:bg-blue-100 text-blue-700 rounded-xl border border-blue-200 shadow-2xs transition-colors cursor-pointer"
            title="Refresh Live Weather Now"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Live Weather Bar */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-800 rounded-3xl p-5 text-white flex flex-wrap items-center justify-between gap-4 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
            <Thermometer className="w-5 h-5 text-yellow-300" />
          </div>
          <div>
            <p className="text-[11px] text-blue-200 font-bold uppercase">
              {lang === 'te' ? 'ప్రస్తుత వాతావరణం (Live Weather API)' : 'Current Weather (Live GPS)'}
            </p>
            <p className="text-lg font-black">{profile?.location?.addressString || 'Vijayawada, Andhra Pradesh'}</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div>
            <span className="text-[10px] text-blue-200 uppercase font-bold">Temperature</span>
            <p className="text-xl font-black">{formData.temperature}°C</p>
          </div>
          <div>
            <span className="text-[10px] text-blue-200 uppercase font-bold">Humidity</span>
            <p className="text-xl font-black">{formData.humidity}%</p>
          </div>
          {lastSyncedTime && (
            <div className="text-right">
              <span className="text-[10px] text-blue-200 uppercase font-bold">Synced At</span>
              <p className="text-xs font-mono font-bold text-yellow-300">{lastSyncedTime}</p>
            </div>
          )}
        </div>
      </div>

      {/* Form Card */}
      <form onSubmit={(e) => { e.preventDefault(); calculatePlan(false); }} className="bg-white rounded-3xl p-6 sm:p-8 border border-green-100 shadow-xs space-y-6">
        <div>
          <h2 className="text-base font-bold text-gray-900 mb-0.5">{t('irrigation.farmDetails')}</h2>
          <p className="text-xs text-gray-500">
            {lang === 'te' ? 'పంట దశ మరియు నేల తేమను బట్టి ఖచ్చితమైన నీటి పరిమాణం లెక్కించబడుతుంది' : 'Real-time irrigation requirement computed from crop evapotranspiration (ETc) and soil moisture'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Crop Dropdown */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">{t('irrigation.crop')}</label>
            <select
              name="crop"
              value={formData.crop}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-2xl font-bold text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-hidden"
            >
              <option value="Paddy (వరి)">Paddy / వరి ధాన్యం</option>
              <option value="Cotton (పత్తి)">Cotton / పత్తి</option>
              <option value="Maize (మొక్కజొన్న)">Maize / మొక్కజొన్న</option>
              <option value="Tomato (టమాటో)">Tomato / టమాటో</option>
              <option value="Chilli (ఎర్ర మిరప)">Chilli / మిరప</option>
              <option value="Banana (అరటి)">Banana / అరటి</option>
            </select>
          </div>

          {/* Growth Stage */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">{t('irrigation.growthStage')}</label>
            <select
              name="growthStage"
              value={formData.growthStage}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-2xl font-bold text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-hidden"
            >
              <option value="Initial / Seedling">{lang === 'te' ? 'విత్తన / మొలక దశ (Initial)' : 'Initial / Seedling'}</option>
              <option value="Vegetative Stage">{lang === 'te' ? 'శాకీయ / ఎదుగుదల దశ (Vegetative)' : 'Vegetative Stage'}</option>
              <option value="Flowering / Reproductive">{lang === 'te' ? 'పూత / కాత దశ (Flowering)' : 'Flowering / Reproductive'}</option>
              <option value="Maturity / Ripening">{lang === 'te' ? 'పక్వత / కోత దశ (Maturity)' : 'Maturity / Ripening'}</option>
            </select>
          </div>

          {/* Soil Moisture Slider */}
          <div className="space-y-2 sm:col-span-2 bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                <Droplets className="w-4 h-4 text-blue-600" />
                {t('irrigation.soilMoisture')}
              </label>
              <span className="text-base font-black text-blue-800 bg-blue-100 px-3 py-1 rounded-xl">
                {formData.soilMoisture}%
              </span>
            </div>
            <input
              type="range"
              name="soilMoisture"
              min="10"
              max="95"
              value={formData.soilMoisture}
              onChange={handleChange}
              className="w-full h-2.5 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-[11px] text-gray-500 font-semibold">
              <span className="text-red-600 font-bold">{lang === 'te' ? 'ఎండిపోయిన నేల (10%)' : 'Dry (10%)'}</span>
              <span className="text-emerald-600 font-bold">{lang === 'te' ? 'సరిపడా తేమ (55-70%)' : 'Optimal (55-70%)'}</span>
              <span className="text-blue-600 font-bold">{lang === 'te' ? 'అధిక తేమ (95%)' : 'Saturated (95%)'}</span>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-4 rounded-2xl font-black text-sm shadow-lg shadow-blue-600/30 active:scale-98 transition-all cursor-pointer"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
          <span>{lang === 'te' ? 'నీటిపారుదల ప్రణాళిక లెక్కించండి' : 'Compute Live Irrigation Schedule'}</span>
        </button>
      </form>

      {/* Result Card */}
      {result && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-green-100 shadow-xs space-y-6 animate-fadeIn">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
            <div>
              <span className={`text-[11px] font-black uppercase px-3 py-1 rounded-full ${
                result.urgency === 'critical' ? 'bg-red-100 text-red-800' :
                result.urgency === 'high' ? 'bg-amber-100 text-amber-800' :
                'bg-emerald-100 text-emerald-800'
              }`}>
                {result.urgency === 'critical' ? '🔴 అత్యవసరం / Critical Urgency' :
                 result.urgency === 'high' ? '🟠 ప్రాధాన్యత / High Priority' :
                 '🟢 సమృద్ధిగా ఉంది / Optimal Moisture'}
              </span>
              <h3 className="text-xl font-black text-gray-900 mt-2">
                {lang === 'te' ? (result.timing?.te || result.wateringWindowTe) : (result.timing?.en || result.wateringWindow)}
              </h3>
            </div>

            <button
              type="button"
              onClick={() => isSpeaking ? stopSpeaking() : speakText(result.spokenAdvice || result.recommendation)}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                isSpeaking ? 'bg-red-500 text-white animate-pulse' : 'bg-blue-700 text-white hover:bg-blue-600'
              }`}
            >
              {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              <span>{isSpeaking ? t('app.stopSpeaking') : t('app.speakAloud')}</span>
            </button>
          </div>

          {/* 3 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100">
              <span className="text-[10px] font-bold text-blue-700 uppercase">{lang === 'te' ? 'నీటి పరిమాణం' : 'Water Requirement'}</span>
              <p className="text-3xl font-black text-blue-950 mt-1">
                {result.waterAmountLiters || result.water_amount_liters_sqm || 20} <span className="text-sm font-semibold">L/m²</span>
              </p>
              <p className="text-xs text-blue-700 mt-0.5">
                ≈ {((result.waterAmountLiters || 20) * 4046).toLocaleString('en-IN')} Liters/Acre
              </p>
            </div>

            <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100">
              <span className="text-[10px] font-bold text-emerald-700 uppercase">{lang === 'te' ? 'ఉత్తమ సమయం' : 'Best Time Window'}</span>
              <p className="text-xl font-black text-emerald-950 mt-1">
                {formData.temperature >= 32 ? '5:30 AM – 7:30 AM' : '6:00 AM – 8:30 AM'}
              </p>
              <p className="text-xs text-emerald-700 mt-0.5">
                {lang === 'te' ? 'బాష్పీభవన నష్టాన్ని నివారించండి' : 'Minimizes evaporative loss'}
              </p>
            </div>

            <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100">
              <span className="text-[10px] font-bold text-indigo-700 uppercase">{lang === 'te' ? 'తదుపరి నీటిపారుదల' : 'Next Irrigation'}</span>
              <p className="text-xl font-black text-indigo-950 mt-1">
                {result.recommended_date || 'After 2 days'}
              </p>
              <p className="text-xs text-indigo-700 mt-0.5">
                {lang === 'te' ? 'తేమ 45% చేరినప్పుడు' : 'When moisture reaches 45%'}
              </p>
            </div>
          </div>

          {/* AI Explanation Card */}
          <AIExplanationCard
            title={lang === 'te' ? 'నీటిపారుదల శాస్త్రీయ సిఫార్సు' : 'Scientific Irrigation Analysis'}
            description={typeof result.spokenAdvice === 'object' ? (result.spokenAdvice[lang] || result.spokenAdvice.en) : result.spokenAdvice}
            reasons={result.reasons || [
              { en: `Soil moisture (${formData.soilMoisture}%) is actively tracked against crop threshold.`, te: `నేల తేమ (${formData.soilMoisture}%) పంట అవసరాలకు అనుగుణంగా సరిచూడబడింది.` },
              { en: `Live weather temperature (${formData.temperature}°C) determines daily evapotranspiration.`, te: `లైవ్ ఉష్ణోగ్రత (${formData.temperature}°C) ఆధారంగా రోజువారీ నీటి నష్టం లెక్కించబడింది.` }
            ]}
          />
        </div>
      )}
    </div>
  );
}
