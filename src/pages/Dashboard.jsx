// src/pages/Dashboard.jsx
// Farmer-First Dynamic Dashboard with Global 2.5-min Auto-Sync, Dynamic Crop Yield & Harvest Estimations

import React, { useState, useEffect } from 'react';
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
  RefreshCw,
} from 'lucide-react';

import { useFarmer, calculateCropYield, calculateHarvestDetails } from '../context/FarmerContext';
import { useVoice } from '../context/VoiceContext';
import marketService from '../services/marketService';

const safeText = (val, lang = 'en', fallback = '') => {
  if (!val) return fallback;
  if (typeof val === 'string' || typeof val === 'number') return String(val);
  if (typeof val === 'object') {
    return val[lang] || val['en'] || val['te'] || val['hi'] || fallback;
  }
  return fallback;
};

const formatSeconds = (sec) => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `0${m}:${s < 10 ? `0${s}` : s}`;
};

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const {
    profile,
    weather,
    syncCountdown,
    lastSyncedTime,
    triggerGlobalSync,
    dashboardState,
    setIsOnboardingOpen,
    clearDiseaseAlert,
  } = useFarmer();

  const { speakText, openVoiceModal } = useVoice();
  const currentLang = i18n.language || 'en';
  const isTelugu = currentLang === 'te';

  const [mandiPrices, setMandiPrices] = useState([]);
  const activeCrop = profile?.activeCrop;
  const farm = profile?.farm;

  // Load APMC Mandi rates
  useEffect(() => {
    async function loadPrices() {
      try {
        const p = await marketService.getMandiPrices();
        if (p && p.length > 0) setMandiPrices(p);
      } catch (e) {}
    }
    loadPrices();
  }, []);

  // Greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return isTelugu ? 'శుభోదయం' : currentLang === 'hi' ? 'సుप्रभात' : 'Good Morning';
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

  // Compute Dynamic Yield from active crop and farm area
  const cropYieldData = calculateCropYield(activeCrop?.cropName, farm?.sizeAcres, profile?.yieldPrediction);
  const harvestDetails = calculateHarvestDetails(activeCrop?.cropName, activeCrop?.cropAgeDays);

  return (
    <div className="space-y-6 animate-fadeIn pb-8">
      {/* 1. TOP GREETING & WEATHER HERO CARD WITH GLOBAL AUTO-SYNC TIMER */}
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

            <p className="text-emerald-100 text-sm font-medium leading-relaxed">
              {getFarmerSummaryText()}
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => speakText(getFarmerSummaryText())}
                className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white text-xs font-bold px-3.5 py-2 rounded-xl backdrop-blur-md transition-all cursor-pointer shadow-xs active:scale-95"
              >
                <Volume2 className="w-3.5 h-3.5 text-yellow-300" />
                <span>{t('app.speakAloud')}</span>
              </button>

              <button
                type="button"
                onClick={openVoiceModal}
                className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white text-xs font-bold px-3.5 py-2 rounded-xl backdrop-blur-md transition-all cursor-pointer shadow-xs active:scale-95"
              >
                <Mic className="w-3.5 h-3.5 text-emerald-300" />
                <span>{t('dashboard.voiceHelp')}</span>
              </button>
            </div>
          </div>

          {/* Right: Weather Card with Active Global 2.5-min Countdown */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/20 flex flex-col justify-between space-y-3 min-w-[280px]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-200 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-300" />
                {profile?.location?.district || 'Pondugula, Mylavaram'}
              </span>
              <div className="flex items-center gap-1 text-[11px] font-mono font-bold bg-emerald-900/60 px-2.5 py-1 rounded-full text-yellow-300">
                <Clock className="w-3 h-3 text-yellow-300" />
                <span>Sync in {formatSeconds(syncCountdown)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <span className="text-3xl sm:text-4xl font-black text-white">
                  {weather?.temperature ?? 32.7}°C
                </span>
                <p className="text-xs text-emerald-200 font-semibold mt-0.5">
                  {safeText(weather?.condition, currentLang, 'Mainly Clear')}
                </p>
              </div>

              <div className="text-right space-y-1 text-xs text-emerald-100">
                <div className="flex items-center justify-end gap-1 font-bold">
                  <Droplets className="w-3.5 h-3.5 text-blue-300" />
                  <span>{weather?.humidity ?? 55}% Humidity</span>
                </div>
                <div className="flex items-center justify-end gap-1 font-bold">
                  <CloudRain className="w-3.5 h-3.5 text-cyan-300" />
                  <span>{weather?.rain_probability ?? 33}% Rain</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 text-[10px] text-emerald-200/80 border-t border-white/10">
              <span>Auto-refreshes every 2.5 min</span>
              <button
                type="button"
                onClick={triggerGlobalSync}
                className="text-yellow-300 font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-2.5 h-2.5" /> Sync now
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. CASE D: DISEASE ALERT BANNER */}
      {dashboardState === 'CASE_D' && profile?.recentDiseaseScan && (
        <div className="bg-gradient-to-r from-red-600 to-rose-700 rounded-3xl p-5 sm:p-6 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-shake">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0 backdrop-blur-md">
              <ShieldAlert className="w-6 h-6 text-yellow-300 animate-pulse" />
            </div>
            <div>
              <span className="text-[11px] font-black tracking-wider uppercase text-red-200 bg-red-900/50 px-2 py-0.5 rounded-full">
                {isTelugu ? '🚨 అత్యవసర వ్యాధి హెచ్చరిక' : '🚨 Urgent Crop Disease Alert'}
              </span>
              <h3 className="text-lg font-black mt-1">
                {isTelugu ? (profile.recentDiseaseScan.diseaseTe || profile.recentDiseaseScan.disease) : profile.recentDiseaseScan.disease}
              </h3>
              <p className="text-xs text-red-100 mt-0.5">
                {profile.recentDiseaseScan.recommendation || (isTelugu ? 'తక్షణ చికిత్స చర్యలు చేపట్టండి.' : 'Immediate treatment recommended.')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Link
              to="/disease-detection"
              className="flex-1 sm:flex-none text-center bg-white text-red-700 font-bold px-4 py-2.5 rounded-xl text-xs shadow-md hover:bg-red-50 transition-colors"
            >
              {isTelugu ? 'చికిత్స చూడండి' : 'View Treatment'}
            </Link>
            <button
              type="button"
              onClick={clearDiseaseAlert}
              className="bg-red-800/60 hover:bg-red-800 text-white font-bold px-3.5 py-2.5 rounded-xl text-xs transition-colors border border-red-400/40 cursor-pointer"
            >
              {isTelugu ? '✓ తొలగించు' : '✓ Dismiss'}
            </button>
          </div>
        </div>
      )}

      {/* 3. 4 KEY FARM STATUS CARDS (DYNAMICALLY COMPUTED) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Active Crop */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-green-100 shadow-xs flex flex-col justify-between hover:border-green-300 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase">{t('dashboard.activeCrop')}</span>
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

        {/* Card 3: Dynamic Yield Forecast */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-green-100 shadow-xs flex flex-col justify-between hover:border-green-300 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase">{t('dashboard.yieldForecast')}</span>
            <div className="w-8 h-8 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-lg sm:text-xl font-black text-gray-900">
              {cropYieldData.totalTonnes} Tonnes
            </p>
            <p className="text-[11px] text-amber-600 font-semibold mt-0.5">
              {isTelugu ? `${cropYieldData.yieldPerAcre} టన్నులు / ఎకరా` : `${cropYieldData.yieldPerAcre} Tonnes / Acre`}
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

      {/* 4. DYNAMIC CROP GROWTH PROGRESS & LIVE IRRIGATION SCHEDULE */}
      {activeCrop?.hasCrop && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Dynamic Crop Progress Bar */}
          <div className="bg-white rounded-3xl p-6 border border-green-100 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Wheat className="w-5 h-5 text-green-600" />
                <h3 className="font-bold text-base text-gray-900">{t('dashboard.cropProgress')}</h3>
              </div>
              <span className="text-xs font-bold bg-green-100 text-green-800 px-3 py-1 rounded-full">
                Day {activeCrop.cropAgeDays || 1} ({safeText(activeCrop.growthStage, currentLang, 'Vegetative')})
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-gray-600">
                <span>{isTelugu ? 'విత్తనం (0వ రోజు)' : 'Sowing (Day 0)'}</span>
                <span>{isTelugu ? `కోత (${harvestDetails.totalCycleDays}వ రోజు)` : `Harvest (Day ${harvestDetails.totalCycleDays})`}</span>
              </div>
              <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden p-0.5 border border-gray-200">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-green-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(3, harvestDetails.progressPercent)}%` }}
                />
              </div>
            </div>

            <p className="text-xs text-gray-600 font-medium">
              {isTelugu
                ? `🌾 అంచనా కోత సమయం: ${harvestDetails.harvestMonth} (~${harvestDetails.remainingDays} రోజులు మిగిలి ఉన్నాయి).`
                : `🌾 Expected harvest: ${harvestDetails.harvestMonth} (~${harvestDetails.remainingDays} days remaining).`}
            </p>
          </div>

          {/* Dynamic Smart Irrigation Schedule (2.5-min Auto-Sync) */}
          <div className="bg-white rounded-3xl p-6 border border-green-100 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Droplets className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-base text-gray-900">{t('dashboard.irrigationStatus')}</h3>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 bg-blue-100 text-blue-800">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {profile?.irrigationPlan
                    ? (isTelugu ? (profile.irrigationPlan.wateringWindowTe || profile.irrigationPlan.wateringWindow) : profile.irrigationPlan.wateringWindow)
                    : (weather?.temperature >= 32
                        ? (isTelugu ? 'రేపు ఉదయం 5:30 - 7:30' : 'Tomorrow 5:30 AM - 7:30 AM')
                        : (isTelugu ? 'రేపు ఉదయం 6:00 - 8:00' : 'Tomorrow 6:00 AM - 8:00 AM'))}
                </span>
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-gray-600">
                <span>{isTelugu ? 'నేల తేమ శాతం' : 'Soil Moisture'}</span>
                <span className="text-blue-700 font-black">
                  {profile?.irrigationPlan?.soilMoisture || 55}% ({isTelugu ? 'మితమైన తేమ' : 'Moderate'})
                </span>
              </div>
              <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden p-0.5 border border-gray-200">
                <div
                  className="bg-gradient-to-r from-blue-400 to-cyan-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, profile?.irrigationPlan?.soilMoisture || 55)}%` }}
                />
              </div>
            </div>

            <p className="text-xs text-gray-600 font-medium leading-relaxed">
              {profile?.irrigationPlan?.recommendation || (
                isTelugu
                  ? `మీ పంటలో నేల తేమ 55% గా ఉంది. ప్రస్తుత ఉష్ణోగ్రత (${weather?.temperature || 32}°C) దృష్ట్యా ఉదయం వేళ ${profile?.irrigationPlan?.waterAmountLiters || 20} లీ/చ.మీ నీరు అందించండి.`
                  : `Soil moisture is at 55%. Based on ${weather?.temperature || 32}°C daytime temperature, apply ${profile?.irrigationPlan?.waterAmountLiters || 20} L/m² in the early morning window.`
              )}
            </p>
          </div>
        </div>
      )}

      {/* 5. QUICK ACTIONS GRID */}
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

      {/* 6. APMC MANDI RATES OVERVIEW */}
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
          {(mandiPrices.length > 0 ? mandiPrices.slice(0, 3) : [
            { crop: 'Paddy (వరి)', market: 'Vijayawada APMC', price_per_quintal: 2320, change_percent: 1.75 },
            { crop: 'Tomato (టమాటో)', market: 'Madanapalle APMC', price_per_quintal: 3800, change_percent: 11.76 },
            { crop: 'Cotton (పత్తి)', market: 'Guntur APMC', price_per_quintal: 7450, change_percent: -0.67 },
          ]).map((item, i) => (
            <div key={i} className="bg-gray-50/70 hover:bg-green-50/50 p-4 rounded-2xl border border-gray-200/70 transition-colors flex items-center justify-between">
              <div>
                <p className="font-bold text-sm text-gray-900">{isTelugu ? (item.crop_te || item.crop) : (item.crop_en || item.crop)}</p>
                <p className="text-[11px] text-gray-500">{item.market}</p>
              </div>
              <div className="text-right">
                <p className="font-black text-base text-emerald-700">₹{(item.price_per_quintal || item.pricePerQuintal || 2320).toLocaleString('en-IN')}</p>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  (item.change_percent >= 0) ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                }`}>
                  {item.change_percent >= 0 ? `+${item.change_percent}% ↑` : `${item.change_percent}% ↓`}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
