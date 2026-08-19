// src/context/FarmerContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../services/api';

const DEFAULT_PROFILE = {
  name: 'Farmer',
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

  // Load live data from FastAPI Backend Dashboard endpoint
  useEffect(() => {
    async function fetchDashboard() {
      setWeatherLoading(true);
      try {
        const lat = profile?.location?.latitude || 16.5062;
        const lon = profile?.location?.longitude || 80.6480;
        const res = await apiClient.get('/dashboard', {
          params: { latitude: lat, longitude: lon },
        });

        if (res.data?.weather) {
          setWeather(res.data.weather);
        }
      } catch (err) {
        console.warn('FastAPI backend dashboard fetch:', err);
      } finally {
        setWeatherLoading(false);
      }
    }
    fetchDashboard();
  }, [profile?.location]);

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
    setProfile((prev) => ({
      ...prev,
      activeCrop: {
        hasCrop: true,
        ...cropData,
      },
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

  // Determine Dashboard Case (A: New Setup, B: Ready for Crop, C: Normal Active, D: Disease Alert, E: Water Due)
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
