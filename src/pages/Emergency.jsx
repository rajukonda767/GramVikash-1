// src/pages/Emergency.jsx
// Emergency SOS Broadcast with Real-Time Device GPS Location, Fast2SMS Dispatch, & Voice Reassurance

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  Flame,
  Zap,
  PhoneCall,
  MapPin,
  CheckCircle2,
  Volume2,
  VolumeX,
  Radio,
  Loader2,
  Truck,
  Shield,
  ExternalLink,
  Locate,
} from 'lucide-react';

import { useFarmer } from '../context/FarmerContext';
import { useVoice } from '../context/VoiceContext';
import emergencyService from '../services/emergencyService';

export default function Emergency() {
  const { t, i18n } = useTranslation();
  const { profile } = useFarmer();
  const { speakText, stopSpeaking, isSpeaking } = useVoice();
  const currentLang = i18n.language === 'te' ? 'te' : 'en';

  const [selectedType, setSelectedType] = useState('snake_bite');
  const [loading, setLoading] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState(null);

  // Dynamic live GPS location state
  const [liveCoords, setLiveCoords] = useState({
    latitude: profile?.location?.latitude || 16.5062,
    longitude: profile?.location?.longitude || 80.6480,
    addressString: profile?.location?.addressString || 'Vijayawada, NTR District, Andhra Pradesh',
    isLiveGPS: false,
  });

  // Pull real-time device GPS location on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLiveCoords({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            addressString: `Live GPS: ${pos.coords.latitude.toFixed(4)}° N, ${pos.coords.longitude.toFixed(4)}° E`,
            isLiveGPS: true,
          });
        },
        (err) => {
          console.warn('Geolocation lookup warning:', err);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  }, []);

  const categories = [
    {
      key: 'snake_bite',
      icon: AlertTriangle,
      label: currentLang === 'te' ? 'పాము కాటు' : 'Snake Bite',
      desc: currentLang === 'te' ? 'తక్షణ ప్రథమ చికిత్స & 108' : 'Immediate First Aid & 108',
      color: 'border-amber-300 bg-amber-50 text-amber-900',
      iconColor: 'text-amber-600',
    },
    {
      key: 'fire',
      icon: Flame,
      label: currentLang === 'te' ? 'పొలంలో మంటలు' : 'Farm Fire',
      desc: currentLang === 'te' ? 'అగ్నిమాపక కేంద్రం 101' : 'Fire Dept 101 Alert',
      color: 'border-red-300 bg-red-50 text-red-900',
      iconColor: 'text-red-600',
    },
    {
      key: 'electrical',
      icon: Zap,
      label: currentLang === 'te' ? 'విద్యుత్ షాక్ / లైన్' : 'Electric Shock',
      desc: currentLang === 'te' ? 'విద్యుత్ బోర్డు 1912' : 'Power Board 1912',
      color: 'border-yellow-300 bg-yellow-50 text-yellow-900',
      iconColor: 'text-yellow-600',
    },
    {
      key: 'machinery',
      icon: Truck,
      label: currentLang === 'te' ? 'ట్రాక్టర్ / యంత్ర ప్రమాదం' : 'Machinery Injury',
      desc: currentLang === 'te' ? 'గాయాలు & రక్తం నివారణ' : 'Trauma & Direct Pressure',
      color: 'border-blue-300 bg-blue-50 text-blue-900',
      iconColor: 'text-blue-600',
    },
    {
      key: 'flood',
      icon: AlertTriangle,
      label: currentLang === 'te' ? 'వరద / భారీ తుఫాను' : 'Flood / Storm',
      desc: currentLang === 'te' ? 'నీటి ముంపు & సహాయక బృందం' : 'Waterlogging & Rescue',
      color: 'border-cyan-300 bg-cyan-50 text-cyan-900',
      iconColor: 'text-cyan-600',
    },
    {
      key: 'injury',
      icon: AlertTriangle,
      label: currentLang === 'te' ? 'తీవ్ర శారీరక గాయం' : 'Severe Injury',
      desc: currentLang === 'te' ? 'అత్యవసర చికిత్స 108' : 'Medical Emergency 108',
      color: 'border-purple-300 bg-purple-50 text-purple-900',
      iconColor: 'text-purple-600',
    },
  ];

  const mapsUrl = `https://maps.google.com/?q=${liveCoords.latitude.toFixed(4)},${liveCoords.longitude.toFixed(4)}`;

  const handleTriggerSOS = async () => {
    setLoading(true);
    setBroadcastResult(null);

    // Retrieve fresh live coordinates at the exact moment of click if available
    let currentLat = liveCoords.latitude;
    let currentLon = liveCoords.longitude;

    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      try {
        const freshPos = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 4000 });
        });
        currentLat = freshPos.coords.latitude;
        currentLon = freshPos.coords.longitude;
      } catch (e) {
        // Fallback to existing coordinates
      }
    }

    try {
      const res = await emergencyService.triggerSOS({
        emergencyType: selectedType,
        latitude: currentLat,
        longitude: currentLon,
        locationName: profile?.location?.addressString || `${currentLat.toFixed(4)}° N, ${currentLon.toFixed(4)}° E`,
        farmerName: profile?.name || 'Raju',
        farmerPhone: profile?.phone || '9390616956',
        language: currentLang,
      });

      setBroadcastResult(res);

      // Auto-speak voice reassurance immediately
      if (res.spokenAlert) {
        const spoken = typeof res.spokenAlert === 'object'
          ? (res.spokenAlert[currentLang] || res.spokenAlert['en'])
          : res.spokenAlert;
        speakText(spoken);
      }
    } catch (e) {
      console.error('Emergency SOS Trigger Error:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fadeIn pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-red-700 via-red-600 to-rose-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black flex items-center gap-3">
            <Radio className="w-8 h-8 animate-pulse text-yellow-300" />
            {currentLang === 'te' ? 'అత్యవసర SOS సహాయం' : 'Emergency SOS Alert'}
          </h1>
          <p className="text-sm text-red-100 mt-1 font-medium">
            {currentLang === 'te'
              ? 'ఒక్క ట్యాప్‌తో లైవ్ GPS లొకేషన్ మరియు SMS ద్వారా అత్యవసర సహాయం పొందండి'
              : 'One-tap emergency broadcast with real-time GPS coordinates & Fast2SMS alert'}
          </p>
        </div>

        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-red-800/80 hover:bg-red-800 px-4 py-2.5 rounded-2xl text-xs font-bold border border-red-400/40 shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Locate className="w-4 h-4 text-yellow-300 animate-pulse" />
          <span className="truncate max-w-[200px]">{liveCoords.addressString}</span>
          <ExternalLink className="w-3.5 h-3.5 opacity-80" />
        </a>
      </div>

      {/* Emergency Category Selector */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-red-100 shadow-xs space-y-6">
        <div>
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-1">
            {currentLang === 'te' ? '1. అత్యవసర రకం ఎంచుకోండి' : '1. Select Emergency Type'}
          </h3>
          <p className="text-xs text-gray-500">
            {currentLang === 'te'
              ? 'కింది వాటిలో ఒకటి ఎంచుకుని పెద్ద SOS బటన్ నొక్కండి'
              : 'Tap an emergency category below, then press the SOS button'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {categories.map((c) => {
            const Icon = c.icon;
            const isSelected = selectedType === c.key;
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => setSelectedType(c.key)}
                className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                  isSelected
                    ? 'border-red-600 bg-red-50/90 shadow-md ring-2 ring-red-200 scale-102'
                    : 'border-gray-200 hover:border-gray-300 bg-gray-50/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isSelected ? 'bg-red-600 text-white' : 'bg-gray-100 ' + c.iconColor}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  {isSelected && <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />}
                </div>
                <div>
                  <p className="font-black text-sm text-gray-900">{c.label}</p>
                  <p className="text-[11px] text-gray-500 font-medium">{c.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Big Pulsing SOS Trigger Button */}
        <div className="pt-2 flex flex-col items-center justify-center">
          <button
            type="button"
            onClick={handleTriggerSOS}
            disabled={loading}
            className="w-40 h-40 rounded-full bg-gradient-to-tr from-red-700 via-red-600 to-rose-500 text-white font-black shadow-2xl shadow-red-500/50 hover:scale-105 active:scale-95 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer animate-pulse"
          >
            {loading ? (
              <>
                <Loader2 className="w-10 h-10 animate-spin" />
                <span className="text-xs font-bold uppercase mt-1">
                  {currentLang === 'te' ? 'పంపుతున్నాం...' : 'Sending...'}
                </span>
              </>
            ) : (
              <>
                <Radio className="w-9 h-9 text-yellow-300" />
                <span className="text-2xl tracking-wider">SOS</span>
                <span className="text-[10px] font-bold text-red-200 uppercase">
                  {currentLang === 'te' ? 'సహాయం కోసం నొక్కండి' : 'Tap to Send Alert'}
                </span>
              </>
            )}
          </button>

          <p className="text-xs font-bold text-gray-600 mt-4 text-center">
            {currentLang === 'te'
              ? 'నొక్కగానే మీ ప్రస్తుత GPS లొకేషన్ మరియు గూగుల్ మ్యాప్ లింక్ SMS ద్వారా పంపబడుతుంది'
              : 'Instantly broadcasts live GPS coordinates and Google Maps link via Fast2SMS'}
          </p>
        </div>
      </div>

      {/* Broadcast Result & Immediate First Aid Guide */}
      {broadcastResult && (
        <div className="space-y-6 animate-fadeIn">
          {/* Green Reassurance Card */}
          <div className="bg-emerald-600 text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-yellow-300 flex-shrink-0 mt-0.5 sm:mt-0" />
                <div>
                  <h3 className="font-black text-xl">
                    {currentLang === 'te'
                      ? 'అత్యవసర సహాయ అభ్యర్థన పంపబడింది — సహాయం త్వరలోనే వస్తుంది!'
                      : 'Emergency Response Dispatched — Help Will Arrive Soon!'}
                  </h3>
                  <p className="text-xs text-emerald-100 mt-0.5 font-medium">
                    {currentLang === 'te'
                      ? 'మీ లైవ్ లొకేషన్ మరియు అత్యవసర SMS హెచ్చరిక విజయవంతంగా చేరింది. దయచేసి క్రింది ప్రథమ చికిత్స సూచనలు పాటించండి.'
                      : 'Your live GPS coordinates and emergency SMS alert have been dispatched. Please follow the first aid steps below.'}
                  </p>
                </div>
              </div>

              {/* Speak Audio */}
              <button
                type="button"
                onClick={() => {
                  if (isSpeaking) { stopSpeaking(); return; }
                  const spoken = typeof broadcastResult.spokenAlert === 'object'
                    ? (broadcastResult.spokenAlert[currentLang] || broadcastResult.spokenAlert['en'])
                    : broadcastResult.spokenAlert;
                  speakText(spoken);
                }}
                className="bg-white hover:bg-emerald-50 text-emerald-900 px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer self-start sm:self-auto flex-shrink-0"
              >
                {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                <span>{isSpeaking ? (currentLang === 'te' ? 'ఆపండి' : 'Stop') : (currentLang === 'te' ? 'వినండి' : 'Listen')}</span>
              </button>
            </div>
          </div>

          {/* Actionable First Aid Guidance Steps */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-red-100 shadow-xs space-y-4">
            <h3 className="font-black text-base text-gray-900 flex items-center gap-2">
              <Shield className="w-5 h-5 text-red-600" />
              <span>
                {currentLang === 'te' ? 'తక్షణ ప్రథమ చికిత్స మార్గదర్శకాలు' : 'Immediate First Aid Guidelines'}
              </span>
            </h3>

            <div className="space-y-3">
              {(broadcastResult.guide?.actions || []).map((step, idx) => (
                <div key={idx} className="bg-red-50/70 p-4 rounded-2xl border border-red-200/70 flex items-start gap-3">
                  <div className="w-7 h-7 bg-red-600 text-white rounded-xl flex items-center justify-center font-black text-xs flex-shrink-0 mt-0.5 shadow-xs">
                    {idx + 1}
                  </div>
                  <p className="text-sm font-bold text-gray-900 leading-snug">
                    {typeof step === 'object' ? (step[currentLang] || step['en']) : step}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Emergency Helplines Direct Dial */}
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xs space-y-3">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              {currentLang === 'te' ? 'తక్షణ అత్యవసర నంబర్లు (డైరెక్ట్ కాల్):' : 'Emergency Toll-Free Helplines:'}
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <a href="tel:108" className="bg-red-50 hover:bg-red-100 text-red-800 p-3.5 rounded-2xl border border-red-200 flex items-center justify-center gap-2 font-black text-xs transition-colors">
                <PhoneCall className="w-4 h-4 text-red-600" /> 108 Ambulance
              </a>
              <a href="tel:101" className="bg-orange-50 hover:bg-orange-100 text-orange-800 p-3.5 rounded-2xl border border-orange-200 flex items-center justify-center gap-2 font-black text-xs transition-colors">
                <PhoneCall className="w-4 h-4 text-orange-600" /> 101 Fire
              </a>
              <a href="tel:100" className="bg-blue-50 hover:bg-blue-100 text-blue-800 p-3.5 rounded-2xl border border-blue-200 flex items-center justify-center gap-2 font-black text-xs transition-colors">
                <PhoneCall className="w-4 h-4 text-blue-600" /> 100 Police
              </a>
              <a href="tel:1912" className="bg-yellow-50 hover:bg-yellow-100 text-yellow-800 p-3.5 rounded-2xl border border-yellow-200 flex items-center justify-center gap-2 font-black text-xs transition-colors">
                <PhoneCall className="w-4 h-4 text-yellow-700" /> 1912 Power
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
