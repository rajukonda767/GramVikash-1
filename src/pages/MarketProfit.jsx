// src/pages/MarketProfit.jsx
// APMC Mandi Market Rates and Dynamic Profit Estimator with Spoken Voice Summary

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Store,
  Coins,
  TrendingUp,
  Volume2,
  VolumeX,
  Calculator,
  Building2,
  RefreshCw,
  Loader2,
} from 'lucide-react';

import { useFarmer } from '../context/FarmerContext';
import { useVoice } from '../context/VoiceContext';
import AIExplanationCard from '../components/common/AIExplanationCard';
import { MOCK_MANDI_PRICES } from '../services/mockData';

// Pure local calculation — no async, no crash
function calcProfit(form) {
  const area = parseFloat(form.areaAcres) || 3.5;
  const yieldPerAcre = parseFloat(form.yieldTonnesPerAcre) || 3.4;
  const pricePerQ = parseFloat(form.marketPricePerQuintal) || 2320;
  const seedCost = parseFloat(form.seedCost) || 3500;
  const fertCost = parseFloat(form.fertilizerCost) || 8000;
  const pestCost = parseFloat(form.pesticideCost) || 4500;
  const laborCost = parseFloat(form.laborCost) || 12000;
  const irrigCost = parseFloat(form.irrigationCost) || 3000;
  const transCost = parseFloat(form.transportCost) || 2500;

  const totalYield = area * yieldPerAcre;           // tonnes
  const grossRevenue = totalYield * 10 * pricePerQ; // 1 tonne = 10 quintals
  const totalCostPerAcre = seedCost + fertCost + pestCost + laborCost + irrigCost + transCost;
  const totalCost = totalCostPerAcre * area;
  const netProfit = grossRevenue - totalCost;
  const profitPerAcre = area > 0 ? netProfit / area : 0;
  const roiPercent = totalCost > 0 ? ((netProfit / totalCost) * 100).toFixed(1) : '0';

  return {
    totalYieldTonnes: Math.round(totalYield * 10) / 10,
    grossRevenue: Math.round(grossRevenue),
    totalCost: Math.round(totalCost),
    netProfit: Math.round(netProfit),
    profitPerAcre: Math.round(profitPerAcre),
    roiPercent,
  };
}

// Crop defaults for quick-fill
const CROP_DEFAULTS = {
  Paddy: { yieldTonnesPerAcre: 3.4, marketPricePerQuintal: 2320, seedCost: 3200, fertilizerCost: 7800, laborCost: 11000 },
  Cotton: { yieldTonnesPerAcre: 1.6, marketPricePerQuintal: 7450, seedCost: 4500, fertilizerCost: 9500, laborCost: 14000 },
  Maize: { yieldTonnesPerAcre: 3.8, marketPricePerQuintal: 2150, seedCost: 2800, fertilizerCost: 7200, laborCost: 9000 },
  Tomato: { yieldTonnesPerAcre: 12.0, marketPricePerQuintal: 800, seedCost: 6000, fertilizerCost: 8500, laborCost: 15000 },
  Chilli: { yieldTonnesPerAcre: 2.5, marketPricePerQuintal: 18500, seedCost: 5000, fertilizerCost: 10000, laborCost: 16000 },
  Banana: { yieldTonnesPerAcre: 22.0, marketPricePerQuintal: 1800, seedCost: 12000, fertilizerCost: 14000, laborCost: 18000 },
};

