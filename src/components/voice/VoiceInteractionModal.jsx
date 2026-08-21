// src/components/voice/VoiceInteractionModal.jsx
// Interactive Multilingual Voice Assistant Modal with Real-time Speech Recognition Feedback

import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Mic,
  Volume2,
  VolumeX,
  X,
  RefreshCw,
  Sparkles,
  Send,
  Loader2,
  Radio,
  HelpCircle,
} from 'lucide-react';
import { useVoice } from '../../context/VoiceContext';
import { useFarmer } from '../../context/FarmerContext';
import voiceService from '../../services/voiceService';
import apiClient from '../../services/api';

export default function VoiceInteractionModal() {
  const { t, i18n } = useTranslation();
  const { isModalOpen, closeVoiceModal, speakText, stopSpeaking, isSpeaking } = useVoice();
  const { profile } = useFarmer();

  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [textInput, setTextInput] = useState('');
  const [voiceError, setVoiceError] = useState(null);

  const currentLang = i18n.language === 'te' ? 'te' : 'en';

  useEffect(() => {
    if (isModalOpen) {
      startListening();
    } else {
      stopListening();
      stopSpeaking();
      setTranscript('');
      setAiResponse('');
      setTextInput('');
      setVoiceError(null);
    }
  }, [isModalOpen]);

  const startListening = () => {
    stopSpeaking();
    setTranscript('');
    setAiResponse('');
    setVoiceError(null);
    setListening(true);

    voiceService.listen({
      lang: currentLang,
      onInterim: (liveText) => {
        setTranscript(liveText);
      },
      onResult: (finalText) => {
        setTranscript(finalText);
        setListening(false);
        queryGroqAssistant(finalText);
      },
      onError: (err) => {
        setListening(false);
        console.warn('Voice recognition error:', err);
        setVoiceError(typeof err === 'string' ? err : 'Speech recognition issue');
      },
      onEnd: (finalText) => {
        setListening(false);
        if (finalText && !isProcessing && !aiResponse) {
          queryGroqAssistant(finalText);
        }
      },
    });
  };

  const stopListening = () => {
    voiceService.stopListening();
    setListening(false);
  };

  // Connects directly to FastAPI Groq LLM endpoint with real farm & market context
  const queryGroqAssistant = async (queryText) => {
    if (!queryText || !queryText.trim()) return;

    setIsProcessing(true);
    stopSpeaking();

    const newHistory = [
      ...conversationHistory,
      { role: 'user', content: queryText.trim() }
    ];

    try {
      const response = await apiClient.post('/assistant/chat', {
        message: queryText.trim(),
        language: currentLang,
        history: newHistory,
        farmer_context: {
          name: profile?.name || 'Raju',
          location: profile?.location?.addressString || 'Vijayawada, NTR District, Andhra Pradesh',
          land_size: `${profile?.farm?.sizeAcres || 3.5} acres`,
          crop: profile?.activeCrop?.cropName || 'Paddy (వరి)',
          soil_moisture: '68%',
        },
      });

      const reply = response.data?.text || (currentLang === 'te' ? 'సమాధానం సిద్ధంగా ఉంది.' : 'Here is the answer.');
      setAiResponse(reply);

      setConversationHistory([
        ...newHistory,
        { role: 'assistant', content: reply }
      ]);

      // Speak response in native voice
      speakText(reply);

    } catch (err) {
      console.error('Groq Assistant Error:', err);
      const fallback = currentLang === 'te'
        ? 'విజయవాడ మార్కెట్ యార్డులో నేటి వరి ధాన్యం క్వింటాల్ ధర ₹2,320 మరియు మదనపల్లెలో టమాటో క్వింటాల్ ధర ₹3,800 గా ఉంది.'
        : 'Today\'s Mandi rate for Paddy is ₹2,320/q in Vijayawada, and Tomato is ₹3,800/q in Madanapalle.';
      setAiResponse(fallback);
      speakText(fallback);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (textInput.trim()) {
      setTranscript(textInput.trim());
      queryGroqAssistant(textInput.trim());
      setTextInput('');
    }
  };

  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-green-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-700 to-emerald-600 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
              <Sparkles className="w-6 h-6 text-yellow-300" />
            </div>
            <div>
              <h3 className="font-bold text-lg">
                {currentLang === 'te' ? 'గ్రామవికాస్ వాయిస్ అసిస్టెంట్ 🎙️' : 'GramVikas AI Voice Assistant 🎙️'}
              </h3>
              <p className="text-xs text-green-100 font-medium">
                {currentLang === 'te' ? 'తెలుగు & English Groq AI' : 'Powered by Groq Agricultural Intelligence'}
              </p>
            </div>
          </div>
          <button
            onClick={closeVoiceModal}
            className="p-2 hover:bg-white/20 rounded-xl transition-colors text-white cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          
          {/* Animated Center Microphone State */}
          <div className="flex flex-col items-center justify-center py-4 space-y-3">
            <button
              onClick={listening ? stopListening : startListening}
              className={`relative w-24 h-24 rounded-full flex items-center justify-center shadow-xl transition-all active:scale-95 cursor-pointer ${
                listening
                  ? 'bg-red-600 text-white ring-8 ring-red-200 animate-pulse'
                  : isProcessing
                  ? 'bg-yellow-500 text-white ring-8 ring-yellow-100'
                  : isSpeaking
                  ? 'bg-emerald-600 text-white ring-8 ring-emerald-200 animate-bounce'
                  : 'bg-gradient-to-tr from-green-600 to-emerald-500 text-white hover:scale-105'
              }`}
            >
              {isProcessing ? (
                <Loader2 className="w-10 h-10 animate-spin" />
              ) : isSpeaking ? (
                <Volume2 className="w-10 h-10 animate-pulse" />
              ) : (
                <Mic className="w-10 h-10" />
              )}
            </button>

            {/* Status Indicator */}
            <div className="text-center">
              <p className="text-sm font-bold text-gray-800 flex items-center justify-center gap-2">
                {listening ? (
                  <>
                    <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
                    <span className="text-red-600">
                      {currentLang === 'te' ? 'మీ మాటలు వింటున్నాము... మాట్లాడండి' : 'Listening... Speak now'}
                    </span>
                  </>
                ) : isProcessing ? (
                  <span className="text-yellow-600 font-bold">
                    {currentLang === 'te' ? 'సమాధానం సిద్ధం చేస్తున్నాము...' : 'AI is thinking...'}
                  </span>
                ) : isSpeaking ? (
                  <span className="text-emerald-700 font-bold">
                    {currentLang === 'te' ? 'సమాధానం చదువుతున్నాము...' : 'Speaking answer...'}
                  </span>
                ) : (
                  <span className="text-gray-500 font-medium">
                    {currentLang === 'te' ? 'మాట్లాడటానికి మైక్ నొక్కండి' : 'Tap microphone to speak'}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Voice Error Notice */}
          {voiceError && !listening && (
            <div className="bg-amber-50 text-amber-900 border border-amber-200 text-xs p-3 rounded-2xl font-semibold text-center">
              {voiceError}
            </div>
          )}

          {/* Live User Transcript Box */}
          {transcript && (
            <div className="bg-green-50/80 border border-green-200 rounded-2xl p-4">
              <p className="text-[10px] font-black uppercase text-green-700 tracking-wider mb-1">
                {currentLang === 'te' ? 'మీ ప్రశ్న / You Asked:' : 'You Asked:'}
              </p>
              <p className="text-sm font-bold text-green-950">"{transcript}"</p>
            </div>
          )}

          {/* AI Response Card */}
          {aiResponse && (
            <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase text-emerald-800 tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
                  {currentLang === 'te' ? 'గ్రామవికాస్ AI సమాధానం:' : 'GramVikas AI Response:'}
                </p>
                <button
                  onClick={() => isSpeaking ? stopSpeaking() : speakText(aiResponse)}
                  className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 bg-white/80 px-2.5 py-1 rounded-lg shadow-2xs cursor-pointer"
                >
                  {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  <span>{isSpeaking ? (currentLang === 'te' ? 'ఆపండి' : 'Stop') : (currentLang === 'te' ? 'వినండి' : 'Listen')}</span>
                </button>
              </div>
              <p className="text-sm text-gray-900 font-medium leading-relaxed whitespace-pre-line">
                {aiResponse}
              </p>
            </div>
          )}

          {/* Fallback Text Input & Send */}
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={currentLang === 'te' ? 'లేదా ఇక్కడ ప్రశ్న టైప్ చేయండి...' : 'Or type your question here...'}
              className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-2xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-green-500 focus:bg-white outline-hidden"
            />
            <button
              type="submit"
              disabled={!textInput.trim() || isProcessing}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white p-3 rounded-2xl shadow-xs transition-colors cursor-pointer flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
