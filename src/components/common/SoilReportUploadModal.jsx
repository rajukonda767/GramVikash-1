// src/components/common/SoilReportUploadModal.jsx
import React, { useState } from 'react';
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
} from 'lucide-react';
import cropService from '../../services/cropService';
import { useVoice } from '../../context/VoiceContext';

export default function SoilReportUploadModal({ isOpen, onClose, onDataExtracted }) {
  const { t, i18n } = useTranslation();
  const { speakText } = useVoice();
  const lang = i18n.language || 'en';

  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [extractedResult, setExtractedResult] = useState(null);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const reset = () => {
    setFile(null);
    setPreviewUrl(null);
    setExtractedResult(null);
    setError(null);
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    // Validate file type immediately
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(selected.type)) {
      setError({
        message: lang === 'te'
          ? 'దయచేసి PNG, JPG లేదా PDF ఫైల్ ఎంచుకోండి. Selfie లేదా వేరే ఫోటోలు పని చేయవు.'
          : 'Please upload a JPG, PNG image or PDF of your Soil Health Card. Selfies and unrelated photos are not accepted.',
      });
      return;
    }

    setFile(selected);
    setError(null);
    setExtractedResult(null);

    if (selected.type.startsWith('image/')) {
      setPreviewUrl(URL.createObjectURL(selected));
    } else {
      setPreviewUrl(null);
    }
  };

  const handleStartScan = async () => {
    if (!file) return;
    setScanning(true);
    setError(null);

    try {
      const result = await cropService.parseSoilReport(file, lang);

      if (!result.success) {
        setError({ message: result.message });
        if (result.error === 'missing_values') {
          // Partial success: we have some values but some are missing
          // Still allow manual editing
          setExtractedResult(null);
        }
        speakText(result.message);
      } else {
        setExtractedResult(result);
        if (result.voiceNote) {
          speakText(result.voiceNote);
        }
      }
    } catch (e) {
      setError({
        message: lang === 'te'
          ? 'స్కాన్ విఫలమైంది. మళ్ళీ ప్రయత్నించండి.'
          : 'Scanning failed. Please try again with a clearer image.',
      });
    } finally {
      setScanning(false);
    }
  };

  const handleApply = () => {
    if (extractedResult?.extractedData) {
      onDataExtracted(extractedResult.extractedData);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden border border-green-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-700 to-green-600 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
              <FileText className="w-6 h-6 text-yellow-300" />
            </div>
            <div>
              <h3 className="font-bold text-lg">{t('soilReportModal.title')}</h3>
              <p className="text-xs text-green-100">{t('soilReportModal.subtitle')}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">

          {/* Validation Error Banner */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3 animate-fadeIn">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-red-800">{lang === 'te' ? 'అమాన్యమైన ఫైల్ / Invalid Document' : 'Invalid Document Detected'}</p>
                <p className="text-xs text-red-700 mt-0.5">{error.message}</p>
              </div>
            </div>
          )}

          {/* Instructions */}
          {!file && !error && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs text-blue-800 font-medium space-y-1">
              <p className="font-bold text-blue-900 flex items-center gap-1">
                <Camera className="w-4 h-4" />
                {lang === 'te' ? 'ఏమి అప్‌లోడ్ చేయాలి?' : 'What to Upload?'}
              </p>
              <p>✅ {lang === 'te' ? 'సాయిల్ హెల్త్ కార్డ్ ఫోటో' : 'Soil Health Card photo'}</p>
              <p>✅ {lang === 'te' ? 'నేల పరీక్ష నివేదిక PDF' : 'Soil test report PDF'}</p>
              <p>❌ {lang === 'te' ? 'Selfie, కార్ ఫోటో లేదా స్క్రీన్‌షాట్ పని చేయవు' : 'Selfies, car photos, and unrelated images are rejected'}</p>
            </div>
          )}

          {/* Upload Zone */}
          {!file && (
            <label className="border-2 border-dashed border-green-300 hover:border-green-500 bg-green-50/50 hover:bg-green-50 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all">
              <UploadCloud className="w-12 h-12 text-green-600 mb-3 animate-pulse" />
              <p className="text-sm font-bold text-gray-800 text-center">
                {lang === 'te' ? 'సాయిల్ హెల్త్ కార్డ్ ఫోటో లేదా PDF అప్‌లోడ్ చేయండి' : 'Tap to upload Soil Health Card image or PDF'}
              </p>
              <p className="text-xs text-gray-500 mt-1">PNG, JPG, PDF — Max 10MB</p>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          )}

          {/* Selected File & Preview */}
          {file && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-gray-50 p-3.5 rounded-2xl border border-gray-200">
                <div className="flex items-center gap-3 truncate">
                  <FileText className="w-6 h-6 text-green-600 flex-shrink-0" />
                  <span className="text-sm font-semibold text-gray-800 truncate">{file.name}</span>
                </div>
                <button
                  onClick={reset}
                  className="text-xs font-semibold text-red-600 hover:underline flex-shrink-0 flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Change
                </button>
              </div>

              {previewUrl && (
                <div className="rounded-2xl overflow-hidden max-h-48 border border-gray-200 flex items-center justify-center bg-gray-100">
                  <img src={previewUrl} alt="Soil Card Preview" className="object-contain max-h-48 w-full" />
                </div>
              )}

              {!extractedResult && (
                <button
                  onClick={handleStartScan}
                  disabled={scanning}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {scanning ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>{lang === 'te' ? 'స్కాన్ చేస్తున్నాం...' : 'Scanning & Extracting Values...'}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 text-yellow-300" />
                      <span>{lang === 'te' ? 'AI ద్వారా స్కాన్ చేయండి' : 'Scan & Extract Soil Values (AI OCR)'}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Extracted Values Result */}
          {extractedResult && extractedResult.success && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  {lang === 'te' ? 'వెలికితీసిన విలువలు' : 'Extracted Values'}
                </span>
                <span className="bg-emerald-200 text-emerald-900 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                  {extractedResult.confidenceScore}% Confidence
                </span>
              </div>

              {extractedResult.labName && (
                <p className="text-[11px] text-emerald-700 font-medium">🔬 {extractedResult.labName}</p>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { label: 'Nitrogen (N)', key: 'nitrogen', unit: 'kg/ha' },
                  { label: 'Phosphorus (P)', key: 'phosphorus', unit: 'kg/ha' },
                  { label: 'Potassium (K)', key: 'potassium', unit: 'kg/ha' },
                  { label: 'Soil pH', key: 'ph', unit: '' },
                ].map(({ label, key, unit }) => (
                  <div key={key} className="bg-white p-3 rounded-xl border border-emerald-100 text-center">
                    <span className="text-[11px] font-bold text-gray-500">{label}</span>
                    <p className="text-lg font-bold text-green-700">
                      {extractedResult.extractedData[key]}
                      {unit && <span className="text-[10px] text-gray-400 ml-0.5">{unit}</span>}
                    </p>
                  </div>
                ))}
              </div>

              <button
                onClick={handleApply}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{lang === 'te' ? 'ఈ విలువలు నమోదు చేయండి' : 'Apply These Values to Form'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