export default function MarketProfit() {
  const { t, i18n } = useTranslation();
  const { profile } = useFarmer();
  const { speakText, stopSpeaking, isSpeaking } = useVoice();
  const lang = i18n.language || 'en';

  const [selectedCrop, setSelectedCrop] = useState('Paddy');
  const [formData, setFormData] = useState({
    crop: 'Paddy',
    areaAcres: profile?.farm?.sizeAcres || 3.5,
    ...CROP_DEFAULTS['Paddy'],
    pesticideCost: 4500,
    irrigationCost: 3000,
    transportCost: 2500,
  });

  // Recalculate profit live as form changes — pure synchronous, no async
  const profitResult = calcProfit(formData);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCropChange = (e) => {
    const crop = e.target.value;
    const defaults = CROP_DEFAULTS[crop] || CROP_DEFAULTS['Paddy'];
    setSelectedCrop(crop);
    setFormData((prev) => ({
      ...prev,
      crop,
      ...defaults,
    }));
  };

  const handleSpeakProfit = () => {
    if (isSpeaking) {
      stopSpeaking();
      return;
    }

    const summary = lang === 'te'
      ? `${formData.areaAcres} ఎకరాల ${selectedCrop} పంటకు మొత్తం దిగుబడి ${profitResult.totalYieldTonnes} టన్నులు. స్థూల ఆదాయం ${profitResult.grossRevenue.toLocaleString('en-IN')} రూపాయలు. నికర లాభం ${profitResult.netProfit.toLocaleString('en-IN')} రూపాయలు. పెట్టుబడిపై రాబడి ${profitResult.roiPercent} శాతం.`
      : lang === 'hi'
      ? `${formData.areaAcres} एकड़ ${selectedCrop} फसल से कुल उपज ${profitResult.totalYieldTonnes} टन। सकल आय ${profitResult.grossRevenue.toLocaleString('en-IN')} रुपये। शुद्ध लाभ ${profitResult.netProfit.toLocaleString('en-IN')} रुपये।`
      : `Your ${formData.areaAcres} acre ${selectedCrop} farm yields ${profitResult.totalYieldTonnes} tonnes. Gross revenue Rs ${profitResult.grossRevenue.toLocaleString('en-IN')}. Net profit Rs ${profitResult.netProfit.toLocaleString('en-IN')} with ${profitResult.roiPercent}% ROI.`;

    speakText(summary);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fadeIn pb-12">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-green-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-md">
              <Store className="w-6 h-6" />
            </div>
            {t('market.title')}
          </h1>
          <p className="text-sm text-gray-600 mt-1 font-medium">{t('market.subtitle')}</p>
        </div>
      </div>

      {/* APMC Mandi Live Price Cards */}
      <div>
        <h2 className="text-base font-black text-gray-800 mb-3 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-emerald-600" />
          {lang === 'te' ? 'APMC మార్కెట్ ధరలు (నేటివి)' : 'APMC Mandi Rates — Today'}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MOCK_MANDI_PRICES.map((m, idx) => (
            <div
              key={idx}
              className="bg-white rounded-3xl p-5 border border-green-100 shadow-xs hover:border-green-300 transition-all flex flex-col justify-between space-y-4 cursor-pointer"
              onClick={() => {
                // Click to auto-fill crop in calculator
                const cropKey = m.crop.split(' ')[0];
                if (CROP_DEFAULTS[cropKey]) {
                  setSelectedCrop(cropKey);
                  setFormData((prev) => ({
                    ...prev,
                    crop: cropKey,
                    marketPricePerQuintal: m.pricePerQuintal,
                    ...CROP_DEFAULTS[cropKey],
                  }));
                }
              }}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                    {lang === 'te' ? m.marketTe : m.market}
                  </span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    m.trend === 'up' ? 'bg-emerald-100 text-emerald-800' :
                    m.trend === 'down' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {m.trend === 'up' ? '+' : m.trend === 'down' ? '' : ''}{m.changePercent}% {m.trend === 'up' ? '↑' : m.trend === 'down' ? '↓' : '→'}
                  </span>
                </div>

                <h3 className="text-lg font-black text-gray-900 mt-2">
                  {lang === 'te' ? m.cropTe : m.crop}
                </h3>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-end justify-between">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase">{t('market.pricePerQuintal')}</span>
                  <p className="text-2xl font-black text-emerald-700">₹{m.pricePerQuintal.toLocaleString('en-IN')}</p>
                </div>
                <p className="text-[11px] text-gray-500 font-medium">Range: ₹{m.minPrice} - ₹{m.maxPrice}</p>
              </div>
              <p className="text-[10px] text-emerald-600 font-semibold">{lang === 'te' ? 'కాలిక్యులేటర్‌లో నింపడానికి నొక్కండి' : 'Click to use in calculator'}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ================================================================ */}
      {/* PROFIT CALCULATOR                                               */}
      {/* ================================================================ */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-green-100 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2">
            <Calculator className="w-6 h-6 text-green-700" />
            <div>
              <h2 className="text-xl font-black text-gray-900">
                {lang === 'te' ? 'నికర లాభం అంచనా' : 'Profit Calculator'}
              </h2>
              <p className="text-xs text-gray-500">
                {lang === 'te' ? 'దిగుబడి × మార్కెట్ ధర − మొత్తం పెట్టుబడి' : 'Revenue (Yield × Mandi Rate) minus all cultivation costs'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSpeakProfit}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all shadow-xs ${
              isSpeaking ? 'bg-red-500 text-white animate-pulse' : 'bg-emerald-700 text-white hover:bg-emerald-600'
            }`}
          >
            {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            <span>{isSpeaking ? t('app.stopSpeaking') : t('app.speakAloud')}</span>
          </button>
        </div>

        {/* Crop Quick-Select */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
            {lang === 'te' ? 'పంట ఎంచుకోండి (స్వయంగా విలువలు నింపబడతాయి)' : 'Select Crop (values auto-fill)'}
          </label>
          <div className="flex flex-wrap gap-2">
            {Object.keys(CROP_DEFAULTS).map((crop) => (
              <button
                key={crop}
                type="button"
                onClick={() => handleCropChange({ target: { value: crop } })}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                  selectedCrop === crop
                    ? 'bg-green-700 text-white border-green-700 shadow-md'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-green-50 hover:border-green-300'
                }`}
              >
                {crop}
              </button>
            ))}
          </div>
        </div>

        {/* 3 Summary Big Cards — Always visible, updates live */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100">
            <span className="text-xs font-bold text-blue-700 uppercase">{t('yield.grossRevenue')}</span>
            <p className="text-2xl font-black text-blue-950 mt-1">₹{profitResult.grossRevenue.toLocaleString('en-IN')}</p>
            <p className="text-xs text-blue-600 mt-0.5">{profitResult.totalYieldTonnes} T × ₹{formData.marketPricePerQuintal}/q</p>
          </div>

          <div className="bg-rose-50 p-5 rounded-2xl border border-rose-100">
            <span className="text-xs font-bold text-rose-700 uppercase">{t('yield.totalCost')}</span>
            <p className="text-2xl font-black text-rose-950 mt-1">₹{profitResult.totalCost.toLocaleString('en-IN')}</p>
            <p className="text-xs text-rose-600 mt-0.5">{lang === 'te' ? 'విత్తనాలు, ఎరువులు, కూలి మరియు రవాణా' : 'Seeds, fertilizer, labor & transport'}</p>
          </div>

          <div className={`p-5 rounded-2xl shadow-md text-white ${profitResult.netProfit >= 0 ? 'bg-emerald-600' : 'bg-red-600'}`}>
            <span className="text-xs font-bold opacity-80 uppercase">{t('yield.netProfit')}</span>
            <p className="text-3xl font-black mt-1">₹{profitResult.netProfit.toLocaleString('en-IN')}</p>
            <p className="text-xs opacity-80 mt-0.5">≈ ₹{profitResult.profitPerAcre.toLocaleString('en-IN')} / acre | ROI: {profitResult.roiPercent}%</p>
          </div>
        </div>

        {/* Editable Inputs Grid */}
        <div className="space-y-3 pt-2 border-t border-gray-100">
          <h4 className="text-xs font-bold text-gray-500 uppercase">
            {lang === 'te' ? 'పొలం పారామీటర్లు మరియు ఖర్చు అంశాలు మార్చండి' : 'Adjust Farm Parameters & Cost Factors'}
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: lang === 'te' ? 'విస్తీర్ణం (ఎకరాలు)' : 'Acreage', name: 'areaAcres', step: 0.5 },
              { label: lang === 'te' ? 'దిగుబడి (T/ఎకరా)' : 'Yield (T/acre)', name: 'yieldTonnesPerAcre', step: 0.1 },
              { label: lang === 'te' ? 'ధర (₹/క్వింటాల్)' : 'Rate (₹/quintal)', name: 'marketPricePerQuintal', step: 50 },
              { label: lang === 'te' ? 'కూలి ఖర్చు (₹/ఎకరా)' : 'Labor Cost (₹/acre)', name: 'laborCost', step: 500 },
              { label: lang === 'te' ? 'విత్తన ఖర్చు (₹/ఎకరా)' : 'Seed Cost (₹/acre)', name: 'seedCost', step: 200 },
              { label: lang === 'te' ? 'ఎరువు ఖర్చు (₹/ఎకరా)' : 'Fertilizer (₹/acre)', name: 'fertilizerCost', step: 500 },
              { label: lang === 'te' ? 'క్రిమిసంహారకాలు (₹)' : 'Pesticide (₹/acre)', name: 'pesticideCost', step: 200 },
              { label: lang === 'te' ? 'రవాణా (₹/ఎకరా)' : 'Transport (₹/acre)', name: 'transportCost', step: 100 },
            ].map(({ label, name, step }) => (
              <div key={name} className="space-y-1">
                <label className="text-[11px] font-bold text-gray-600">{label}</label>
                <input
                  type="number"
                  name={name}
                  value={formData[name]}
                  onChange={handleChange}
                  step={step}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-xs focus:ring-2 focus:ring-green-400 outline-none"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
