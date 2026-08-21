// src/components/common/SoilReportUploadModal.jsx
// Soil Report Extractor with Live Camera Stream & Multi-Format PDF/Image OCR

import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  X,
  Sparkles,
  Loader2,
  AlertTriangle,
  Camera,
  RefreshCw,
  SwitchCamera,
  Check,
  HelpCircle,
  FileCode,
  Image as ImageIcon,
} from 'lucide-react';
import cropService from '../../services/cropService';
import { useVoice } from '../../context/VoiceContext';

export default function SoilReportUploadModal({ isOpen, onClose, onDataExtracted }) {
  const { t, i18n } = useTranslation();
  const { speakText } = useVoice();
  const lang = i18n.language === 'te' ? 'te' : 'en';

  const [activeMode, setActiveMode] = useState('select'); // 'select' | 'camera' | 'preview'
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isPdf, setIsPdf] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [extractedResult, setExtractedResult] = useState(null);
  const [editableValues, setEditableValues] = useState({
    nitrogen: '',
    phosphorus: '',
    potassium: '',
    ph: '',
  });
  const [missingFields, setMissingFields] = useState([]);
  const [error, setError] = useState(null);

  // Live Camera state
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraFacing, setCameraFacing] = useState('environment');
  const [cameraError, setCameraError] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      reset();
    }
  }, [isOpen]);

  const reset = () => {
    stopCamera();
    setActiveMode('select');
    setFile(null);
    setPreviewUrl(null);
    setIsPdf(false);
    setExtractedResult(null);
    setEditableValues({ nitrogen: '', phosphorus: '', potassium: '', ph: '' });
    setMissingFields([]);
    setError(null);
    setCameraError(null);
  };

  // Start Live Camera
  const startCamera = async (facing = cameraFacing) => {
    setActiveMode('camera');
    setCameraError(null);
    stopCamera();

    try {
      const constraints = {
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      console.error('Camera stream access error:', err);
      setCameraError(
        lang === 'te'
          ? 'కెమెరా అనుమతి లభించలేదు. దయచేసి బ్రౌజర్‌లో కెమెరాను అనుమతించండి లేదా గ్యాలరీ ఫోటోను ఎంచుకోండి.'
          : 'Could not access camera. Please allow camera permissions or upload a file directly.'
      );
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const toggleCameraFacing = () => {
    const next = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(next);
    startCamera(next);
  };

  // Capture Snapshot from Camera Viewfinder
  const captureSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const capturedFile = new File([blob], `live_soil_report_${Date.now()}.jpg`, { type: 'image/jpeg' });
        stopCamera();
        setFile(capturedFile);
        setIsPdf(false);
        setPreviewUrl(canvas.toDataURL('image/jpeg'));
        setActiveMode('preview');
        processFile(capturedFile);
      },
      'image/jpeg',
      0.95
    );
  };

  // Handle File Pick (PDF / Image)
  const handleFileSelect = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    const isDocPdf = selected.type === 'application/pdf' || selected.name.toLowerCase().endsWith('.pdf');

    if (!validTypes.includes(selected.type) && !isDocPdf) {
      setError(
        lang === 'te'
          ? 'దయచేసి PDF లేదా స్పష్టమైన JPG/PNG ఫోటోను ఎంచుకోండి.'
          : 'Please upload a valid PDF document or JPG/PNG image of your Soil Report.'
      );
      return;
    }

    setFile(selected);
    setIsPdf(isDocPdf);
    setError(null);

    if (isDocPdf) {
      setPreviewUrl(null);
    } else {
      setPreviewUrl(URL.createObjectURL(selected));
    }

    setActiveMode('preview');
    processFile(selected);
  };

  // Call Real Backend AI OCR
  const processFile = async (targetFile) => {
    setScanning(true);
    setError(null);
    setMissingFields([]);
    setExtractedResult(null);

    try {
      const res = await cropService.parseSoilReport(targetFile, lang);

      if (res.extractedData) {
        setEditableValues({
          nitrogen: res.extractedData.nitrogen ?? '',
          phosphorus: res.extractedData.phosphorus ?? '',
          potassium: res.extractedData.potassium ?? '',
          ph: res.extractedData.ph ?? '',
        });
      }

      setExtractedResult(res);

      if (res.missingFields && res.missingFields.length > 0) {
        setMissingFields(res.missingFields);
        setError(res.message);
        speakText(res.message);
      } else if (res.success) {
        if (res.voiceNote) {
          speakText(res.voiceNote);
        }
      } else {
        setError(res.message || 'Could not extract soil parameters.');
      }
    } catch (e) {
      console.error('Soil extraction error:', e);
      setError(
        lang === 'te'
          ? 'పత్రం విశ్లేషణ విఫలమైంది. దయచేసి స్పష్టమైన కాంతిలో ఫోటో తీయండి లేదా PDF అప్‌లోడ్ చేయండి.'
          : 'Extraction failed. Please ensure the document is clear and readable.'
      );
    } finally {
      setScanning(false);
    }
  };

  const handleApply = () => {
    onDataExtracted({
      nitrogen: editableValues.nitrogen !== '' ? parseFloat(editableValues.nitrogen) : undefined,
      phosphorus: editableValues.phosphorus !== '' ? parseFloat(editableValues.phosphorus) : undefined,
      potassium: editableValues.potassium !== '' ? parseFloat(editableValues.potassium) : undefined,
      ph: editableValues.ph !== '' ? parseFloat(editableValues.ph) : undefined,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden border border-green-200 flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-green-700 px-5 sm:px-6 py-4 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
              <FileText className="w-5 h-5 text-yellow-300" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">
                {lang === 'te' ? 'సాయిల్ రిపోర్ట్ అప్‌లోడ్' : 'Upload Soil Report'}
              </h3>
              <p className="text-[11px] text-green-100 font-medium">
                {lang === 'te' ? 'లైవ్ కెమెరా లేదా PDF/ఫోటో నుండి N, P, K, pH సంగ్రహించండి' : 'Extract N, P, K, pH from Live Camera or PDF/Image'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 rounded-xl text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          
          {/* MODE 1: Dual Choice Option (Matching User Sketch) */}
          {activeMode === 'select' && (
            <div className="space-y-4">
              <p className="text-xs font-bold text-gray-600 text-center uppercase tracking-wider">
                {lang === 'te' ? 'పత్రాన్ని ఎలా నమోదు చేయాలనుకుంటున్నారు?' : 'Choose How to Provide Your Soil Report:'}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Live Cam Option */}
                <button
                  type="button"
                  onClick={() => startCamera('environment')}
                  className="group p-6 bg-gradient-to-br from-emerald-50 to-green-100 hover:from-emerald-100 hover:to-green-200 border-2 border-emerald-300 hover:border-emerald-500 rounded-3xl flex flex-col items-center justify-center gap-3 text-center transition-all cursor-pointer shadow-xs active:scale-98"
                >
                  <div className="w-14 h-14 bg-emerald-600 group-hover:bg-emerald-700 text-white rounded-2xl flex items-center justify-center shadow-md transition-colors">
                    <Camera className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="font-black text-gray-900 text-base">
                      {lang === 'te' ? 'లైవ్ కెమెరా' : 'Live Camera'}
                    </h4>
                    <p className="text-xs text-gray-600 font-medium mt-0.5">
                      {lang === 'te' ? 'పత్రం యొక్క ప్రత్యక్ష ఫోటో తీయండి' : 'Take real-time photo of soil document'}
                    </p>
                  </div>
                  <span className="text-[11px] bg-emerald-700 text-white font-bold px-3 py-1 rounded-full shadow-xs">
                    {lang === 'te' ? 'కెమెరా తెరవండి' : 'Open Camera'}
                  </span>
                </button>

                {/* 2. PDF, Image Upload Option */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="group p-6 bg-gradient-to-br from-blue-50 to-indigo-100 hover:from-blue-100 hover:to-indigo-200 border-2 border-blue-300 hover:border-blue-500 rounded-3xl flex flex-col items-center justify-center gap-3 text-center transition-all cursor-pointer shadow-xs active:scale-98"
                >
                  <div className="w-14 h-14 bg-blue-600 group-hover:bg-blue-700 text-white rounded-2xl flex items-center justify-center shadow-md transition-colors">
                    <UploadCloud className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="font-black text-gray-900 text-base">
                      {lang === 'te' ? 'PDF / గ్యాలరీ ఫోటో' : 'PDF / Image'}
                    </h4>
                    <p className="text-xs text-gray-600 font-medium mt-0.5">
                      {lang === 'te' ? 'PDF ఫైల్ లేదా ఫోటో అప్‌లోడ్ చేయండి' : 'Upload PDF or existing photo'}
                    </p>
                  </div>
                  <span className="text-[11px] bg-blue-700 text-white font-bold px-3 py-1 rounded-full shadow-xs">
                    {lang === 'te' ? 'ఫైల్ ఎంచుకోండి' : 'Choose File'}
                  </span>
                </button>
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* Document Tips */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 font-medium space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-amber-950">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  {lang === 'te' ? 'సహాయక సమాచారం:' : 'Supported Formats:'}
                </p>
                <p>• {lang === 'te' ? 'సాయిల్ హెల్త్ కార్డ్ (SHC) PDF లేదా ఫోటో' : 'Government Soil Health Card (PDF or Photo)'}</p>
                <p>• {lang === 'te' ? 'యూనివర్సిటీ లేదా ప్రైవేట్ ల్యాబ్ టెస్ట్ రిపోర్ట్' : 'Agricultural University / Lab Test Reports'}</p>
                <p>• {lang === 'te' ? 'నత్రజని (N), భాస్వరం (P/P₂O₅), పొటాషియం (K/K₂O), pH స్పష్టంగా ఉండాలి' : 'Contains N, P/P₂O₅, K/K₂O, and pH parameters'}</p>
              </div>
            </div>
          )}

          {/* MODE 2: Real-time Live Camera Viewfinder */}
          {activeMode === 'camera' && (
            <div className="space-y-4">
              <div className="relative bg-black rounded-3xl overflow-hidden aspect-[4/3] flex items-center justify-center shadow-lg border-2 border-emerald-500">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />

                {/* Document Alignment Frame Overlay */}
                <div className="absolute inset-4 border-2 border-dashed border-yellow-400/90 rounded-2xl pointer-events-none flex flex-col items-center justify-between p-3">
                  <span className="bg-black/70 text-yellow-300 text-[11px] font-bold px-3 py-1 rounded-full backdrop-blur-xs">
                    {lang === 'te' ? 'రిపోర్ట్ పత్రాన్ని ఫ్రేమ్ లోపల ఉంచండి' : 'Align Soil Report Inside Frame'}
                  </span>
                  <span className="text-[10px] text-white/80 font-medium bg-black/60 px-2 py-0.5 rounded-md">
                    {lang === 'te' ? 'స్పష్టమైన వెలుతురులో ఫోటో తీయండి' : 'Ensure good lighting'}
                  </span>
                </div>

                {/* Flip camera button */}
                <button
                  type="button"
                  onClick={toggleCameraFacing}
                  className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white p-2.5 rounded-full backdrop-blur-md transition-colors cursor-pointer"
                  title="Switch Camera"
                >
                  <SwitchCamera className="w-5 h-5" />
                </button>
              </div>

              <canvas ref={canvasRef} className="hidden" />

              {cameraError && (
                <div className="bg-red-50 text-red-800 p-3 rounded-2xl text-xs font-semibold border border-red-200">
                  {cameraError}
                </div>
              )}

              {/* Shutter and Back Buttons */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { stopCamera(); setActiveMode('select'); }}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-2xl transition-colors cursor-pointer"
                >
                  {lang === 'te' ? 'వెనుకకు' : 'Back'}
                </button>

                <button
                  type="button"
                  onClick={captureSnapshot}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white py-3 px-6 rounded-2xl font-black text-sm shadow-lg shadow-green-700/30 active:scale-95 transition-all cursor-pointer"
                >
                  <Camera className="w-5 h-5 animate-pulse" />
                  <span>{lang === 'te' ? 'ఫోటో తీయండి' : 'Capture & Extract'}</span>
                </button>
              </div>
            </div>
          )}

          {/* MODE 3: Processing / Scanning State & Extracted Results Review */}
          {activeMode === 'preview' && (
            <div className="space-y-4">
              
              {/* File / Image Banner */}
              <div className="flex items-center justify-between bg-gray-50 p-3.5 rounded-2xl border border-gray-200">
                <div className="flex items-center gap-3 truncate">
                  {isPdf ? (
                    <FileCode className="w-7 h-7 text-red-500 flex-shrink-0" />
                  ) : (
                    <ImageIcon className="w-7 h-7 text-emerald-600 flex-shrink-0" />
                  )}
                  <div className="truncate">
                    <p className="text-xs font-bold text-gray-900 truncate">{file?.name || 'Soil Report Document'}</p>
                    <p className="text-[10px] text-gray-500">{isPdf ? 'PDF Document' : 'Image Scan'}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={reset}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl transition-colors cursor-pointer flex-shrink-0"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{lang === 'te' ? 'మరొకటి మార్చండి' : 'Change'}</span>
                </button>
              </div>

              {/* Scanning Loader */}
              {scanning && (
                <div className="py-8 flex flex-col items-center justify-center gap-3 bg-emerald-50/50 rounded-3xl border border-emerald-200">
                  <div className="relative">
                    <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
                    <Sparkles className="w-5 h-5 text-yellow-500 absolute -top-1 -right-1 animate-bounce" />
                  </div>
                  <p className="text-sm font-black text-emerald-900">
                    {lang === 'te' ? 'AI నేల నివేదికను విశ్లేషిస్తోంది...' : 'AI Analyzing Soil Test Document...'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {lang === 'te' ? 'నత్రజని, భాస్వరం, పొటాషియం, pH విలువలు చదువుతున్నాం' : 'Extracting N, P, K, pH parameters & chemical formulas'}
                  </p>
                </div>
              )}

              {/* Error / Missing Value Notice */}
              {error && !scanning && (
                <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex items-start gap-3 animate-fadeIn">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-black text-amber-900 uppercase">
                      {lang === 'te' ? 'గమనిక / సమాచారం' : 'Missing Parameter Notice'}
                    </p>
                    <p className="text-xs font-semibold text-amber-800 mt-0.5">{error}</p>
                    {missingFields.length > 0 && (
                      <p className="text-[11px] text-amber-700 mt-1 font-medium">
                        {lang === 'te'
                          ? 'దయచేసి తప్పిపోయిన విలువలను కింద నేరుగా నమోదు చేయండి.'
                          : 'Please fill in the missing values in the boxes below before applying.'}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Extracted Parameter Input Boxes (Editable) */}
              {!scanning && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider">
                      {lang === 'te' ? 'సంగ్రహించిన నేల పరీక్ష ఫలితాలు:' : 'Extracted Soil Parameters:'}
                    </h4>
                    {extractedResult?.success && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {lang === 'te' ? 'విజయవంతం' : 'Verified'}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Nitrogen */}
                    <div className="bg-gray-50 p-3 rounded-2xl border border-gray-200 focus-within:border-emerald-500 focus-within:bg-white transition-all">
                      <label className="text-[11px] font-bold text-gray-600 block mb-1">
                        {lang === 'te' ? 'నత్రజని (N) [kg/ha]' : 'Nitrogen (N) [kg/ha]'}
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={editableValues.nitrogen}
                        onChange={(e) => setEditableValues({ ...editableValues, nitrogen: e.target.value })}
                        placeholder="e.g. 90"
                        className="w-full text-base font-black text-gray-900 bg-transparent outline-hidden"
                      />
                    </div>

                    {/* Phosphorus */}
                    <div className="bg-gray-50 p-3 rounded-2xl border border-gray-200 focus-within:border-emerald-500 focus-within:bg-white transition-all">
                      <label className="text-[11px] font-bold text-gray-600 block mb-1">
                        {lang === 'te' ? 'భాస్వరం (P/P₂O₅) [kg/ha]' : 'Phosphorus (P) [kg/ha]'}
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={editableValues.phosphorus}
                        onChange={(e) => setEditableValues({ ...editableValues, phosphorus: e.target.value })}
                        placeholder="e.g. 42"
                        className="w-full text-base font-black text-gray-900 bg-transparent outline-hidden"
                      />
                    </div>

                    {/* Potassium */}
                    <div className="bg-gray-50 p-3 rounded-2xl border border-gray-200 focus-within:border-emerald-500 focus-within:bg-white transition-all">
                      <label className="text-[11px] font-bold text-gray-600 block mb-1">
                        {lang === 'te' ? 'పొటాషియం (K/K₂O) [kg/ha]' : 'Potassium (K) [kg/ha]'}
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={editableValues.potassium}
                        onChange={(e) => setEditableValues({ ...editableValues, potassium: e.target.value })}
                        placeholder="e.g. 43"
                        className="w-full text-base font-black text-gray-900 bg-transparent outline-hidden"
                      />
                    </div>

                    {/* Soil pH */}
                    <div className="bg-gray-50 p-3 rounded-2xl border border-gray-200 focus-within:border-emerald-500 focus-within:bg-white transition-all">
                      <label className="text-[11px] font-bold text-gray-600 block mb-1">
                        {lang === 'te' ? 'నేల pH విలువ (3-10)' : 'Soil pH (3-10 scale)'}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={editableValues.ph}
                        onChange={(e) => setEditableValues({ ...editableValues, ph: e.target.value })}
                        placeholder="e.g. 6.5"
                        className="w-full text-base font-black text-gray-900 bg-transparent outline-hidden"
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-3 pt-3">
                    <button
                      type="button"
                      onClick={reset}
                      className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-2xl transition-colors cursor-pointer"
                    >
                      {lang === 'te' ? 'రద్దు చేయండి' : 'Cancel'}
                    </button>

                    <button
                      type="button"
                      onClick={handleApply}
                      disabled={!editableValues.nitrogen && !editableValues.phosphorus && !editableValues.potassium && !editableValues.ph}
                      className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 disabled:opacity-50 text-white py-3 px-6 rounded-2xl font-black text-xs sm:text-sm shadow-md transition-all cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>{lang === 'te' ? 'విలువలను నమోదు చేయండి' : 'Apply Values to Form'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
