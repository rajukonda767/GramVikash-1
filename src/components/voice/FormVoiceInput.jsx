// src/components/voice/FormVoiceInput.jsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Mic, CheckCircle2, AlertCircle, Volume2 } from 'lucide-react';
import voiceService from '../../services/voiceService';

export default function FormVoiceInput({ onValuesParsed, promptMessage = null }) {
  const { t, i18n } = useTranslation();
  const [listening, setListening] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [lastParsed, setLastParsed] = useState(null);

  const currentLang = i18n.language || 'en';

  const defaultPrompt = currentLang === 'te'
    ? 'దయచేసి మీ నేల నత్రజని (N), భాస్వరం (P), పొటాషియం (K) మరియు పిహెచ్ విలువలు చెప్పండి. ఉదాహరణకు: నత్రజని 82, భాస్వరం 42, పొటాషియం 48.'
    : currentLang === 'hi'
    ? 'कृपया अपने मिट्टी के नाइट्रोजन (N), फास्फोरस (P), पोटैशियम (K) और पीएच मान बताएं।'
    : 'Please speak your soil values. For example: Nitrogen 82, Phosphorus 42, Potassium 48, pH 6.8.';

  const handleStartVoiceFill = () => {
    // First, speak the guidance prompt to the farmer
    voiceService.speak(promptMessage || defaultPrompt, currentLang, () => {
      // Then start listening after speaking the prompt
      setListening(true);
      setStatusMessage(currentLang === 'te' ? 'వింటున్నాము... మాట్లాడండి' : currentLang === 'hi' ? 'सुन रहे हैं... बोलें' : 'Listening... speak now');

      voiceService.listen({
        lang: currentLang,
        onResult: (transcript) => {
          setListening(false);
          const parsed = voiceService.parseSoilValuesFromSpeech(transcript);

          if (Object.keys(parsed).length > 0) {
            setLastParsed(parsed);
            onValuesParsed(parsed);
            setStatusMessage(
              currentLang === 'te'
                ? `విలువలు గుర్తించబడ్డాయి: ${Object.entries(parsed).map(([k, v]) => `${k}: ${v}`).join(', ')}`
                : `Detected: ${Object.entries(parsed).map(([k, v]) => `${k}: ${v}`).join(', ')}`
            );
            // Voice confirm
            const confirmText = currentLang === 'te' ? 'విలువలు విజయవంతంగా నమోదు చేయబడ్డాయి.' : 'Values recorded successfully.';
            voiceService.speak(confirmText, currentLang);
          } else {
            setStatusMessage(
              currentLang === 'te'
                ? `స్పష్టంగా వినపడలేదు: "${transcript}". దయచేసి మళ్లీ చెప్పండి.`
                : `Could not parse numbers from: "${transcript}". Please try again.`
            );
          }
        },
        onError: () => {
          setListening(false);
          setStatusMessage(currentLang === 'te' ? 'వాయిస్ గుర్తించడంలో సమస్య వచ్చింది. మళ్లీ నొక్కండి.' : 'Voice recognition error. Please try again.');
        },
        onEnd: () => {
          setListening(false);
        },
      });
    });
  };

  return (
    <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-green-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-green-600 text-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
          <Volume2 className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-green-900">{t('crop.voiceFillPrompt')}</h4>
          <p className="text-xs text-green-700">{statusMessage || t('crop.voiceFillTip')}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleStartVoiceFill}
        disabled={listening}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs tracking-wide transition-all shadow-sm flex-shrink-0 ${
          listening
            ? 'bg-red-500 text-white animate-pulse'
            : 'bg-green-600 hover:bg-green-700 text-white hover:scale-105 active:scale-95'
        }`}
      >
        <Mic className="w-4 h-4" />
        <span>{listening ? 'Listening...' : t('crop.voiceFillPrompt')}</span>
      </button>
    </div>
  );
}
