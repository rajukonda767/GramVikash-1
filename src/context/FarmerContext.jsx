// src/context/FarmerContext.jsx
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import apiClient from '../services/api';

const AUTO_SYNC_INTERVAL_SECONDS = 150; // 2.5 minutes global auto-refresh

export const CROP_YIELD_BENCHMARKS = {
  jute: { yieldPerAcre: 2.2, totalCycleDays: 120, nameEn: 'Jute', nameTe: 'జనపనార' },
  rice: { yieldPerAcre: 3.4, totalCycleDays: 130, nameEn: 'Paddy / Rice', nameTe: 'వరి ధాన్యం' },
  paddy: { yieldPerAcre: 3.4, totalCycleDays: 130, nameEn: 'Paddy / Rice', nameTe: 'వరి ధాన్యం' },
  cotton: { yieldPerAcre: 1.6, totalCycleDays: 160, nameEn: 'Cotton', nameTe: 'పత్తి' },
  maize: { yieldPerAcre: 3.8, totalCycleDays: 105, nameEn: 'Maize', nameTe: 'మొక్కజొన్న' },
  tomato: { yieldPerAcre: 12.0, totalCycleDays: 90, nameEn: 'Tomato', nameTe: 'టమాటో' },
  chilli: { yieldPerAcre: 2.5, totalCycleDays: 150, nameEn: 'Chilli', nameTe: 'మిరప' },
  banana: { yieldPerAcre: 22.0, totalCycleDays: 330, nameEn: 'Banana', nameTe: 'అరటి' },
  groundnut: { yieldPerAcre: 1.4, totalCycleDays: 110, nameEn: 'Groundnut', nameTe: 'వేరుశనగ' },
  blackgram: { yieldPerAcre: 0.8, totalCycleDays: 75, nameEn: 'Black Gram (Urad)', nameTe: 'మినుములు' },
  urad: { yieldPerAcre: 0.8, totalCycleDays: 75, nameEn: 'Black Gram (Urad)', nameTe: 'మినుములు' },
  greengram: { yieldPerAcre: 0.75, totalCycleDays: 70, nameEn: 'Green Gram (Moong)', nameTe: 'పెసలు' },
  moong: { yieldPerAcre: 0.75, totalCycleDays: 70, nameEn: 'Green Gram (Moong)', nameTe: 'పెసలు' },
  chickpea: { yieldPerAcre: 1.1, totalCycleDays: 100, nameEn: 'Chickpea (Chana)', nameTe: 'శనగలు' },
  turmeric: { yieldPerAcre: 2.8, totalCycleDays: 240, nameEn: 'Turmeric', nameTe: 'పసుపు' },
  sugarcane: { yieldPerAcre: 38.0, totalCycleDays: 365, nameEn: 'Sugarcane', nameTe: 'చెరకు' },
  mango: { yieldPerAcre: 8.0, totalCycleDays: 365, nameEn: 'Mango', nameTe: 'మామిడి' },
  papaya: { yieldPerAcre: 25.0, totalCycleDays: 270, nameEn: 'Papaya', nameTe: 'బొప్పాయి' },
  watermelon: { yieldPerAcre: 18.0, totalCycleDays: 90, nameEn: 'Watermelon', nameTe: 'పుచ్చకాయ' },
  onion: { yieldPerAcre: 8.5, totalCycleDays: 120, nameEn: 'Onion', nameTe: 'ఉల్లిపాయ' },
  wheat: { yieldPerAcre: 2.2, totalCycleDays: 120, nameEn: 'Wheat', nameTe: 'గోధుమ' },
};

