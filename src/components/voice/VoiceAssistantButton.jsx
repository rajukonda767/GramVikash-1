// src/components/voice/VoiceAssistantButton.jsx
import React from 'react';
import { Mic, Sparkles } from 'lucide-react';
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

  // Floating Action Button
  return (
    <div className={`fixed bottom-20 lg:bottom-8 right-6 z-40 flex flex-col items-center gap-2 ${className}`}>
      <button
        onClick={openVoiceModal}
        className="group relative w-14 h-14 bg-gradient-to-tr from-green-700 to-emerald-500 text-white rounded-full flex items-center justify-center shadow-xl shadow-green-600/40 hover:scale-110 active:scale-95 transition-all"
        title="Open GramVikas Voice Assistant (వాయిస్ అసిస్టెంట్)"
      >
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center shadow-sm">
          <Sparkles className="w-2.5 h-2.5 text-green-900" />
        </div>
        <Mic className={`w-7 h-7 ${isSpeaking ? 'animate-bounce' : 'group-hover:scale-110'} transition-transform`} />
      </button>
    </div>
  );
}
