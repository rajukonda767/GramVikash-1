// src/components/onboarding/OnboardingModal.jsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Check, ChevronRight, ChevronLeft, Sprout, Droplets, Sparkles, X, Loader2 } from 'lucide-react';
import { useFarmer } from '../../context/FarmerContext';
import weatherService from '../../services/weatherService';

export default function OnboardingModal() {
  const { t, i18n } = useTranslation();
  const { isOnboardingOpen, setIsOnboardingOpen, profile, updateProfile, updateFarm, setActiveCrop, clearActiveCrop } = useFarmer();

  const [step, setStep] = useState(1);
  const [locating, setLocating] = useState(false);

  // Form State
  const [locationState, setLocationState] = useState(profile?.location?.state || 'Andhra Pradesh');
  const [district, setDistrict] = useState(profile?.location?.district || 'NTR District');
  const [addressString, setAddressString] = useState(profile?.location?.addressString || 'Vijayawada, Andhra Pradesh');
  const [coords, setCoords] = useState({ lat: 16.5062, lon: 80.6480 });

  const [farmSize, setFarmSize] = useState(profile?.farm?.sizeAcres || 3.5);
  const [soilType, setSoilType] = useState(profile?.farm?.soilType || 'Alluvial Soil (ఒండ్రు నేల)');

  const [hasCrop, setHasCrop] = useState(profile?.activeCrop?.hasCrop ?? true);
  const [cropName, setCropName] = useState(profile?.activeCrop?.cropName || 'Paddy (వరి)');
  const [plantingDays, setPlantingDays] = useState(profile?.activeCrop?.cropAgeDays || 30);

  const [irrigationType, setIrrigationType] = useState(profile?.farm?.irrigationType || 'Drip & Borewell');

  if (!isOnboardingOpen) return null;

  // GPS Location Trigger
  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lon: longitude });
        const name = await weatherService.reverseGeocode(latitude, longitude);
        setAddressString(name);
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        console.warn('GPS location error:', err);
      },
      { timeout: 8000 }
    );
  };

  const handleFinish = () => {
    if (profile?.phone) {
      localStorage.setItem(`onboarded_${profile.phone}`, 'true');
    }

    // Save location & profile
    updateProfile({
      hasCompletedOnboarding: true,
      location: {
        state: locationState,
        district: district,
        latitude: coords.lat,
        longitude: coords.lon,
        addressString: addressString,
      },
    });

    // Save Farm
    updateFarm({
      sizeAcres: parseFloat(farmSize) || 3.5,
      soilType: soilType,
      irrigationType: irrigationType,
    });

    // Save Crop
    if (hasCrop) {
      setActiveCrop({
        cropName: cropName,
        cropAgeDays: parseInt(plantingDays) || 30,
        growthStage: plantingDays < 20 ? 'Seedling Stage' : plantingDays < 60 ? 'Vegetative Stage' : 'Flowering Stage',
        healthStatus: 'Healthy',
      });
    } else {
      clearActiveCrop();
    }

    setIsOnboardingOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-green-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-800 to-emerald-700 px-6 py-5 text-white flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg">{t('onboarding.title')}</h3>
            <p className="text-xs text-green-200">Step {step} of 4</p>
          </div>
          <button onClick={() => setIsOnboardingOpen(false)} className="p-2 hover:bg-white/20 rounded-xl text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Steps Progress Bar */}
        <div className="w-full bg-green-100 h-1.5 flex">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`flex-1 transition-all duration-300 ${s <= step ? 'bg-green-600' : 'bg-transparent'}`}
            />
          ))}
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* STEP 1: Farm Location */}
          {step === 1 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center gap-2 text-green-800 font-bold text-sm">
                <MapPin className="w-5 h-5 text-green-600" />
                <span>{t('onboarding.step1')}</span>
              </div>

              <button
                type="button"
                onClick={handleDetectGPS}
                disabled={locating}
                className="w-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-xs"
              >
                {locating ? <Loader2 className="w-5 h-5 animate-spin" /> : <MapPin className="w-5 h-5 text-emerald-600" />}
                <span>{locating ? 'Detecting GPS...' : t('onboarding.useGps')}</span>
              </button>

              <div className="space-y-3">
                <label className="block text-xs font-bold text-gray-600 uppercase">Farm Location / Address</label>
                <input
                  type="text"
                  value={addressString}
                  onChange={(e) => setAddressString(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl font-medium text-sm focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="e.g. Gollapudi, Vijayawada, Andhra Pradesh"
                />
              </div>
            </div>
          )}

          {/* STEP 2: Farm Size */}
          {step === 2 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center gap-2 text-green-800 font-bold text-sm">
                <Sparkles className="w-5 h-5 text-green-600" />
                <span>{t('onboarding.step2')}</span>
              </div>

              <p className="text-xs text-gray-600 font-medium">{t('onboarding.landSizePrompt')}</p>

              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3.5, 5].map((acres) => (
                  <button
                    key={acres}
                    type="button"
                    onClick={() => setFarmSize(acres)}
                    className={`py-3.5 px-4 rounded-2xl font-bold text-sm border-2 transition-all ${
                      farmSize === acres
                        ? 'border-green-600 bg-green-50 text-green-800 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    {acres} {t('common.acres')}
                  </button>
                ))}
              </div>

              <div className="pt-2">
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Or Enter Custom Acres</label>
                <input
                  type="number"
                  step="0.5"
                  value={farmSize}
                  onChange={(e) => setFarmSize(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl font-bold text-sm focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="e.g. 4.5"
                />
              </div>
            </div>
          )}

          {/* STEP 3: Current Crop */}
          {step === 3 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center gap-2 text-green-800 font-bold text-sm">
                <Sprout className="w-5 h-5 text-green-600" />
                <span>{t('onboarding.step3')}</span>
              </div>

              <p className="text-xs text-gray-600 font-medium">{t('onboarding.hasCropPrompt')}</p>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setHasCrop(true)}
                  className={`p-4 rounded-2xl font-bold text-xs border-2 text-center transition-all ${
                    hasCrop
                      ? 'border-green-600 bg-green-50 text-green-800 shadow-sm'
                      : 'border-gray-200 text-gray-700'
                  }`}
                >
                  🌱 {t('onboarding.yesGrowing')}
                </button>
                <button
                  type="button"
                  onClick={() => setHasCrop(false)}
                  className={`p-4 rounded-2xl font-bold text-xs border-2 text-center transition-all ${
                    !hasCrop
                      ? 'border-green-600 bg-green-50 text-green-800 shadow-sm'
                      : 'border-gray-200 text-gray-700'
                  }`}
                >
                  🌾 {t('onboarding.noFallow')}
                </button>
              </div>

              {hasCrop && (
                <div className="space-y-3 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Select Crop</label>
                    <select
                      value={cropName}
                      onChange={(e) => setCropName(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl font-semibold text-sm focus:ring-2 focus:ring-green-500 outline-none bg-white"
                    >
                      <option value="Paddy (వరి)">Paddy (వరి / धान)</option>
                      <option value="Cotton (పత్తి)">Cotton (పత్తి / कपास)</option>
                      <option value="Chilli (మిరప)">Chilli (మిరప / मिर्च)</option>
                      <option value="Maize (మొక్కజొన్న)">Maize (మొక్కజొన్న / मक्का)</option>
                      <option value="Tomato (టమాటో)">Tomato (టమాటో / टमाटर)</option>
                      <option value="Sugarcane (చెరకు)">Sugarcane (చెరకు / गन्ना)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Crop Age (Days since sowing)</label>
                    <input
                      type="number"
                      value={plantingDays}
                      onChange={(e) => setPlantingDays(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl font-bold text-sm focus:ring-2 focus:ring-green-500 outline-none"
                      placeholder="e.g. 30"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Irrigation System */}
          {step === 4 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center gap-2 text-green-800 font-bold text-sm">
                <Droplets className="w-5 h-5 text-green-600" />
                <span>{t('onboarding.step4')}</span>
              </div>

              <div className="space-y-2">
                {['Drip & Borewell (డ్రిప్)', 'Canal Water (కాలువ నీరు)', 'Sprinkler (స్ప్రింక్లర్)', 'Rainfed (వర్షాధారం)'].map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setIrrigationType(method)}
                    className={`w-full p-3.5 rounded-2xl font-bold text-sm border-2 text-left transition-all flex items-center justify-between ${
                      irrigationType === method
                        ? 'border-green-600 bg-green-50 text-green-800 shadow-sm'
                        : 'border-gray-200 text-gray-700'
                    }`}
                  >
                    <span>{method}</span>
                    {irrigationType === method && <Check className="w-5 h-5 text-green-600" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-1 text-gray-600 hover:text-gray-900 font-bold text-sm px-4 py-2"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="bg-green-600 hover:bg-green-700 text-white font-bold text-sm px-6 py-2.5 rounded-xl shadow-sm flex items-center gap-1.5"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-6 py-2.5 rounded-xl shadow-md flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" /> {t('onboarding.saveAndStart')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
