// src/pages/YieldEstimation.jsx
// Yield & Profit Estimation with real ML model, dynamic values, and full audio output

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  TrendingUp,
  Sparkles,
  Volume2,
  VolumeX,
  Loader2,
  Wheat,
  Coins,
  BarChart3,
} from 'lucide-react';

import { useFarmer } from '../context/FarmerContext';
import { useVoice } from '../context/VoiceContext';
import AIExplanationCard from '../components/common/AIExplanationCard';
import yieldService from '../services/yieldService';

// Safe text extractor for multilingual objects
function txt(val, lang) {
  if (!val) return '';
  if (typeof val === 'object') return val[lang] || val.en || val.te || Object.values(val)[0] || '';
  return String(val);
}

// All crops available in the Yield ML model
const CROP_OPTIONS = [
  { value: 'Rice', label: 'Paddy / Rice (వరి / धान)' },
  { value: 'Maize', label: 'Maize (మొక్కజొన్న / मक्का)' },
  { value: 'Cotton(lint)', label: 'Cotton (పత్తి / कपास)' },
  { value: 'Sugarcane', label: 'Sugarcane (చెరకు / गन्ना)' },
  { value: 'Groundnut', label: 'Groundnut (వేరుశనగ / मूंगफली)' },
  { value: 'Jowar', label: 'Jowar/Sorghum (జొన్న / ज्वार)' },
  { value: 'Moong(Green Gram)', label: 'Moong / Green Gram (పెసలు / मूंग)' },
  { value: 'Urad', label: 'Urad / Black Gram (మినుము / उड़द)' },
  { value: 'Sunflower', label: 'Sunflower (పొద్దుతిరుగుడు / सूरजमुखी)' },
  { value: 'Castor seed', label: 'Castor (ఆముదం / अरंडी)' },
  { value: 'Wheat', label: 'Wheat (గోధుమ / गेहूं)' },
  { value: 'Potato', label: 'Potato (బంగాళాదుంప / आलू)' },
  { value: 'Onion', label: 'Onion (ఉల్లి / प्याज)' },
  { value: 'Tomato', label: 'Tomato (టమాటో / टमाटर)' },
  { value: 'Banana', label: 'Banana (అరటి / केला)' },
  { value: 'Mango', label: 'Mango (మామిడి / आम)' },
];

const SEASON_OPTIONS = [
  { value: 'Kharif', label: 'Kharif Season (ఖరీఫ్ — జూన్/జులై)' },
  { value: 'Rabi', label: 'Rabi Season (రబీ — అక్టోబర్/నవంబర్)' },
  { value: 'Summer', label: 'Summer Season (వేసవి — ఫిబ్రవరి/మార్చి)' },
  { value: 'Whole Year', label: 'Year-round (అన్ని కాలాలు)' },
];

