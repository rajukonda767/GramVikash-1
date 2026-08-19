// src/pages/Profile.jsx
// Farmer profile & farm specifications memory management with active crop & stage editing

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  User,
  MapPin,
  Save,
  CheckCircle2,
  LogOut,
  Wheat,
  Activity,
  Layers,
} from 'lucide-react';

import { useFarmer } from '../context/FarmerContext';

export default function Profile() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { profile, updateProfile, updateFarm, setActiveCrop, setIsOnboardingOpen } = useFarmer();
  const currentLang = i18n.language || 'en';
  const isTelugu = currentLang === 'te';

  const [savedToast, setSavedToast] = useState(false);

  const [name, setName] = useState(profile?.name || 'Raju');
  const [phone, setPhone] = useState(profile?.phone || '9390616956');
  const [sizeAcres, setSizeAcres] = useState(profile?.farm?.sizeAcres || 3.5);
  const [soilType, setSoilType] = useState(profile?.farm?.soilType || 'Alluvial Soil (ఒండ్రు నేల)');
  const [irrigationType, setIrrigationType] = useState(profile?.farm?.irrigationType || 'Drip & Borewell (డ్రిప్)');
  const [cropName, setCropName] = useState(profile?.activeCrop?.cropName || 'Paddy (వరి)');
  const [growthStage, setGrowthStage] = useState(profile?.activeCrop?.growthStage || 'Vegetative Stage (దుబ్బు దశ)');

  const handleSave = (e) => {
    e.preventDefault();
    updateProfile({ name, phone });
    updateFarm({ sizeAcres: parseFloat(sizeAcres), soilType, irrigationType });
    setActiveCrop({
      hasCrop: Boolean(cropName.trim()),
      cropName: cropName.trim(),
      cropKey: cropName.trim(),
      growthStage: growthStage.trim(),
      variety: 'Hybrid / Certified',
      healthStatus: 'Healthy',
      plantingDate: profile?.activeCrop?.plantingDate || new Date().toISOString().split('T')[0],
    });

    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 3500);
  };

  const handleLogout = () => {
    localStorage.removeItem('gramvikas_logged_in');
    localStorage.removeItem('supabase_token');
    navigate('/login');
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-fadeIn pb-12">
      {/* Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-green-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-tr from-green-700 to-emerald-500 rounded-3xl flex items-center justify-center text-white text-2xl font-black shadow-md">
            {name ? name.charAt(0).toUpperCase() : 'R'}
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900">{name}</h1>
            <p className="text-xs text-green-700 font-semibold flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5" /> {profile?.location?.addressString || 'Vijayawada, Andhra Pradesh'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsOnboardingOpen(true)}
            className="bg-green-50 hover:bg-green-100 text-green-800 font-bold px-4 py-2.5 rounded-2xl text-xs border border-green-200 transition-colors cursor-pointer"
          >
            {t('profile.edit')}
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="bg-red-50 hover:bg-red-100 text-red-700 font-bold px-4 py-2.5 rounded-2xl text-xs border border-red-200 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Save Success Toast */}
      {savedToast && (
        <div className="bg-emerald-600 text-white p-4 rounded-2xl shadow-md flex items-center gap-2 animate-fadeIn text-sm font-bold">
          <CheckCircle2 className="w-5 h-5 text-yellow-300 flex-shrink-0" />
          <span>
            {isTelugu
              ? 'పొలం మరియు పంట వివరాలు విజయవంతంగా భద్రపరచబడ్డాయి! డాష్‌బోర్డ్ నవీకరించబడింది.'
              : 'Farm and Active Crop specifications updated successfully! Dashboard reflects new values.'}
          </span>
        </div>
      )}

      {/* Specifications Form */}
      <form onSubmit={handleSave} className="bg-white rounded-3xl p-6 sm:p-8 border border-green-100 shadow-xs space-y-6">
        <h3 className="text-base font-black text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
          <Layers className="w-5 h-5 text-green-700" />
          <span>{isTelugu ? 'రైతు & పొలం వివరాలు' : 'Farmer & Farm Specifications'}</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700 uppercase">
              {isTelugu ? 'రైతు పేరు' : 'Farmer Name'}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-2xl font-bold text-sm focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700 uppercase">
              {isTelugu ? 'ఫోన్ నంబర్' : 'Phone Number'}
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-2xl font-bold text-sm focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700 uppercase">
              {isTelugu ? 'పొలం విస్తీర్ణం (ఎకరాలు)' : 'Cultivable Land (Acres)'}
            </label>
            <input
              type="number"
              step="0.5"
              value={sizeAcres}
              onChange={(e) => setSizeAcres(e.target.value)}
              required
              min="0.1"
              max="1000"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-2xl font-bold text-sm focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700 uppercase">
              {isTelugu ? 'నేల రకం' : 'Soil Type'}
            </label>
            <input
              type="text"
              value={soilType}
              onChange={(e) => setSoilType(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-2xl font-bold text-sm focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label className="block text-xs font-bold text-gray-700 uppercase">
              {isTelugu ? 'నీటిపారుదల విధానం' : 'Irrigation System'}
            </label>
            <input
              type="text"
              value={irrigationType}
              onChange={(e) => setIrrigationType(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-2xl font-bold text-sm focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>
        </div>

        {/* Active Crop Specifications Section */}
        <h3 className="text-base font-black text-gray-900 border-b border-gray-100 pt-3 pb-3 flex items-center gap-2">
          <Wheat className="w-5 h-5 text-amber-600" />
          <span>{isTelugu ? 'ప్రస్తుత పంట & ఎదుగుదల దశ (Active Crop)' : 'Active Crop & Growth Stage'}</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700 uppercase">
              {isTelugu ? 'ప్రస్తుత పంట పేరు' : 'Active Crop Name'}
            </label>
            <input
              type="text"
              value={cropName}
              onChange={(e) => setCropName(e.target.value)}
              placeholder="e.g. Paddy (వరి), Maize (మొక్కజొన్న), Cotton (పత్తి)"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-2xl font-bold text-sm focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700 uppercase">
              {isTelugu ? 'పంట ఎదుగుదల దశ' : 'Growth Stage'}
            </label>
            <select
              value={growthStage}
              onChange={(e) => setGrowthStage(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-2xl font-bold text-sm focus:ring-2 focus:ring-green-500 outline-none"
            >
              <option value="Seedling Stage (నారు / ప్రారంభ దశ)">Seedling Stage (నారు / ప్రారంభ దశ)</option>
              <option value="Vegetative Stage (దుబ్బు / ఎదుగుదల దశ)">Vegetative Stage (దుబ్బు / ఎదుగుదల దశ)</option>
              <option value="Flowering Stage (పూత / ఈనె దశ)">Flowering Stage (పూత / ఈనె దశ)</option>
              <option value="Maturity / Grain Filling (పాలుపోసుకునే / కోత దశ)">Maturity / Grain Filling (పాలుపోసుకునే / కోత దశ)</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-green-700 hover:bg-green-600 text-white font-black py-4 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 text-sm active:scale-98 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>{isTelugu ? 'వివరాలను భద్రపరచండి' : 'Save All Specifications'}</span>
        </button>
      </form>
    </div>
  );
}
