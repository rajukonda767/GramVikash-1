// src/components/voice/VoiceAssistantButton.jsx
// Stacked Floating Action Buttons matching user mobile sketch: Emergency SOS (top) + AI Voice Assistant (bottom)

import React from 'react';
import { Link } from 'react-router-dom';
import { Mic, Sparkles, AlertTriangle, ShieldAlert } from 'lucide-react';
import { useVoice } from '../../context/VoiceContext';

export default function VoiceAssistantButton({ variant = 'floating', label = null, className = '' }) {
  const { openVoiceModal, isSpeaking } = useVoice();

  if (variant === 'inline') {
    return (
      <button
        onClick={openVoiceModal}
        className={`flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-2xl font-bold text-sm shadow-md transition-all active:scale-95 ${className}`}
      >
        <Mic className="w-4 h-4 text-white animate-pulse" />
        <span>{label || 'Ask by Voice (వాయిస్)'}</span>
      </button>
    );
  }

  // Dual Floating Action Buttons: 1) Emergency SOS (top), 2) AI Voice Assistant (bottom)
  return (
    <div className={`fixed bottom-22 lg:bottom-8 right-4 sm:right-6 z-40 flex flex-col items-end gap-3 pointer-events-auto ${className}`}>
      {/* 1. Emergency SOS Floating Action Button */}
      <Link
        to="/emergency"
        className="group relative w-12 h-12 sm:w-13 sm:h-13 bg-gradient-to-tr from-red-600 to-rose-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-red-900/30 hover:scale-110 active:scale-95 transition-all border-2 border-white/60"
        title="Emergency SOS (అత్యవసర సహాయం)"
      >
        <span className="absolute -top-1 -right-1 bg-yellow-400 text-red-900 text-[9px] font-black px-1.5 py-0.2 rounded-full shadow-xs uppercase">
          SOS
        </span>
        <AlertTriangle className="w-6 h-6 text-white group-hover:scale-110 transition-transform animate-pulse" />
      </Link>

      {/* 2. AI Voice Assistant Floating Action Button */}
      <button
        onClick={openVoiceModal}
        className="group relative w-13 h-13 sm:w-14 sm:h-14 bg-gradient-to-tr from-green-700 to-emerald-500 text-white rounded-full flex items-center justify-center shadow-xl shadow-green-900/30 hover:scale-110 active:scale-95 transition-all border-2 border-white/60 cursor-pointer"
        title="AI Voice Assistant (AI వాయిస్ అసిస్టెంట్)"
      >
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center shadow-xs">
          <Sparkles className="w-2.5 h-2.5 text-green-900" />
        </div>
        <Mic className={`w-6 h-6 sm:w-7 sm:h-7 ${isSpeaking ? 'animate-bounce' : 'group-hover:scale-110'} transition-transform text-white`} />
      </button>
    </div>
  );
}
