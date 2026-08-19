// src/components/common/AIExplanationCard.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, HelpCircle, CheckCircle2, Volume2, VolumeX } from 'lucide-react';
import { useVoice } from '../../context/VoiceContext';

export default function AIExplanationCard({
  what,
  why,
  action,
  spokenText = null,
  title = null,
  className = '',
}) {
  const { t, i18n } = useTranslation();
  const { speakText, stopSpeaking, isSpeaking } = useVoice();
  const currentLang = i18n.language || 'en';

  const getText = (val) => {
    if (!val) return '';
    if (typeof val === 'object') return val[currentLang] || val['en'] || Object.values(val)[0];
    return val;
  };

  const handleAudioToggle = () => {
    if (isSpeaking) {
      stopSpeaking();
    } else {
      const fullSpeech = spokenText || `${getText(what)}. ${getText(why)}. ${getText(action)}`;
      speakText(fullSpeech);
    }
  };

  return (
    <div className={`bg-gradient-to-br from-emerald-50 via-green-50/60 to-white border border-green-200 rounded-2xl p-5 shadow-xs space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-green-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-green-600 text-white rounded-xl flex items-center justify-center shadow-xs">
            <Sparkles className="w-4 h-4 text-yellow-300" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-green-900">
              {title || (currentLang === 'te' ? 'AI వివరణ & సిఫార్సు' : currentLang === 'hi' ? 'AI व्याख्या और सलाह' : 'AI Explanation & Advisory')}
            </h4>
            <p className="text-[11px] text-green-700 font-medium">Powered by GramVikas AI</p>
          </div>
        </div>

        {/* Listen Aloud Button */}
        <button
          type="button"
          onClick={handleAudioToggle}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            isSpeaking
              ? 'bg-red-500 text-white animate-pulse'
              : 'bg-green-600 hover:bg-green-700 text-white shadow-xs hover:scale-105 active:scale-95'
          }`}
          title="Listen in your language"
        >
          {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          <span>{isSpeaking ? t('app.stopSpeaking') : t('app.speakAloud')}</span>
        </button>
      </div>

      {/* Grid: What? Why? Action */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* WHAT */}
        {what && (
          <div className="bg-white/80 rounded-xl p-3.5 border border-green-100 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-blue-500" /> 1. WHAT?
            </span>
            <p className="text-xs font-bold text-gray-900 leading-snug">{getText(what)}</p>
          </div>
        )}

        {/* WHY */}
        {why && (
          <div className="bg-white/80 rounded-xl p-3.5 border border-green-100 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> 2. WHY?
            </span>
            <p className="text-xs font-medium text-gray-700 leading-snug">{getText(why)}</p>
          </div>
        )}

        {/* WHAT TO DO */}
        {action && (
          <div className="bg-white/80 rounded-xl p-3.5 border border-green-100 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> 3. NEXT ACTION
            </span>
            <p className="text-xs font-semibold text-green-800 leading-snug">{getText(action)}</p>
          </div>
        )}
      </div>
    </div>
  );
}