export function calculateCropYield(cropName, sizeAcres = 3.5, savedYieldPrediction = null) {
  if (savedYieldPrediction && savedYieldPrediction.totalTonnes) {
    return {
      totalTonnes: parseFloat(savedYieldPrediction.totalTonnes),
      yieldPerAcre: parseFloat(savedYieldPrediction.yieldPerAcre),
    };
  }

  const area = parseFloat(sizeAcres) || 3.5;
  const name = String(cropName || 'Paddy').toLowerCase();

  let yieldPerAcre = 3.4; // Default Paddy

  if (name.includes('jute') || name.includes('జనపనార')) yieldPerAcre = 2.2;
  else if (name.includes('cotton') || name.includes('పత్తి') || name.includes('కపాస్')) yieldPerAcre = 1.6;
  else if (name.includes('maize') || name.includes('మొక్కజొన్న') || name.includes('మక్కా')) yieldPerAcre = 3.8;
  else if (name.includes('tomato') || name.includes('టమాటో') || name.includes('టమాట')) yieldPerAcre = 12.0;
  else if (name.includes('banana') || name.includes('అరటి') || name.includes('కేలా')) yieldPerAcre = 22.0;
  else if (name.includes('chilli') || name.includes('మిరప') || name.includes('మిర్చి')) yieldPerAcre = 2.5;
  else if (name.includes('groundnut') || name.includes('వేరుశనగ') || name.includes('మూంగఫలీ')) yieldPerAcre = 1.4;
  else if (name.includes('sugarcane') || name.includes('చెరకు') || name.includes('గన్నా')) yieldPerAcre = 38.0;
  else if (name.includes('blackgram') || name.includes('urad') || name.includes('మినుములు')) yieldPerAcre = 0.8;
  else if (name.includes('greengram') || name.includes('moong') || name.includes('పెసలు')) yieldPerAcre = 0.75;
  else if (name.includes('chickpea') || name.includes('chana') || name.includes('శనగలు')) yieldPerAcre = 1.1;
  else if (name.includes('turmeric') || name.includes('పసుపు') || name.includes('హల్దీ')) yieldPerAcre = 2.8;
  else if (name.includes('mango') || name.includes('మామిడి') || name.includes('ఆమ్')) yieldPerAcre = 8.0;
  else if (name.includes('papaya') || name.includes('బొప్పాయి') || name.includes('పపీతా')) yieldPerAcre = 25.0;
  else if (name.includes('watermelon') || name.includes('పుచ్చకాయ')) yieldPerAcre = 18.0;
  else if (name.includes('onion') || name.includes('ఉల్లిపాయ') || name.includes('ప్యాజ్')) yieldPerAcre = 8.5;
  else if (name.includes('wheat') || name.includes('గోధుమ')) yieldPerAcre = 2.2;
  else if (name.includes('paddy') || name.includes('rice') || name.includes('వరి') || name.includes('ధాన్యం')) yieldPerAcre = 3.4;

  const totalTonnes = Math.round(area * yieldPerAcre * 10) / 10;
  return {
    totalTonnes,
    yieldPerAcre,
  };
}

export function calculateHarvestDetails(cropName, cropAgeDays = 30) {
  const name = String(cropName || 'Paddy').toLowerCase();
  let totalCycleDays = 130;

  if (name.includes('jute') || name.includes('జనపనార')) totalCycleDays = 120;
  else if (name.includes('cotton') || name.includes('పత్తి')) totalCycleDays = 160;
  else if (name.includes('maize') || name.includes('మొక్కజొన్న')) totalCycleDays = 105;
  else if (name.includes('tomato') || name.includes('టమాటో')) totalCycleDays = 90;
  else if (name.includes('banana') || name.includes('అరటి')) totalCycleDays = 330;
  else if (name.includes('chilli') || name.includes('మిరప')) totalCycleDays = 150;
  else if (name.includes('groundnut') || name.includes('వేరుశనగ')) totalCycleDays = 110;
  else if (name.includes('blackgram') || name.includes('greengram') || name.includes('మినుములు') || name.includes('పెసలు')) totalCycleDays = 75;
  else if (name.includes('sugarcane') || name.includes('చెరకు')) totalCycleDays = 365;

  const age = Math.max(1, parseInt(cropAgeDays) || 1);
  const remainingDays = Math.max(0, totalCycleDays - age);
  const progressPercent = Math.min(100, Math.round((age / totalCycleDays) * 100));

  const harvestDate = new Date();
  harvestDate.setDate(harvestDate.getDate() + remainingDays);
  const harvestMonth = harvestDate.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return {
    totalCycleDays,
    remainingDays,
    progressPercent,
    harvestMonth,
  };
}

const DEFAULT_PROFILE = {
  name: 'Farmer Raju',
  phone: '9390616956',
  preferred_language: 'te',
  hasCompletedOnboarding: false,
  location: {
    latitude: 16.5062,
    longitude: 80.6480,
    addressString: 'Vijayawada, Andhra Pradesh',
    state: 'Andhra Pradesh',
    district: 'NTR District',
  },
  farm: {
    farmName: "Farmer's Smart Farm",
    sizeAcres: 3.5,
    soilType: 'Alluvial Soil (ఒండ్రు నేల)',
    irrigationType: 'Drip & Borewell (డ్రిప్)',
  },
  activeCrop: {
    hasCrop: false,
    cropName: '',
    variety: '',
    growthStage: '',
    cropAgeDays: 0,
    healthStatus: 'Healthy',
  },
  recentDiseaseScan: null,
  recentActivities: [],
  irrigationPlan: null,
  yieldPrediction: null,
};

const FarmerContext = createContext();

