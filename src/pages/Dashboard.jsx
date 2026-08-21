// src/pages/Dashboard.jsx
// Farmer-First Dynamic Dashboard adapting to Cases A to E

import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Wheat,
  ScanLine,
  Droplets,
  TrendingUp,
  Store,
  MapPin,
  Sparkles,
  ArrowUpRight,
  CloudRain,
  CheckCircle2,
  Clock,
  Mic,
  ShieldAlert,
  Volume2,
} from 'lucide-react';

import { useFarmer } from '../context/FarmerContext';
import { useVoice } from '../context/VoiceContext';
import { MOCK_MANDI_PRICES } from '../services/mockData';

// Safe text extractor ensuring no raw object is ever rendered as a React child
const safeText = (val, lang = 'en', fallback = '') => {
  if (!val) return fallback;
  if (typeof val === 'string' || typeof val === 'number') return String(val);
  if (typeof val === 'object') {
    return val[lang] || val['en'] || val['te'] || val['hi'] || fallback;
  }
  return fallback;
};

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const { profile, weather, dashboardState, setIsOnboardingOpen, clearDiseaseAlert } = useFarmer();
  const { speakText, openVoiceModal } = useVoice();
  const currentLang = i18n.language || 'en';

  const activeCrop = profile?.activeCrop;
  const farm = profile?.farm;
  const isTelugu = currentLang === 'te';

  // Greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return isTelugu ? 'శుభోదయం' : currentLang === 'hi' ? 'सुप्रभात' : 'Good Morning';
    if (hour < 17) return isTelugu ? 'శుభ మధ్యాహ్నం' : currentLang === 'hi' ? 'शुभ दोपहर' : 'Good Afternoon';
    return isTelugu ? 'శుభ సాయంత్రం' : currentLang === 'hi' ? 'शुभ संध्या' : 'Good Evening';
  };

  // Farmer Personalized Action Summary
  const getFarmerSummaryText = () => {
    if (dashboardState === 'CASE_A') {
      return isTelugu
        ? 'మీ పొలం వివరాలను నమోదు చేయండి. సరైన పంట మరియు నీటిపారుదల సలహాలు పొందండి.'
        : 'Welcome! Complete your 1-minute farm setup to get personalized agriculture guidance.';
    }
    if (dashboardState === 'CASE_B') {
      return isTelugu
        ? 'మీ పొలం తదుపరి పంటకు సిద్ధంగా ఉంది. నేల పరీక్ష లేదా వాతావరణం ఆధారంగా ఉత్తమ పంటను ఎంచుకోండి.'
        : 'Your farm is ready for the next crop. Discover the top profitable crops for your soil.';
    }
    if (dashboardState === 'CASE_D') {
      return isTelugu
        ? 'పంటలో వ్యాధి లక్షణాలు కనిపించాయి. వెంటనే నివారణ మందుల వివరాలు చూడండి.'
        : 'Action Required: Crop disease symptoms detected. Immediate treatment advised.';
    }
    if (dashboardState === 'CASE_E') {
      return isTelugu
        ? 'ఈ రోజు నీరు పెట్టే సమయం. రేపు ఉదయం 6 నుండి 8 గంటల మధ్య నీరు అందించండి.'
        : 'Irrigation Due Today: Recommended early morning watering window (6 AM - 8 AM).';
    }
    const cropNameDisplay = safeText(activeCrop?.cropName, currentLang, 'Crop');
    return isTelugu
      ? `మీ ${cropNameDisplay} ఆరోగ్యంగా ఉంది. తదుపరి నీటిపారుదల 2 రోజుల్లో అవసరం కావచ్చు.`
      : `Your ${cropNameDisplay} is healthy and on track. Next watering scheduled in 2 days.`;
  };

  const weatherConditionText = safeText(
    weather?.condition,
    currentLang,
    isTelugu ? 'పాక్షికంగా మేఘావృతం' : 'Partly Cloudy'
  );

  const rainProbability =
    weather?.rain_probability ?? weather?.rainProbabilityPercent ?? 20;

  return (
    <div className="space-y-6 animate-fadeIn pb-8">
      {/* ==================================================================== */}
      {/* 1. TOP GREETING & WEATHER HERO CARD                                   */}
      {/* ==================================================================== */}
      <div className="bg-gradient-to-br from-[#114b27] via-[#166534] to-[#047857] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          {/* Left: Greeting & Personalized Action */}
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2 text-emerald-200 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span>{t('app.name')} AI Assistant</span>
              <span>•</span>
              <span>
                {new Date().toLocaleDateString(isTelugu ? 'te-IN' : 'en-IN', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'short',
                })}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {getGreeting()}, {safeText(profile?.name, currentLang, 'Raju')} 👋
            </h1>

            <p className="text-sm sm:text-base text-green-100 font-medium leading-relaxed">
              {getFarmerSummaryText()}
            </p>

            {/* Read Aloud Voice Button */}
            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => speakText(getFarmerSummaryText())}
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs backdrop-blur-md active:scale-95 cursor-pointer"
              >
                <Volume2 className="w-4 h-4 text-yellow-300" />
                <span>{t('app.speakAloud')}</span>
              </button>

              <button
                type="button"
                onClick={openVoiceModal}
                className="flex items-center gap-1.5 text-xs font-bold text-emerald-200 hover:text-white transition-colors cursor-pointer"
              >
                <Mic className="w-3.5 h-3.5 animate-pulse" />
                <span>{t('dashboard.voiceHelp')}</span>
              </button>
            </div>
          </div>

          {/* Right: Live Weather Widget */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 sm:p-5 flex-shrink-0 text-white min-w-[260px]">
            <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-green-200">
                <MapPin className="w-3.5 h-3.5 text-emerald-300" />
                <span className="truncate max-w-[150px]">
                  {safeText(profile?.location?.addressString, currentLang, 'Vijayawada').split(',')[0]}
                </span>
              </div>
              <span className="text-[11px] bg-emerald-400/30 text-emerald-200 font-bold px-2 py-0.5 rounded-md">
                Live
              </span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-3xl sm:text-4xl font-black">{weather?.temperature ?? 31}°C</div>
                <p className="text-xs text-green-200 mt-0.5">{weatherConditionText}</p>
              </div>
              <div className="text-right text-xs space-y-1 text-green-100">
                <p className="flex items-center justify-end gap-1">
                  <Droplets className="w-3.5 h-3.5 text-blue-300" /> {weather?.humidity ?? 72}%
                </p>
                <p className="flex items-center justify-end gap-1">
                  <CloudRain className="w-3.5 h-3.5 text-cyan-300" /> {rainProbability}% Rain
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. DYNAMIC CASE ALERTS (CASE D: DISEASE, CASE E: IRRIGATION DUE)      */}
      {/* ==================================================================== */}
      {dashboardState === 'CASE_A' && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-5 text-white shadow-md flex flex-col sm:flex-row items-center justify-between gap-4 animate-fadeIn">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white flex-shrink-0">
              <Sparkles className="w-7 h-7 text-yellow-200" />
            </div>
            <div>
              <h3 className="font-bold text-base">{t('dashboard.newFarmerTitle')}</h3>
              <p className="text-xs text-amber-100">{t('dashboard.newFarmerSubtitle')}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsOnboardingOpen(true)}
            className="w-full sm:w-auto bg-white text-orange-700 hover:bg-orange-50 font-bold px-6 py-2.5 rounded-xl text-sm shadow-md transition-all flex-shrink-0 cursor-pointer"
          >
            {t('dashboard.setupFarm')}
          </button>
        </div>
      )}

      {dashboardState === 'CASE_B' && (
        <div className="bg-gradient-to-r from-emerald-600 to-green-600 rounded-2xl p-5 text-white shadow-md flex flex-col sm:flex-row items-center justify-between gap-4 animate-fadeIn">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white flex-shrink-0">
              <Wheat className="w-7 h-7 text-yellow-300" />
            </div>
            <div>
              <h3 className="font-bold text-base">{t('dashboard.noCropTitle')}</h3>
              <p className="text-xs text-green-100">{t('dashboard.noCropSubtitle')}</p>
            </div>
          </div>
          <Link
            to="/crop-recommendation"
            className="w-full sm:w-auto bg-white text-green-800 hover:bg-green-50 font-bold px-6 py-2.5 rounded-xl text-sm shadow-md transition-all text-center flex-shrink-0"
          >
            {t('dashboard.getRecommendation')}
          </Link>
        </div>
      )}

      {dashboardState === 'CASE_D' && (
        <div className="bg-gradient-to-r from-red-600 to-rose-600 rounded-2xl p-5 text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white flex-shrink-0">
              <ShieldAlert className="w-7 h-7 text-yellow-300" />
            </div>
            <div>
              <h3 className="font-bold text-base">
                {isTelugu
                  ? `శ్రద్ధ అవసరం: ${profile?.recentDiseaseScan?.diseaseTe || profile?.recentDiseaseScan?.disease || 'పంట తెగులు'} గుర్తించబడింది`
                  : `Action Needed: ${profile?.recentDiseaseScan?.disease || 'Crop Disease'} Detected`}
              </h3>
              <p className="text-xs text-red-100 mt-0.5">
                {isTelugu
                  ? 'సకాలంలో పిచికారీ చేయడం వల్ల పంట నష్టం తగ్గుతుంది. వెంటనే నివారణ మందులు చూడండి.'
                  : 'Early treatment prevents crop damage. Check the recommended spray remedy immediately.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Link
              to="/disease-detection"
              className="flex-1 sm:flex-none bg-white text-red-700 hover:bg-red-50 font-bold px-5 py-2.5 rounded-xl text-xs shadow-md transition-all text-center"
            >
              {isTelugu ? 'నివారణ చూడండి' : 'View Remedy'}
            </Link>
            <button
              type="button"
              onClick={clearDiseaseAlert}
              className="bg-red-800/60 hover:bg-red-800 text-white font-bold px-3.5 py-2.5 rounded-xl text-xs transition-colors border border-red-400/40 cursor-pointer"
              title="Mark as treated / Dismiss alert"
            >
              {isTelugu ? '✓ తొలగించు' : '✓ Dismiss'}
            </button>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 3. 4 KEY FARM STATUS CARDS                                            */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Active Crop */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-green-100 shadow-xs flex flex-col justify-between hover:border-green-300 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase">{t('dashboard.activeCrops')}</span>
            <div className="w-8 h-8 bg-green-100 text-green-700 rounded-xl flex items-center justify-center">
              <Wheat className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-lg sm:text-xl font-black text-gray-900 truncate">
              {activeCrop?.hasCrop ? safeText(activeCrop.cropName, currentLang, 'Paddy') : (isTelugu ? 'పంట లేదు' : 'No Crop')}
            </p>
            <p className="text-[11px] text-green-600 font-semibold mt-0.5 truncate">
              {activeCrop?.hasCrop ? safeText(activeCrop.growthStage, currentLang, 'Vegetative Stage') : (isTelugu ? 'సిఫార్సు చూడండి' : 'Ready for next')}
            </p>
          </div>
        </div>

        {/* Card 2: Crop Health */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-green-100 shadow-xs flex flex-col justify-between hover:border-green-300 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase">{t('dashboard.cropHealth')}</span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              dashboardState === 'CASE_D' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
            }`}>
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className={`text-lg sm:text-xl font-black truncate ${
              dashboardState === 'CASE_D' ? 'text-red-600' : 'text-emerald-700'
            }`}>
              {dashboardState === 'CASE_D' ? (isTelugu ? 'శ్రద్ధ అవసరం' : 'Action Needed') : (isTelugu ? 'ఆరోగ్యంగా ఉంది' : 'Healthy')}
            </p>
            <p className="text-[11px] text-gray-500 font-semibold mt-0.5 truncate">
              {dashboardState === 'CASE_D'
                ? (isTelugu ? (profile?.recentDiseaseScan?.diseaseTe || profile?.recentDiseaseScan?.disease || 'తెగులు ఉంది') : (profile?.recentDiseaseScan?.disease || 'Disease Detected'))
                : (isTelugu ? 'తెగుళ్లు లేవు' : 'No disease')}
            </p>
          </div>
        </div>

        {/* Card 3: Yield Forecast */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-green-100 shadow-xs flex flex-col justify-between hover:border-green-300 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase">{t('dashboard.yieldForecast')}</span>
            <div className="w-8 h-8 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-lg sm:text-xl font-black text-gray-900">
              {activeCrop?.hasCrop ? '11.9 Tonnes' : '12.0 Tonnes'}
            </p>
            <p className="text-[11px] text-amber-600 font-semibold mt-0.5">
              {isTelugu ? '3.4 టన్నులు / ఎకరా' : '3.4 Tonnes / Acre'}
            </p>
          </div>
        </div>

        {/* Card 4: Farm Area */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-green-100 shadow-xs flex flex-col justify-between hover:border-green-300 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase">{t('dashboard.farmArea')}</span>
            <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-lg sm:text-xl font-black text-gray-900">
              {farm?.sizeAcres || 3.5} {t('common.acres')}
            </p>
            <p className="text-[11px] text-blue-600 font-semibold mt-0.5 truncate">
              {safeText(farm?.irrigationType, currentLang, 'Drip & Borewell')}
            </p>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 4. CROP GROWTH PROGRESS & IRRIGATION TIMELINE                         */}
      {/* ==================================================================== */}
      {activeCrop?.hasCrop && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="bg-white rounded-3xl p-6 border border-green-100 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Wheat className="w-5 h-5 text-green-600" />
                <h3 className="font-bold text-base text-gray-900">{t('dashboard.cropProgress')}</h3>
              </div>
              <span className="text-xs font-bold bg-green-100 text-green-800 px-3 py-1 rounded-full">
                {activeCrop.cropAgeDays || 30} {t('common.days')} ({safeText(activeCrop.growthStage, currentLang, 'Vegetative')})
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-gray-600">
                <span>{isTelugu ? 'విత్తనం (0వ రోజు)' : 'Sowing (Day 0)'}</span>
                <span>{isTelugu ? 'కోత (135వ రోజు)' : 'Harvest (Day 135)'}</span>
              </div>
              <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden p-0.5 border border-gray-200">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-green-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.round(((activeCrop.cropAgeDays || 30) / 135) * 100))}%` }}
                />
              </div>
            </div>

            <p className="text-xs text-gray-600 font-medium">
              {isTelugu
                ? '🌾 అంచనా కోత తేదీ: డిసెంబర్ 05, 2026 (~105 రోజులు మిగిలి ఉన్నాయి).'
                : '🌾 Expected harvest window: Dec 05, 2026 (~105 days remaining).'}
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-green-100 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Droplets className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-base text-gray-900">{t('dashboard.irrigationStatus')}</h3>
              </div>
              <span className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 ${
                (weather?.rain_probability > 40)
                  ? 'bg-cyan-100 text-cyan-800'
                  : (profile?.irrigationPlan?.soilMoisture && profile.irrigationPlan.soilMoisture < 40)
                  ? 'bg-amber-100 text-amber-800 animate-pulse'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {profile?.irrigationPlan
                    ? (isTelugu ? (profile.irrigationPlan.wateringWindowTe || profile.irrigationPlan.wateringWindow) : profile.irrigationPlan.wateringWindow)
                    : (weather?.rain_probability > 40
                        ? (isTelugu ? 'వర్షం వచ్చే అవకాశం ఉంది' : 'Rain Expected Today')
                        : (isTelugu ? 'రేపు ఉదయం 6:00 AM' : 'Tomorrow 6:00 AM'))}
                </span>
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-gray-600">
                <span>{isTelugu ? 'నేల తేమ శాతం' : 'Soil Moisture'}</span>
                <span className="text-blue-700 font-black">
                  {profile?.irrigationPlan?.soilMoisture || 68}% (
                  {((profile?.irrigationPlan?.soilMoisture || 68) >= 65)
                    ? (isTelugu ? 'సమృద్ధిగా ఉంది' : 'Adequate')
                    : ((profile?.irrigationPlan?.soilMoisture || 68) >= 40)
                    ? (isTelugu ? 'మితంగా ఉంది' : 'Moderate')
                    : (isTelugu ? 'వెంటనే నీరు అవసరం' : 'Dry - Water Soon')}
                  )
                </span>
              </div>
              <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden p-0.5 border border-gray-200">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    (profile?.irrigationPlan?.soilMoisture || 68) < 40
                      ? 'bg-gradient-to-r from-amber-400 to-red-500'
                      : 'bg-gradient-to-r from-blue-400 to-cyan-500'
                  }`}
                  style={{ width: `${Math.min(100, profile?.irrigationPlan?.soilMoisture || 68)}%` }}
                />
              </div>
            </div>

            <p className="text-xs text-gray-600 font-medium leading-relaxed">
              {profile?.irrigationPlan?.recommendation || (
                isTelugu
                  ? `💧 సిఫార్సు: ${safeText(activeCrop?.cropName, currentLang, 'వరి')} పంటకు వచ్చే 48 గంటల్లో వర్ష సూచనను బట్టి ఉదయం వేళ ${profile?.irrigationPlan?.waterAmountLiters || 20} లీ/చ.మీ నీరు అందించండి.`
                  : `💧 Recommendation: For ${safeText(activeCrop?.cropName, currentLang, 'Paddy')} in ${safeText(activeCrop?.growthStage, currentLang, 'Vegetative stage')}, apply ${profile?.irrigationPlan?.waterAmountLiters || 20} L/m² in the early morning window.`
              )}
            </p>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 5. QUICK ACTIONS GRID                                                */}
      {/* ==================================================================== */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-3">{t('dashboard.quickActions')}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <Link
            to="/disease-detection"
            className="group bg-white hover:bg-emerald-50/70 border border-green-100 hover:border-emerald-300 rounded-3xl p-5 shadow-xs transition-all flex flex-col items-center text-center space-y-2 hover:-translate-y-0.5"
          >
            <div className="w-12 h-12 bg-emerald-100 group-hover:bg-emerald-600 text-emerald-700 group-hover:text-white rounded-2xl flex items-center justify-center transition-colors shadow-xs">
              <ScanLine className="w-6 h-6" />
            </div>
            <span className="font-bold text-sm text-gray-900">{t('dashboard.scanLeaf')}</span>
            <p className="text-[11px] text-gray-500 font-medium">{isTelugu ? 'వ్యాధులు గుర్తించండి' : 'Detect disease'}</p>
          </Link>

          <Link
            to="/crop-recommendation"
            className="group bg-white hover:bg-green-50/70 border border-green-100 hover:border-green-300 rounded-3xl p-5 shadow-xs transition-all flex flex-col items-center text-center space-y-2 hover:-translate-y-0.5"
          >
            <div className="w-12 h-12 bg-green-100 group-hover:bg-green-600 text-green-700 group-hover:text-white rounded-2xl flex items-center justify-center transition-colors shadow-xs">
              <Wheat className="w-6 h-6" />
            </div>
            <span className="font-bold text-sm text-gray-900">{t('dashboard.recommendCrop')}</span>
            <p className="text-[11px] text-gray-500 font-medium">{isTelugu ? 'లాభదాయక పంటలు' : 'Best crops'}</p>
          </Link>

          <Link
            to="/irrigation"
            className="group bg-white hover:bg-blue-50/70 border border-blue-100 hover:border-blue-300 rounded-3xl p-5 shadow-xs transition-all flex flex-col items-center text-center space-y-2 hover:-translate-y-0.5"
          >
            <div className="w-12 h-12 bg-blue-100 group-hover:bg-blue-600 text-blue-700 group-hover:text-white rounded-2xl flex items-center justify-center transition-colors shadow-xs">
              <Droplets className="w-6 h-6" />
            </div>
            <span className="font-bold text-sm text-gray-900">{t('dashboard.checkWater')}</span>
            <p className="text-[11px] text-gray-500 font-medium">{isTelugu ? 'నీటి షెడ్యూల్' : 'When to water'}</p>
          </Link>

          <button
            type="button"
            onClick={openVoiceModal}
            className="group bg-gradient-to-tr from-emerald-600 to-green-500 text-white rounded-3xl p-5 shadow-md hover:shadow-lg transition-all flex flex-col items-center text-center space-y-2 hover:-translate-y-0.5 cursor-pointer"
          >
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white shadow-xs">
              <Mic className="w-6 h-6 animate-pulse" />
            </div>
            <span className="font-bold text-sm">{t('dashboard.voiceHelp')}</span>
            <p className="text-[11px] text-green-100 font-medium">{isTelugu ? 'నోటితో అడగండి' : 'Ask anything'}</p>
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 6. APMC MANDI RATES OVERVIEW                                         */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-3xl p-6 border border-green-100 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-emerald-700" />
            <h3 className="font-bold text-base text-gray-900">{t('dashboard.marketToday')}</h3>
          </div>
          <Link to="/market-profit" className="text-xs font-bold text-green-700 hover:underline flex items-center gap-1">
            {isTelugu ? 'అన్ని ధరలు' : 'View All'} <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {MOCK_MANDI_PRICES.slice(0, 3).map((item, i) => (
            <div key={i} className="bg-gray-50/70 hover:bg-green-50/50 p-4 rounded-2xl border border-gray-200/70 transition-colors flex items-center justify-between">
              <div>
                <p className="font-bold text-sm text-gray-900">{isTelugu ? item.cropTe : item.crop}</p>
                <p className="text-[11px] text-gray-500">{isTelugu ? item.marketTe : item.market}</p>
              </div>
              <div className="text-right">
                <p className="font-black text-base text-emerald-700">₹{item.pricePerQuintal.toLocaleString('en-IN')}</p>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                  +{item.changePercent}% ↑
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