export default function YieldEstimation() {
  const { t, i18n } = useTranslation();
  const { profile } = useFarmer();
  const { speakText, stopSpeaking, isSpeaking } = useVoice();
  const lang = i18n.language || 'en';

  const [formData, setFormData] = useState({
    crop: 'Rice',
    areaAcres: profile?.farm?.sizeAcres || 3.5,
    season: 'Kharif',
    rainfallMm: 850,
    fertilizerKg: 120,
    pesticideKg: 2.5,
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handlePredict = async (e) => {
    if (e) e.preventDefault();

    // Validate area
    const area = parseFloat(formData.areaAcres);
    if (!area || area <= 0 || area > 1000) {
      setError(lang === 'te' ? 'దయచేసి చెల్లుబాటయ్యే ఎకరాల విస్తీర్ణం నమోదు చేయండి (0.1–1000).' : 'Please enter a valid farm area in acres (0.1 to 1000).');
      return;
    }

    setLoading(true);
    setResult(null);
    setError('');

    try {
      const res = await yieldService.predictYield({
        crop: formData.crop,
        areaAcres: area,
        season: formData.season,
        state: profile?.location?.state || 'Andhra Pradesh',
        rainfallMm: parseFloat(formData.rainfallMm) || 850,
        fertilizerKg: parseFloat(formData.fertilizerKg) || 120,
        pesticideKg: parseFloat(formData.pesticideKg) || 2.5,
        language: lang,
      });

      setResult(res);

      // Auto-speak result
      if (res?.spokenSummary) {
        const summaryText = txt(res.spokenSummary, lang);
        if (summaryText) speakText(summaryText);
      }
    } catch (err) {
      setError(lang === 'te' ? 'దిగుబడి అంచనా విఫలమైంది. మళ్లీ ప్రయత్నించండి.' : 'Yield prediction failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSpeak = () => {
    if (isSpeaking) { stopSpeaking(); return; }
    if (result?.spokenSummary) {
      speakText(txt(result.spokenSummary, lang));
    }
  };

  const profitEstimate = result ? (() => {
    // Market price database per crop (₹ per quintal — 1 tonne = 10 quintals)
    const PRICE_DB = {
      'Rice': 2320, 'Maize': 2150, 'Cotton(lint)': 7450, 'Sugarcane': 350,
      'Groundnut': 6200, 'Jowar': 2800, 'Moong(Green Gram)': 8400, 'Urad': 8200,
      'Sunflower': 7100, 'Castor seed': 7500, 'Wheat': 2350, 'Potato': 1500,
      'Onion': 2000, 'Tomato': 800, 'Banana': 1800, 'Mango': 4500,
    };
    const COST_DB = { default: 32000, 'Cotton(lint)': 55000, 'Banana': 65000, 'Mango': 45000, 'Sugarcane': 28000 };
    const pricePerQ = PRICE_DB[formData.crop] || 2500;
    const grossRevenue = result.totalYieldTonnes * 10 * pricePerQ;
    const totalCost = (COST_DB[formData.crop] || COST_DB.default) * (parseFloat(formData.areaAcres) || 3.5);
    return {
      grossRevenue: Math.round(grossRevenue),
      totalCost: Math.round(totalCost),
      netProfit: Math.round(grossRevenue - totalCost),
      pricePerQ,
    };
  })() : null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fadeIn pb-12">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-green-100 shadow-xs">
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500 text-white rounded-2xl flex items-center justify-center shadow-md">
            <TrendingUp className="w-6 h-6" />
          </div>
          {t('yield.title')}
        </h1>
        <p className="text-sm text-gray-600 mt-1 font-medium">{t('yield.subtitle')}</p>
      </div>

      {/* Form */}
      <form onSubmit={handlePredict} className="bg-white rounded-3xl p-6 sm:p-8 border border-green-100 shadow-xs space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Crop */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">{t('yield.crop')}</label>
            <select
              name="crop"
              value={formData.crop}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-2xl font-bold text-sm focus:ring-2 focus:ring-green-500 outline-none"
            >
              {CROP_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {/* Farm Area */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">{t('yield.farmSize')} (Acres)</label>
            <input
              type="number"
              step="0.5"
              name="areaAcres"
              value={formData.areaAcres}
              onChange={handleChange}
              min="0.1"
              max="1000"
              required
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-2xl font-bold text-sm focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>

          {/* Season */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">{t('yield.season')}</label>
            <select
              name="season"
              value={formData.season}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-2xl font-bold text-sm focus:ring-2 focus:ring-green-500 outline-none"
            >
              {SEASON_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Advanced Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-gray-100">
          {[
            { label: lang === 'te' ? 'వార్షిక వర్షపాతం (mm)' : 'Annual Rainfall (mm)', name: 'rainfallMm', min: 50, max: 3000, step: 50 },
            { label: lang === 'te' ? 'ఎరువు వాడకం (kg/ha)' : 'Fertilizer Used (kg/ha)', name: 'fertilizerKg', min: 0, max: 500, step: 10 },
            { label: lang === 'te' ? 'పురుగుమందులు (kg/ha)' : 'Pesticide Used (kg/ha)', name: 'pesticideKg', min: 0, max: 20, step: 0.5 },
          ].map(({ label, name, min, max, step }) => (
            <div key={name} className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">{label}</label>
              <input
                type="number"
                name={name}
                value={formData[name]}
                onChange={handleChange}
                min={min}
                max={max}
                step={step}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-2xl font-bold text-sm focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>
          ))}
        </div>

        {error && (
          <p className="text-sm font-bold text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-white font-black py-4 rounded-2xl shadow-lg shadow-amber-900/20 transition-all flex items-center justify-center gap-2 text-base active:scale-98 cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>{lang === 'te' ? 'అంచనా వేస్తున్నాం...' : 'Calculating...'}</span>
            </>
          ) : (
            <>
              <TrendingUp className="w-5 h-5" />
              <span>{t('yield.calculate')}</span>
            </>
          )}
        </button>
      </form>

      {/* ================================================================ */}
      {/* RESULTS                                                          */}
      {/* ================================================================ */}
      {result && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-green-100 shadow-xs space-y-6">
            {/* Header Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
              <div>
                <span className="text-xs font-bold text-amber-700 bg-amber-100 px-3 py-1 rounded-full uppercase">
                  {t('yield.forecastResult')}
                </span>
                <h3 className="text-2xl font-black text-gray-900 mt-2">
                  {result.totalYieldTonnes} {lang === 'te' ? 'టన్నులు' : 'Tonnes'}
                  <span className="text-base font-bold text-gray-500 ml-2">
                    ({result.yieldPerAcre} T / acre)
                  </span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {lang === 'te'
                    ? `${formData.areaAcres} ఎకరాల ${formData.crop} పంట — ${formData.season} సీజన్`
                    : `${formData.areaAcres} acres of ${formData.crop} — ${formData.season} Season`
                  }
                </p>
              </div>

              {/* Speak Button */}
              <button
                type="button"
                onClick={handleSpeak}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all shadow-xs flex-shrink-0 ${
                  isSpeaking ? 'bg-red-500 text-white animate-pulse' : 'bg-amber-600 text-white hover:bg-amber-500'
                }`}
              >
                {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                <span>{isSpeaking ? t('app.stopSpeaking') : t('app.speakAloud')}</span>
              </button>
            </div>

            {/* Confidence Range */}
            <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200">
              <span className="text-xs font-bold text-amber-900 uppercase">
                {lang === 'te' ? 'అంచనా దిగుబడి పరిధి' : 'Estimated Production Range'}
              </span>
              <p className="text-lg font-black text-amber-950 mt-0.5">{result.confidenceInterval}</p>
            </div>

            {/* Profit Breakdown */}
            {profitEstimate && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                  <span className="text-xs font-bold text-blue-700 uppercase flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5" /> {lang === 'te' ? 'స్థూల ఆదాయం' : 'Gross Revenue'}
                  </span>
                  <p className="text-xl font-black text-blue-950 mt-1">₹{profitEstimate.grossRevenue.toLocaleString('en-IN')}</p>
                  <p className="text-[11px] text-blue-600 mt-0.5">{result.totalYieldTonnes}T × ₹{profitEstimate.pricePerQ}/q</p>
                </div>
                <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100">
                  <span className="text-xs font-bold text-rose-700 uppercase">{lang === 'te' ? 'మొత్తం పెట్టుబడి' : 'Total Input Cost'}</span>
                  <p className="text-xl font-black text-rose-950 mt-1">₹{profitEstimate.totalCost.toLocaleString('en-IN')}</p>
                  <p className="text-[11px] text-rose-600 mt-0.5">{lang === 'te' ? 'అన్ని వ్యవసాయ ఖర్చులు' : 'All cultivation inputs'}</p>
                </div>
                <div className={`p-4 rounded-2xl text-white ${profitEstimate.netProfit >= 0 ? 'bg-emerald-600' : 'bg-red-600'}`}>
                  <span className="text-xs font-bold opacity-80 uppercase flex items-center gap-1">
                    <BarChart3 className="w-3.5 h-3.5" /> {lang === 'te' ? 'నికర లాభం' : 'Net Profit'}
                  </span>
                  <p className="text-2xl font-black mt-1">₹{profitEstimate.netProfit.toLocaleString('en-IN')}</p>
                  <p className="text-[11px] opacity-80 mt-0.5">
                    {lang === 'te' ? 'ఎకరానికి' : 'Per acre'}: ₹{Math.round(profitEstimate.netProfit / (parseFloat(formData.areaAcres) || 3.5)).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            )}

            {/* Contributing Factors */}
            {result.factors && result.factors.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-500 uppercase">{t('yield.factors')}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {result.factors.map((f, i) => (
                    <div key={i} className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200/70">
                      <span className="text-xs font-bold text-emerald-600">{f.impact}</span>
                      <p className="text-xs font-bold text-gray-800 mt-1">{f[lang] || f.en || f.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <AIExplanationCard
            what={`${lang === 'te' ? 'అంచనా మొత్తం దిగుబడి' : 'Expected Total Yield'}: ${result.totalYieldTonnes} ${lang === 'te' ? 'టన్నులు' : 'Tonnes'} (${result.yieldPerAcre} T/acre)`}
            why={{
              en: `Calculated using trained ML model with crop type (${formData.crop}), area (${formData.areaAcres} acres), ${formData.season} season, rainfall ${formData.rainfallMm}mm, and fertilizer ${formData.fertilizerKg}kg.`,
              te: `నేల ఆధారిత ML మోడల్ ద్వారా లెక్కించబడింది: పంట (${formData.crop}), విస్తీర్ణం (${formData.areaAcres} ఎకరాలు), ${formData.season} సీజన్, వర్షపాతం ${formData.rainfallMm}mm, ఎరువు ${formData.fertilizerKg}kg.`,
              hi: `ML मॉडल से अनुमान: फसल (${formData.crop}), क्षेत्र (${formData.areaAcres} एकड़), ${formData.season} मौसम।`,
            }}
            action={result.improvementTips && result.improvementTips[0]}
            spokenText={txt(result.spokenSummary, lang)}
          />
        </div>
      )}
    </div>
  );
}