export function FarmerProvider({ children }) {
  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('gramvikas_farmer_profile');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {}
    return DEFAULT_PROFILE;
  });

  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [syncCountdown, setSyncCountdown] = useState(AUTO_SYNC_INTERVAL_SECONDS);
  const [lastSyncedTime, setLastSyncedTime] = useState('');
  const syncTimerRef = useRef(null);

  // Check on mount if user needs onboarding
  useEffect(() => {
    const isLoggedIn = localStorage.getItem('gramvikas_logged_in') === 'true';
    if (isLoggedIn && !profile?.hasCompletedOnboarding) {
      setIsOnboardingOpen(true);
    }
  }, [profile?.hasCompletedOnboarding]);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('gramvikas_farmer_profile', JSON.stringify(profile));
    } catch (e) {
      console.warn('Storage save failed:', e);
    }
  }, [profile]);

  // Function to re-calculate irrigation plan dynamically based on live weather
  const recalculateIrrigationDynamically = (currentWeather, currentProfile) => {
    const temp = currentWeather?.temperature || 30;
    const isRice = String(currentProfile?.activeCrop?.cropName || '').toLowerCase().includes('rice') ||
                   String(currentProfile?.activeCrop?.cropName || '').toLowerCase().includes('paddy') ||
                   String(currentProfile?.activeCrop?.cropName || '').toLowerCase().includes('వరి');

    const optimalMoisture = isRice ? 70 : 55;
    const baseMoisture = currentProfile?.irrigationPlan?.soilMoisture || 55;
    
    // Evapotranspiration dynamic rate based on live daytime temp
    const etDailyRate = temp >= 32 ? 4.5 : 3.5;
    const daysSince = currentProfile?.irrigationPlan?.daysSinceLast || 2;
    const calculatedMoisture = Math.max(25, Math.round(baseMoisture - (daysSince * (etDailyRate * 0.2))));

    let urgency = 'moderate';
    let waterAmountLiters = isRice ? 25 : 18;
    let timingEn = 'Tomorrow 6:00 AM - 8:00 AM';
    let timingTe = 'రేపు ఉదయం 6:00 నుండి 8:00 వరకు';

    if (temp >= 32) {
      timingEn = 'Tomorrow 5:30 AM - 7:30 AM (Early Morning)';
      timingTe = 'రేపు ఉదయం 5:30 నుండి 7:30 వరకు (ఎండ పెరగకముందే)';
    }

    if (calculatedMoisture < optimalMoisture * 0.6) {
      urgency = 'critical';
      waterAmountLiters = isRice ? 30 : 22;
      timingEn = 'Irrigate Today Immediately';
      timingTe = 'ఈరోజే తక్షణమే నీరు అందించండి';
    } else if (calculatedMoisture >= optimalMoisture) {
      urgency = 'low';
      waterAmountLiters = 0;
      timingEn = 'Adequate Moisture (No irrigation needed today)';
      timingTe = 'తేమ సమృద్ధిగా ఉంది (ఈరోజు నీరు పెట్టాల్సిన అవసరం లేదు)';
    }

    const cropDisplayName = currentProfile?.activeCrop?.cropName || 'వరి';
    const lang = currentProfile?.preferred_language || 'te';

    return {
      soilMoisture: calculatedMoisture,
      urgency,
      waterAmountLiters,
      wateringWindow: timingEn,
      wateringWindowTe: timingTe,
      recommendation: lang === 'te'
        ? `మీ ${cropDisplayName} పంటలో నేల తేమ ${calculatedMoisture}% గా ఉంది. ${timingTe}. సిఫార్సు చేసిన నీటి పరిమాణం చదరపు మీటరుకు ${waterAmountLiters} లీటర్లు.`
        : `Soil moisture for ${cropDisplayName} is at ${calculatedMoisture}%. ${timingEn}. Recommended dosage: ${waterAmountLiters} L/m².`,
      calculatedAt: new Date().toISOString(),
      syncedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };
  };

  // Global Weather & Irrigation Fetch and Update
  const refreshWeatherAndIrrigation = async () => {
    try {
      const lat = profile?.location?.latitude || 16.5062;
      const lon = profile?.location?.longitude || 80.6480;
      const res = await apiClient.get('/dashboard', {
        params: { latitude: lat, longitude: lon },
      });

      if (res.data?.weather) {
        setWeather(res.data.weather);
        
        // Dynamically update irrigation schedule with new weather
        const updatedIrrigation = recalculateIrrigationDynamically(res.data.weather, profile);
        setProfile((prev) => ({
          ...prev,
          irrigationPlan: updatedIrrigation,
        }));

        setLastSyncedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        return res.data.weather;
      }
    } catch (err) {
      console.warn('Global live weather sync error:', err);
    }
    return null;
  };

  // Initial fetch on mount
  useEffect(() => {
    async function initFetch() {
      setWeatherLoading(true);
      await refreshWeatherAndIrrigation();
      setWeatherLoading(false);
    }
    initFetch();
  }, [profile?.location]);

  // CONTINUOUS 2.5-MINUTE GLOBAL AUTO-REFRESH TIMER
  useEffect(() => {
    syncTimerRef.current = setInterval(() => {
      setSyncCountdown((prev) => {
        if (prev <= 1) {
          refreshWeatherAndIrrigation();
          return AUTO_SYNC_INTERVAL_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (syncTimerRef.current) clearInterval(syncTimerRef.current);
    };
  }, [profile?.activeCrop, profile?.farm]);

  const updateProfile = (updatedFields) => {
    setProfile((prev) => ({ ...prev, ...updatedFields }));
  };

  const updateFarm = async (farmData) => {
    setProfile((prev) => ({
      ...prev,
      hasCompletedOnboarding: true,
      farm: { ...prev.farm, ...farmData },
    }));

    // Sync to backend Supabase table
    try {
      await apiClient.post('/farmer/farm/setup', {
        farm_name: farmData.farmName || profile?.farm?.farmName || "Farmer's Farm",
        area: parseFloat(farmData.sizeAcres || profile?.farm?.sizeAcres || 3.5),
        soil_type: farmData.soilType || profile?.farm?.soilType || 'Alluvial Soil',
        irrigation_method: farmData.irrigationType || profile?.farm?.irrigationType || 'Drip & Borewell',
        latitude: profile?.location?.latitude || 16.5062,
        longitude: profile?.location?.longitude || 80.6480,
        location_name: profile?.location?.addressString || 'Vijayawada, Andhra Pradesh',
        has_crop: profile?.activeCrop?.hasCrop || false,
        crop_name: profile?.activeCrop?.cropName || null,
      });
    } catch (e) {
      console.warn('Backend farm setup sync failed:', e);
    }
  };

  const setActiveCrop = (cropData) => {
    const cropName = cropData?.cropName || 'Paddy';
    const currentArea = profile?.farm?.sizeAcres || 3.5;
    const dynamicYield = calculateCropYield(cropName, currentArea);

    setProfile((prev) => ({
      ...prev,
      activeCrop: {
        hasCrop: true,
        ...cropData,
      },
      yieldPrediction: {
        totalTonnes: dynamicYield.totalTonnes,
        yieldPerAcre: dynamicYield.yieldPerAcre,
        crop: cropName,
      }
    }));
  };

  const clearActiveCrop = () => {
    setProfile((prev) => ({
      ...prev,
      activeCrop: {
        hasCrop: false,
        cropName: '',
        growthStage: '',
      },
    }));
  };

  const setRecentDiseaseScan = (scanData) => {
    setProfile((prev) => ({
      ...prev,
      recentDiseaseScan: scanData,
    }));
  };

  const clearDiseaseAlert = () => {
    setProfile((prev) => ({
      ...prev,
      recentDiseaseScan: null,
    }));
  };

  const addActivity = (activity) => {
    setProfile((prev) => ({
      ...prev,
      recentActivities: [
        {
          id: `act_${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          ...activity,
        },
        ...(prev.recentActivities || []),
      ].slice(0, 10),
    }));
  };

  const getDashboardState = () => {
    if (!profile?.hasCompletedOnboarding || !profile?.farm?.sizeAcres) return 'CASE_A';
    if (!profile?.activeCrop?.hasCrop) return 'CASE_B';
    if (profile?.recentDiseaseScan && profile.recentDiseaseScan.severity !== 'healthy') return 'CASE_D';
    if (profile?.activeCrop?.irrigationStatus === 'due_today') return 'CASE_E';
    return 'CASE_C';
  };

  return (
    <FarmerContext.Provider
      value={{
        profile,
        weather,
        weatherLoading,
        syncCountdown,
        lastSyncedTime,
        dashboardState: getDashboardState(),
        isOnboardingOpen,
        setIsOnboardingOpen,
        updateProfile,
        updateFarm,
        setActiveCrop,
        clearActiveCrop,
        setRecentDiseaseScan,
        clearDiseaseAlert,
        addActivity,
        refreshWeather: refreshWeatherAndIrrigation,
        triggerGlobalSync: refreshWeatherAndIrrigation,
      }}
    >
      {children}
    </FarmerContext.Provider>
  );
}

export function useFarmer() {
  const context = useContext(FarmerContext);
  if (!context) {
    throw new Error('useFarmer must be used within a FarmerProvider');
  }
  return context;
}
