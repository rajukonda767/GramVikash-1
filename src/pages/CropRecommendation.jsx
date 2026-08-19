// src/pages/CropRecommendation.jsx
// Professional Crop Recommendation Page with:
// 1. Soil Report Upload + OCR + Validation
// 2. Per-crop Voice Speak Button (3 crops)
// 3. Temperature/Humidity/Rainfall auto from weather (hidden from farmer)
// 4. Last Recommendation History (1 record from Supabase)
// 5. Full Telugu Voice Output

import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Wheat,
  FileText,
  Sparkles,
  Volume2,
  VolumeX,
  CheckCircle2,
  Check,
  RefreshCw,
  ThermometerSun,
  Droplets,
  CloudRain,
  Clock,
  History,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from 'lucide-react';

import { useFarmer } from '../context/FarmerContext';
import { useVoice } from '../context/VoiceContext';
import FormVoiceInput from '../components/voice/FormVoiceInput';
import SoilReportUploadModal from '../components/common/SoilReportUploadModal';
import AIExplanationCard from '../components/common/AIExplanationCard';
import cropService from '../services/cropService';

// Rank Medal emoji
const RANK_MEDAL = ['🥇', '🥈', '🥉'];

export default function CropRecommendation() {
  const { t, i18n } = useTranslation();
  const { profile, weather, setActiveCrop, addActivity } = useFarmer();
  const { speakText, stopSpeaking, isSpeaking } = useVoice();
  const lang = i18n.language || 'en';

  const [formData, setFormData] = useState({
    nitrogen: profile?.farm?.soilReport?.nitrogen || '',
    phosphorus: profile?.farm?.soilReport?.phosphorus || '',
    potassium: profile?.farm?.soilReport?.potassium || '',
    ph: profile?.farm?.soilReport?.ph || '',
  });

  const [isSoilModalOpen, setIsSoilModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [validationError, setValidationError] = useState('');
  const [successToast, setSuccessToast] = useState('');
  const [lastRec, setLastRec] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [speakingCropIdx, setSpeakingCropIdx] = useState(null);

  const resultsRef = useRef(null);

  // Fetch last recommendation from Supabase on page load
  useEffect(() => {
    cropService.getLastRecommendation().then((data) => {
      if (data?.status === 'success' && data.recommendation) {
        setLastRec(data.recommendation);
      }
    });
  }, []);

  // Live weather values (auto-used in backend, just display them for transparency)
  const liveTemp = weather?.temperature ?? 28;
  const liveHumidity = weather?.humidity ?? 70;
  const lat = profile?.location?.latitude || 16.5062;
  const lon = profile?.location?.longitude || 80.6480;
  const locationName = profile?.location?.addressString || 'Vijayawada, Andhra Pradesh';

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setValidationError('');
  };

  // Called when Soil Report Modal extracts NPK values
  const handleDataExtracted = (extracted) => {
    setFormData((prev) => ({
      ...prev,
      nitrogen: extracted.nitrogen ?? prev.nitrogen,
      phosphorus: extracted.phosphorus ?? prev.phosphorus,
      potassium: extracted.potassium ?? prev.potassium,
      ph: extracted.ph ?? prev.ph,
    }));
  };

  // Called when Voice Form Input parses spoken values (e.g., "N=82")
  const handleVoiceValues = (values) => {
    setFormData((prev) => ({ ...prev, ...values }));
  };

  // Validate NPK inputs before sending to model
  const validate = () => {
    const n = parseFloat(formData.nitrogen);
    const p = parseFloat(formData.phosphorus);
    const k = parseFloat(formData.potassium);
    const ph = parseFloat(formData.ph);

    if (!formData.nitrogen || isNaN(n) || n < 0 || n > 200) {
      return lang === 'te'
        ? 'దయచేసి చెల్లుబాటయ్యే నత్రజని (N) విలువ నమోదు చేయండి (0–200 kg/ha).'
        : 'Please enter a valid Nitrogen (N) value between 0 and 200 kg/ha.';
    }
    if (!formData.phosphorus || isNaN(p) || p < 0 || p > 150) {
      return lang === 'te'
        ? 'దయచేసి చెల్లుబాటయ్యే భాస్వరం (P) విలువ నమోదు చేయండి (0–150 kg/ha).'
        : 'Please enter a valid Phosphorus (P) value between 0 and 150 kg/ha.';
    }
    if (!formData.potassium || isNaN(k) || k < 0 || k > 200) {
      return lang === 'te'
        ? 'దయచేసి చెల్లుబాటయ్యే పొటాషియం (K) విలువ నమోదు చేయండి (0–200 kg/ha).'
        : 'Please enter a valid Potassium (K) value between 0 and 200 kg/ha.';
    }
    if (!formData.ph || isNaN(ph) || ph < 3 || ph > 10) {
      return lang === 'te'
        ? 'దయచేసి చెల్లుబాటయ్యే pH విలువ నమోదు చేయండి (3–10 స్కేల్).'
        : 'Please enter a valid pH value between 3 and 10.';
    }
    return '';
  };

  const handleRecommend = async (e) => {
    if (e) e.preventDefault();

    const err = validate();
    if (err) {
      setValidationError(err);
      speakText(err);
      return;
    }

    setLoading(true);
    setResult(null);
    setValidationError('');

    try {
      const res = await cropService.recommendCrops({
        ...formData,
        latitude: lat,
        longitude: lon,
        location_name: locationName,
        language: lang,
      });
      setResult(res);

      // Auto-scroll to results
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);

      // Auto-speak top crop summary
      if (res.spokenSummary) {
        const summary = typeof res.spokenSummary === 'object'
          ? (res.spokenSummary[lang] || res.spokenSummary.en)
          : res.spokenSummary;
        speakText(summary);
      }
    } catch (err) {
      setValidationError(
        lang === 'te'
          ? 'సిఫార్సు విఫలమైంది. దయచేసి మళ్ళీ ప్రయత్నించండి.'
          : 'Recommendation failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCrop = (crop) => {
    setActiveCrop({
      cropName: lang === 'te' ? crop.nameTe : crop.nameEn,
      cropKey: crop.nameEn,
      plantingDate: new Date().toISOString().split('T')[0],
      cropAgeDays: 1,
      growthStage: lang === 'te' ? 'విత్తన / ప్రారంభ దశ' : 'Seedling Stage',
      totalCycleDays: crop.growingDays || 120,
      expectedHarvestDate: new Date(Date.now() + (crop.growingDays || 120) * 86400000).toISOString().split('T')[0],
      healthStatus: 'Healthy',
    });

    addActivity({
      type: 'crop_selected',
      title: `Selected ${crop.nameEn} for cultivation`,
      titleTe: `${crop.nameTe} పంట సాగుకు ఎంపిక చేయబడింది`,
      titleHi: `${crop.nameHi} फसल चुनी गई`,
    });

    setSuccessToast(lang === 'te' ? `${crop.nameTe} సాగుకు ఎంపిక చేయబడింది! 🌱` : `${crop.nameEn} added to your active farm plan! 🌱`);
    setTimeout(() => setSuccessToast(''), 4000);
  };

  // Per-crop speak button handler
  const handleSpeakCrop = (crop, idx) => {
    if (speakingCropIdx === idx && isSpeaking) {
      stopSpeaking();
      setSpeakingCropIdx(null);
      return;
    }
    setSpeakingCropIdx(idx);
    const desc = crop.spokenDescription?.[lang] || crop.spokenDescription?.en || '';
    speakText(desc);
    // When audio ends, clear the active state
    setTimeout(() => setSpeakingCropIdx(null), desc.length * 70);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fadeIn pb-12">
      <SoilReportUploadModal
        isOpen={isSoilModalOpen}
        onClose={() => setIsSoilModalOpen(false)}
        onDataExtracted={handleDataExtracted}
      />

      {/* ================================================================ */}
      {/* HEADER                                                           */}
      {/* ================================================================ */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-green-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-green-600 text-white rounded-2xl flex items-center justify-center shadow-md">
              <Wheat className="w-6 h-6" />
            </div>
            {t('crop.title')}
          </h1>
          <p className="text-sm text-gray-600 mt-1 font-medium">{t('crop.subtitle')}</p>
        </div>

        <button
          type="button"
          onClick={() => setIsSoilModalOpen(true)}
          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-5 py-3 rounded-2xl transition-all flex items-center justify-center gap-2 text-sm shadow-xs active:scale-95 flex-shrink-0"
        >
          <FileText className="w-5 h-5 text-emerald-600" />
          <span>{t('crop.uploadSoilReport')}</span>
        </button>
      </div>

      {/* ================================================================ */}
      {/* LAST RECOMMENDATION HISTORY (Collapsible)                        */}
      {/* ================================================================ */}
      {lastRec && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl overflow-hidden">
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className="w-full flex items-center justify-between px-5 py-3.5 text-amber-900 font-bold text-sm"
          >
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-amber-600" />
              <span>{lang === 'te' ? 'మీ చివరి పంట సిఫార్సు' : 'Your Last Recommendation'}</span>
              <span className="text-[11px] bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                {new Date(lastRec.created_at).toLocaleDateString(lang === 'te' ? 'te-IN' : 'en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
            {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showHistory && lastRec.recommendations && (
            <div className="px-5 pb-5 grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-amber-200 pt-4">
              {lastRec.recommendations.slice(0, 3).map((c, i) => (
                <div key={i} className="bg-white rounded-2xl p-4 border border-amber-100">
                  <div className="flex items-center gap-2 mb-1">
                    <span>{RANK_MEDAL[i]}</span>
                    <span className="font-bold text-sm text-gray-900">{lang === 'te' ? c.name_te : c.name_en}</span>
                  </div>
                  <p className="text-xs text-emerald-700 font-semibold">{c.suitability_percent}% {t('crop.suitability')}</p>
                  <p className="text-xs text-gray-500 mt-1">₹{(c.estimated_profit_per_acre || 0).toLocaleString('en-IN')}/acre</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================================================================ */}
      {/* VOICE FORM INPUT                                                 */}
      {/* ================================================================ */}
      <FormVoiceInput onValuesParsed={handleVoiceValues} />

      {/* ================================================================ */}
      {/* SOIL NPK FORM                                                    */}
      {/* ================================================================ */}
      <form onSubmit={handleRecommend} className="bg-white rounded-3xl p-6 sm:p-8 border border-green-100 shadow-xs space-y-6">
        <div>
          <h3 className="text-base font-bold text-gray-900 mb-0.5">{t('crop.manualEntry')}</h3>
          <p className="text-xs text-gray-500">
            {lang === 'te' ? 'మీ నేల పరీక్ష విలువలను నమోదు చేయండి (N, P, K, pH మాత్రమే అవసరం)' : 'Enter your soil test values (N, P, K, pH only — weather is auto-fetched from your location)'}
          </p>
        </div>

        {/* NPK + pH Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: t('crop.nitrogen'), name: 'nitrogen', unit: 'kg/ha', placeholder: '82', min: 0, max: 200 },
            { label: t('crop.phosphorus'), name: 'phosphorus', unit: 'kg/ha', placeholder: '42', min: 0, max: 150 },
            { label: t('crop.potassium'), name: 'potassium', unit: 'kg/ha', placeholder: '48', min: 0, max: 200 },
            { label: t('crop.ph'), name: 'ph', unit: '3–10 scale', placeholder: '6.8', min: 3, max: 10, step: 0.1 },
          ].map(({ label, name, unit, placeholder, min, max, step }) => (
            <div key={name} className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                {label} {name === 'ph' ? '' : `(${name.charAt(0).toUpperCase()})`}
              </label>
              <input
                type="number"
                name={name}
                value={formData[name]}
                onChange={handleChange}
                placeholder={placeholder}
                step={step || 1}
                min={min}
                max={max}
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-2xl font-bold text-base focus:ring-2 focus:ring-green-500 focus:bg-white outline-none"
              />
              <span className="text-[10px] text-gray-400 font-semibold">{unit}</span>
            </div>
          ))}
        </div>

        {/* Auto-Fetched Climate Info (read-only, informational) */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
          <p className="text-xs font-bold text-blue-800 mb-2 flex items-center gap-1">
            <ThermometerSun className="w-4 h-4 text-blue-600" />
            {lang === 'te' ? 'వాతావరణ సమాచారం స్వయంగా నమోదు చేయబడింది (మీరు నమోదు చేయాల్సిన అవసరం లేదు)' : 'Climate data auto-fetched from your location — no need to enter these'}
          </p>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-xl p-3 text-center border border-blue-100">
              <ThermometerSun className="w-4 h-4 text-orange-500 mx-auto mb-1" />
              <p className="text-xs text-gray-500 font-semibold">{t('crop.temperature')}</p>
              <p className="text-base font-black text-gray-900">{liveTemp}°C</p>
            </div>
            <div className="bg-white rounded-xl p-3 text-center border border-blue-100">
              <Droplets className="w-4 h-4 text-blue-500 mx-auto mb-1" />
              <p className="text-xs text-gray-500 font-semibold">{t('crop.humidity')}</p>
              <p className="text-base font-black text-gray-900">{liveHumidity}%</p>
            </div>
            <div className="bg-white rounded-xl p-3 text-center border border-blue-100">
              <CloudRain className="w-4 h-4 text-cyan-500 mx-auto mb-1" />
              <p className="text-xs text-gray-500 font-semibold">{t('crop.rainfall')}</p>
              <p className="text-base font-black text-gray-900">
                {lang === 'te' ? 'ప్రాంతీయ సరాసరి' : 'Regional avg.'}
              </p>
            </div>
          </div>
        </div>

        {/* Validation Error */}
        {validationError && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3 animate-fadeIn">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-bold text-red-800">{validationError}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-green-700 to-emerald-600 hover:from-green-600 hover:to-emerald-500 text-white font-black py-4 rounded-2xl shadow-lg shadow-green-900/20 transition-all flex items-center justify-center gap-2 text-base active:scale-98 cursor-pointer"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>{t('crop.analyzing')}</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 text-yellow-300" />
              <span>{t('crop.getRecommendations')}</span>
            </>
          )}
        </button>
      </form>

      {/* Success Toast */}
      {successToast && (
        <div className="bg-emerald-600 text-white p-4 rounded-2xl shadow-xl flex items-center gap-3 animate-fadeIn">
          <CheckCircle2 className="w-6 h-6 text-yellow-300 flex-shrink-0" />
          <span className="font-bold text-sm">{successToast}</span>
        </div>
      )}

      {/* ================================================================ */}
      {/* RESULTS: TOP 3 CROPS                                            */}
      {/* ================================================================ */}
      {result?.recommendations && (
        <div className="space-y-6 animate-fadeIn" ref={resultsRef}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-gray-900">{t('crop.topCrops')}</h2>
              <p className="text-xs text-gray-500">
                {lang === 'te'
                  ? `నేల: N=${formData.nitrogen}, P=${formData.phosphorus}, K=${formData.potassium}, pH=${formData.ph} | వాతావరణం: ${liveTemp}°C, ${liveHumidity}%`
                  : `Soil: N=${formData.nitrogen}, P=${formData.phosphorus}, K=${formData.potassium}, pH=${formData.ph} | Weather: ${liveTemp}°C, ${liveHumidity}%`
                }
              </p>
            </div>
            {/* Global Read Aloud (full summary) */}
            <button
              type="button"
              onClick={() => {
                const summary = result.spokenSummary;
                const txt = typeof summary === 'object' ? (summary[lang] || summary.en) : summary;
                isSpeaking ? stopSpeaking() : speakText(txt);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all shadow-xs flex-shrink-0 ${
                isSpeaking ? 'bg-red-500 text-white animate-pulse' : 'bg-green-700 text-white hover:bg-green-600'
              }`}
            >
              {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              <span>{isSpeaking ? t('app.stopSpeaking') : t('app.speakAloud')}</span>
            </button>
          </div>

          {/* Crop Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {result.recommendations.map((crop, idx) => {
              const isCropSpeaking = speakingCropIdx === idx && isSpeaking;
              const borderClass = idx === 0
                ? 'border-green-400 ring-2 ring-green-200 shadow-md'
                : 'border-gray-200';

              return (
                <div
                  key={crop.nameEn}
                  className={`bg-white rounded-3xl p-6 border ${borderClass} flex flex-col justify-between space-y-4 hover:shadow-lg transition-all`}
                >
                  <div>
                    {/* Rank Badge + Speak Button */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-2xl">{RANK_MEDAL[idx]}</span>
                      <div className="flex items-center gap-2">
                        <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-3 py-1 rounded-full">
                          {crop.suitability}% {t('crop.suitability')}
                        </span>
                        {/* Per-Crop Speak Button */}
                        <button
                          type="button"
                          title={lang === 'te' ? 'వినండి' : 'Listen'}
                          onClick={() => handleSpeakCrop(crop, idx)}
                          className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all ${
                            isCropSpeaking
                              ? 'bg-red-500 text-white animate-pulse'
                              : 'bg-green-100 hover:bg-green-600 text-green-700 hover:text-white'
                          }`}
                        >
                          {isCropSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <h3 className="text-xl font-black text-gray-900">
                      {lang === 'te' ? crop.nameTe : lang === 'hi' ? crop.nameHi : crop.nameEn}
                    </h3>
                    <p className="text-xs text-gray-500 font-medium">{crop.growingDays} {lang === 'te' ? 'రోజుల పంట వ్యవధి' : 'day growing cycle'}</p>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-2 my-4 pt-3 border-t border-gray-100">
                      <div className="bg-gray-50 p-2.5 rounded-xl">
                        <span className="text-[10px] font-bold text-gray-500 uppercase">{t('crop.expectedYield')}</span>
                        <p className="text-sm font-black text-gray-900">{crop.expectedYield} T / acre</p>
                      </div>
                      <div className="bg-emerald-50 p-2.5 rounded-xl">
                        <span className="text-[10px] font-bold text-emerald-700 uppercase">{t('crop.estProfit')}</span>
                        <p className="text-sm font-black text-emerald-800">₹{(crop.netProfit || 0).toLocaleString('en-IN')}</p>
                      </div>
                    </div>

                    {/* Reason */}
                    <p className="text-xs text-gray-600 font-medium leading-relaxed">
                      💡 {crop.reasons?.[lang] || crop.reasons?.en || ''}
                    </p>
                  </div>

                  {/* Select Crop CTA */}
                  <button
                    type="button"
                    onClick={() => handleSelectCrop(crop)}
                    className="w-full bg-green-50 hover:bg-green-600 text-green-800 hover:text-white font-bold py-2.5 rounded-xl text-xs transition-all border border-green-200 flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>{t('crop.selectThisCrop')}</span>
                  </button>
                </div>
              );
            })}
          </div>

          {/* AI Explanation Card for Top Ranked Crop */}
          {result.recommendations[0] && (
            <AIExplanationCard
              what={`${result.recommendations[0][lang === 'te' ? 'nameTe' : 'nameEn']} (${result.recommendations[0].suitability}% Suitability)`}
              why={result.recommendations[0].reasons}
              action={result.recommendations[0].action}
              spokenText={result.spokenSummary?.[lang] || result.spokenSummary?.en || result.spokenSummary}
            />
          )}
        </div>
      )}
    </div>
  );
}
