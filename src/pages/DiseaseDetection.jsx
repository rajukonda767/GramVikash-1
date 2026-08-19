// src/pages/DiseaseDetection.jsx
// Crop Disease Detection with Live Camera Stream, 20 class recognition, audio advice, and 3 actionable remedies

import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ScanLine,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Volume2,
  VolumeX,
  Loader2,
  FileImage,
  RefreshCw,
  ShieldCheck,
  X,
  FlipHorizontal,
  Video,
  Upload,
} from 'lucide-react';

import { useFarmer } from '../context/FarmerContext';
import { useVoice } from '../context/VoiceContext';
import AIExplanationCard from '../components/common/AIExplanationCard';
import diseaseService from '../services/diseaseService';

// Helper to create a realistic test leaf image canvas blob for demo buttons
function createSampleLeafBlob(color = [34, 139, 34], spotColor = [139, 69, 19]) {
  const canvas = document.createElement('canvas');
  canvas.width = 300;
  canvas.height = 300;
  const ctx = canvas.getContext('2d');

  // Background foliage green gradient
  const grad = ctx.createLinearGradient(0, 0, 300, 300);
  grad.addColorStop(0, `rgb(${color[0]}, ${color[1]}, ${color[2]})`);
  grad.addColorStop(1, `rgb(${Math.max(0, color[0] - 20)}, ${Math.max(0, color[1] - 30)}, ${color[2]})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 300, 300);

  // Add necrotic disease spots
  ctx.fillStyle = `rgb(${spotColor[0]}, ${spotColor[1]}, ${spotColor[2]})`;
  ctx.beginPath();
  ctx.ellipse(120, 100, 45, 25, Math.PI / 4, 0, 2 * Math.PI);
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(190, 180, 35, 18, -Math.PI / 6, 0, 2 * Math.PI);
  ctx.fill();

  // Leaf veins
  ctx.strokeStyle = 'rgba(200, 255, 200, 0.4)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(150, 0);
  ctx.lineTo(150, 300);
  ctx.stroke();

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(new File([blob], 'sample_leaf.jpg', { type: 'image/jpeg' }));
    }, 'image/jpeg', 0.9);
  });
}

export default function DiseaseDetection() {
  const { t, i18n } = useTranslation();
  const { setRecentDiseaseScan, addActivity } = useFarmer();
  const { speakText, stopSpeaking, isSpeaking } = useVoice();
  const currentLang = i18n.language || 'en';
  const isTelugu = currentLang === 'te';

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [invalidWarning, setInvalidWarning] = useState(null);

  // Live Camera Stream Modal State
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraFacing, setCameraFacing] = useState('environment'); // 'environment' (back) or 'user' (front)
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Start live camera stream
  const startCamera = async (facing = cameraFacing) => {
    setCameraError('');
    setIsCameraOpen(true);

    // Stop existing stream if any
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }

    try {
      const constraints = {
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setCameraError(
        isTelugu
          ? 'కెమెరా ప్రారంభం కాలేదు. దయచేసి కెమెరా అనుమతి (Permission) ఇవ్వండి లేదా ఫైల్ అప్‌లోడ్ ఉపయోగించండి.'
          : 'Could not access device camera. Please grant camera permission or use photo upload.'
      );
    }
  };

  // Stop live camera stream
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
    setCameraError('');
  };

  // Toggle front / back camera
  const toggleCameraFacing = () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
    startCamera(nextFacing);
  };

  // Capture snapshot from live video feed
  const captureSnapshot = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `live_leaf_${Date.now()}.jpg`, { type: 'image/jpeg' });
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(blob));
        setResult(null);
        setInvalidWarning(null);
        stopCamera();
      }
    }, 'image/jpeg', 0.95);
  };

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setInvalidWarning(null);
    }
  };

  const handleSamplePaddy = async () => {
    const file = await createSampleLeafBlob([34, 139, 34], [139, 69, 19]);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setResult(null);
    setInvalidWarning(null);
  };

  const handleSampleTomato = async () => {
    const file = await createSampleLeafBlob([46, 139, 87], [160, 82, 45]);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setResult(null);
    setInvalidWarning(null);
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setResult(null);
    setInvalidWarning(null);

    try {
      const res = await diseaseService.detectDisease(selectedFile, currentLang);

      if (res.isInvalid) {
        setInvalidWarning(
          isTelugu
            ? res.messageTe || 'దయచేసి పంట ఆకుకు సంబంధించిన స్పష్టమైన ఫోటోను అప్‌లోడ్ చేయండి.'
            : res.message || 'Please upload a clear close-up photo of the crop leaf.'
        );
        return;
      }

      setResult(res);

      // Save to farmer context for dashboard alert
      if (!res.isHealthy) {
        setRecentDiseaseScan({
          disease: res.nameEn,
          diseaseTe: res.nameTe,
          severity: res.severity,
          date: new Date().toISOString().split('T')[0],
        });
      } else {
        // Clear disease alert if healthy leaf scanned
        setRecentDiseaseScan(null);
      }

      addActivity({
        type: 'disease_scan',
        title: `Leaf scan: ${res.nameEn}`,
        titleTe: `ఆకు పరీక్ష: ${res.nameTe}`,
      });

      // Auto-speak diagnosis aloud immediately
      if (res.spokenSummary) {
        const textToSpeak = typeof res.spokenSummary === 'object'
          ? (res.spokenSummary[currentLang] || res.spokenSummary.en || res.spokenSummary.te)
          : String(res.spokenSummary);
        if (textToSpeak) speakText(textToSpeak);
      }
    } catch (e) {
      console.error(e);
      setInvalidWarning('Service is currently busy. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'healthy':
        return <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-3 py-1 rounded-full">{t('disease.healthy')}</span>;
      case 'mild':
        return <span className="bg-yellow-100 text-yellow-800 text-xs font-black px-3 py-1 rounded-full">{t('disease.mild')}</span>;
      case 'moderate':
        return <span className="bg-orange-100 text-orange-800 text-xs font-black px-3 py-1 rounded-full">{t('disease.moderate')}</span>;
      case 'severe':
        return <span className="bg-red-100 text-red-800 text-xs font-black px-3 py-1 rounded-full animate-pulse">{t('disease.severe')}</span>;
      default:
        return <span className="bg-gray-100 text-gray-800 text-xs font-black px-3 py-1 rounded-full">Detected</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fadeIn pb-12">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-green-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-md">
              <ScanLine className="w-6 h-6" />
            </div>
            {t('disease.title')}
          </h1>
          <p className="text-sm text-gray-600 mt-1 font-medium">{t('disease.subtitle')}</p>
        </div>

        {/* Quick Sample Testers for Demo */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSamplePaddy}
            className="text-xs font-bold bg-green-50 hover:bg-green-100 text-green-800 px-3 py-2 rounded-xl border border-green-200 transition-colors cursor-pointer"
          >
            🌾 {t('disease.samplePaddy')}
          </button>
          <button
            type="button"
            onClick={handleSampleTomato}
            className="text-xs font-bold bg-red-50 hover:bg-red-100 text-red-800 px-3 py-2 rounded-xl border border-red-200 transition-colors cursor-pointer"
          >
            🍅 {t('disease.sampleTomato')}
          </button>
        </div>
      </div>

      {/* Invalid Image Warning Alert */}
      {invalidWarning && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 text-amber-900 flex items-center gap-3 animate-fadeIn">
          <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0" />
          <div>
            <h4 className="font-bold text-sm">Image Validation Check</h4>
            <p className="text-xs font-medium mt-0.5">{invalidWarning}</p>
          </div>
        </div>
      )}

      {/* Upload & Live Camera Options */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-green-100 shadow-xs space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Option 1: Open Live Camera Viewfinder */}
          <button
            type="button"
            onClick={() => startCamera('environment')}
            className="border-2 border-emerald-500 bg-gradient-to-tr from-emerald-700 to-green-600 hover:from-emerald-600 hover:to-green-500 text-white rounded-3xl p-7 flex flex-col items-center justify-center cursor-pointer shadow-lg shadow-emerald-900/20 hover:scale-102 active:scale-98 transition-all"
          >
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-3 backdrop-blur-md">
              <Camera className="w-8 h-8 text-white animate-pulse" />
            </div>
            <p className="text-lg font-black">{isTelugu ? 'లైవ్ కెమెరా తెరవండి' : 'Open Live Camera'}</p>
            <p className="text-xs text-emerald-100 mt-1 font-medium text-center">
              {isTelugu ? 'ఆకు ఫోటోను నేరుగా కెమెరాతో తీయండి' : 'Take a photo of crop leaf in real-time'}
            </p>
          </button>

          {/* Option 2: Gallery File Upload */}
          <label className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/50 hover:bg-emerald-50 rounded-3xl p-7 flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-102 active:scale-98">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-800 rounded-2xl flex items-center justify-center mb-3">
              <Upload className="w-7 h-7 text-emerald-700" />
            </div>
            <p className="text-lg font-black text-gray-900">{isTelugu ? 'గ్యాలరీ నుండి అప్‌లోడ్' : 'Upload From Gallery'}</p>
            <p className="text-xs text-gray-500 mt-1 font-medium text-center">
              {isTelugu ? 'JPG, PNG ఫోటోలను ఎంచుకోండి' : 'Choose existing leaf photo (JPG, PNG)'}
            </p>
            <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
          </label>
        </div>

        {/* Selected Image Preview & Analyze CTA */}
        {previewUrl && (
          <div className="space-y-4 animate-fadeIn pt-2 border-t border-gray-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-2xl overflow-hidden border border-gray-200 bg-gray-100 flex items-center justify-center max-h-64">
                <img src={previewUrl} alt="Leaf preview" className="object-cover w-full h-full max-h-64" />
              </div>
              <div className="flex flex-col justify-between p-5 bg-gray-50 rounded-2xl border border-gray-200">
                <div className="space-y-2">
                  <span className="text-xs font-bold text-gray-500 uppercase">Selected Photo</span>
                  <p className="text-sm font-black text-gray-900 truncate">{selectedFile?.name || 'Live Camera Leaf Photo'}</p>
                  <p className="text-xs text-emerald-700 font-bold">Ready for MobileNetV2 Neural Analysis (20 Diseases)</p>
                </div>

                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-2xl shadow-lg shadow-emerald-900/20 transition-all flex items-center justify-center gap-2 text-sm mt-4 cursor-pointer active:scale-98"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>{t('disease.analyzing')}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 text-yellow-300" />
                      <span>{t('disease.analyze')}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ================================================================ */}
      {/* LIVE CAMERA VIEWFINDER MODAL                                     */}
      {/* ================================================================ */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-black rounded-3xl overflow-hidden shadow-2xl max-w-lg w-full border border-gray-700 flex flex-col">
            {/* Viewfinder Header */}
            <div className="bg-gray-900/90 px-5 py-4 text-white flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <Video className="w-5 h-5 text-emerald-400 animate-pulse" />
                <span className="font-bold text-sm">{isTelugu ? 'లైవ్ కెమెరా ఫీడ్' : 'Live Camera Viewfinder'}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleCameraFacing}
                  className="p-2 hover:bg-gray-800 rounded-xl text-white transition-colors"
                  title="Switch Front/Back Camera"
                >
                  <FlipHorizontal className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="p-2 hover:bg-gray-800 rounded-xl text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Video Viewport with Alignment Target */}
            <div className="relative bg-black aspect-4/3 flex items-center justify-center overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Alignment Target Frame Overlay */}
              <div className="absolute inset-8 border-2 border-dashed border-emerald-400/80 rounded-2xl pointer-events-none flex items-center justify-center">
                <span className="bg-black/60 text-emerald-200 text-[11px] font-bold px-3 py-1 rounded-full backdrop-blur-xs">
                  {isTelugu ? 'ఆకును ఫ్రేమ్‌లో ఉంచండి' : 'Center the leaf inside frame'}
                </span>
              </div>

              {cameraError && (
                <div className="absolute inset-0 bg-black/90 p-6 flex flex-col items-center justify-center text-center text-red-400 space-y-3">
                  <AlertTriangle className="w-10 h-10 text-red-500" />
                  <p className="text-xs font-bold">{cameraError}</p>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="bg-gray-800 text-white px-4 py-2 rounded-xl text-xs font-bold"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>

            {/* Viewfinder Controls */}
            <div className="bg-gray-900 p-6 flex items-center justify-around">
              <button
                type="button"
                onClick={stopCamera}
                className="text-gray-400 hover:text-white text-xs font-bold px-4 py-2"
              >
                {isTelugu ? 'రద్దు చేయండి' : 'Cancel'}
              </button>

              {/* Shutter Capture Button */}
              <button
                type="button"
                onClick={captureSnapshot}
                className="w-16 h-16 rounded-full bg-white hover:bg-emerald-100 ring-4 ring-emerald-500 flex items-center justify-center shadow-xl active:scale-90 transition-all cursor-pointer"
                title="Capture Leaf"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center text-white">
                  <Camera className="w-6 h-6" />
                </div>
              </button>

              <button
                type="button"
                onClick={toggleCameraFacing}
                className="text-emerald-400 hover:text-emerald-300 text-xs font-bold px-3 py-2 flex items-center gap-1"
              >
                <FlipHorizontal className="w-4 h-4" />
                <span>{isTelugu ? 'కెమెరా మార్చు' : 'Flip'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* RESULTS SECTION                                                  */}
      {/* ================================================================ */}
      {result && !result.isInvalid && (
        <div className="space-y-6 animate-fadeIn">
          {/* Main Diagnosis Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-green-100 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  {getSeverityBadge(result.severity)}
                  <span className="text-xs font-bold text-gray-500">• {result.confidence}% Confidence</span>
                </div>
                <h2 className="text-2xl font-black text-gray-900 mt-1">
                  {isTelugu ? result.nameTe || result.nameEn : result.nameEn}
                </h2>
              </div>

              {/* Speak Audio Button */}
              <button
                type="button"
                onClick={() => {
                  if (isSpeaking) { stopSpeaking(); return; }
                  const spokenObj = result.spokenSummary;
                  const spokenText = typeof spokenObj === 'object'
                    ? (spokenObj[currentLang] || spokenObj['en'])
                    : String(spokenObj || '');
                  speakText(spokenText);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all shadow-xs ${
                  isSpeaking ? 'bg-red-500 text-white animate-pulse' : 'bg-emerald-700 text-white hover:bg-emerald-600'
                }`}
              >
                {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                <span>{isSpeaking ? t('app.stopSpeaking') : t('app.speakAloud')}</span>
              </button>
            </div>

            {/* Symptoms */}
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200/70">
              <h4 className="text-xs font-bold text-gray-600 uppercase mb-1">{t('disease.symptoms')}</h4>
              <p className="text-sm font-medium text-gray-800">
                {typeof result.symptoms === 'object'
                  ? result.symptoms[currentLang] || result.symptoms['en'] || 'Detected leaf symptoms'
                  : result.symptoms}
              </p>
            </div>

            {/* Actionable Remedies */}
            {result.treatments && result.treatments.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">{t('disease.actionRemedies')}</h3>
                  <button
                    type="button"
                    onClick={() => {
                      if (isSpeaking) { stopSpeaking(); return; }
                      const treatmentLines = result.treatments.map((step, i) => {
                        const stepText = typeof step === 'object'
                          ? (step[currentLang] || step['en'] || '')
                          : String(step);
                        return stepText;
                      }).join('. ');
                      const prefix = isTelugu
                        ? `${result.nameTe || result.nameEn} కి నివారణ చర్యలు: `
                        : `Treatment steps for ${result.nameEn}: `;
                      speakText(prefix + treatmentLines);
                    }}
                    className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${
                      isSpeaking ? 'bg-red-500 text-white' : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                    }`}
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>{isTelugu ? 'నివారణ వినండి' : 'Speak Treatment'}</span>
                  </button>
                </div>
                <div className="space-y-2.5">
                  {result.treatments.map((step, idx) => (
                    <div key={step.step || idx} className="bg-emerald-50/70 border border-emerald-200/70 p-4 rounded-2xl flex items-start gap-3">
                      <div className="w-7 h-7 bg-emerald-600 text-white rounded-xl flex items-center justify-center font-black text-xs flex-shrink-0 mt-0.5 shadow-xs">
                        {idx + 1}
                      </div>
                      <p className="text-sm font-bold text-gray-900 leading-snug">
                        {typeof step === 'object' ? step[currentLang] || step['en'] : step}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Explainable AI Summary Card */}
          <AIExplanationCard
            what={`${result.nameEn} (${(result.severity || 'MODERATE').toUpperCase()} SEVERITY)`}
            why={result.symptoms}
            action={result.treatments && result.treatments[0]}
            spokenText={
              typeof result.spokenSummary === 'object'
                ? (result.spokenSummary[currentLang] || result.spokenSummary['en'])
                : result.spokenSummary
            }
          />
        </div>
      )}
    </div>
  );
}
