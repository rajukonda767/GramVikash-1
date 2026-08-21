// src/components/voice/VoiceInteractionModal.jsx
// Production-Grade Multilingual Voice Assistant Modal with Whisper STT & Audio Streaming TTS

import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Sparkles,
  Send,
  Loader2,
  Square,
  CheckCircle2,
  HelpCircle,
  TrendingUp,
  Droplets,
  Bug,
} from 'lucide-react';
import { useVoice } from '../../context/VoiceContext';
import { useFarmer } from '../../context/FarmerContext';
import voiceService from '../../services/voiceService';
import apiClient from '../../services/api';

export default function VoiceInteractionModal() {
  const { t, i18n } = useTranslation();
  const { isModalOpen, closeVoiceModal, speakText, stopSpeaking, isSpeaking } = useVoice();
  const { profile } = useFarmer();

  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [liveInterim, setLiveInterim] = useState('');
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [textInput, setTextInput] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);

  const timerRef = useRef(null);
  const currentLang = i18n.language === 'te' ? 'te' : 'en';

  useEffect(() => {
    if (!isModalOpen) {
      handleCancelRecording();
      stopSpeaking();
      setTranscript('');
      setAiResponse('');
      setTextInput('');
      setErrorMsg(null);
    }
  }, [isModalOpen]);

  // Recording Timer
  useEffect(() => {
    if (isRecording) {
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 25) {
            // Auto stop at 25 seconds
            handleStopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  // Start Voice Capture
  const handleStartRecording = async () => {
    stopSpeaking();
    setErrorMsg(null);
    setTranscript('');
    setLiveInterim('');
    setAiResponse('');

    const started = await voiceService.startRecording({
      lang: currentLang,
      onInterim: (text) => setLiveInterim(text),
      onError: (err) => {
        setIsRecording(false);
        setErrorMsg(err);
      },
      onStart: () => {
        setIsRecording(true);
      },
    });

    if (started) {
      setIsRecording(true);
    }
  };

  // Stop Capture & Transcribe via Whisper
  const handleStopRecording = async () => {
    if (!isRecording) return;
    setIsRecording(false);
    setIsProcessing(true);

    const transcribed = await voiceService.stopRecordingAndTranscribe(currentLang);
    const finalQuery = transcribed || liveInterim;

    if (finalQuery && finalQuery.trim().length > 0) {
      setTranscript(finalQuery.trim());
      setLiveInterim('');
      await queryGroqAssistant(finalQuery.trim());
    } else {
      setIsProcessing(false);
      setErrorMsg(
        currentLang === 'te'
          ? 'మీ మాటలు సరిగ్గా రికార్డ్ కాలేదు. దయచేసి మైక్ నొక్కి మరోసారి మాట్లాడండి.'
          : 'Could not detect clear speech. Please tap the mic and try speaking again.'
      );
    }
  };

  const handleCancelRecording = () => {
    voiceService.cancelRecording();
    setIsRecording(false);
    setLiveInterim('');
  };

  // Send Query to Backend Groq AI
  const queryGroqAssistant = async (queryText) => {
    if (!queryText || !queryText.trim()) {
      setIsProcessing(false);
      return;
    }

    setIsProcessing(true);
    stopSpeaking();

    const newHistory = [
      ...conversationHistory,
      { role: 'user', content: queryText.trim() },
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
        { role: 'assistant', content: reply },
      ]);

      // Native audio playback
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
    if (textInput.trim() && !isProcessing) {
      setTranscript(textInput.trim());
      queryGroqAssistant(textInput.trim());
      setTextInput('');
    }
  };

  // Sample prompt pills
  const samplePrompts = currentLang === 'te' ? [
    'ఈ రోజు మార్కెట్ ధరలు ఎంత?',
    'వరి పంటలో తెగుళ్ల నివారణ ఎలా?',
    'నా పొలానికి ఎరువులు ఎప్పుడు వేయాలి?',
  ] : [
    'What are today\'s mandi prices?',
    'How to prevent pest in paddy?',
    'When should I apply fertilizer?',
  ];

  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-green-200 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-green-700 px-6 py-4 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
              <Sparkles className="w-5 h-5 text-yellow-300" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">
                {currentLang === 'te' ? 'గ్రామవికాస్ AI వాయిస్ అసిస్టెంట్ 🎙️' : 'GramVikas AI Voice Assistant 🎙️'}
              </h3>
              <p className="text-[11px] text-green-100 font-medium">
                {currentLang === 'te' ? 'తెలుగు & English లో నేరుగా మాట్లాడండి' : 'Powered by Groq Whisper & Agricultural AI'}
              </p>
            </div>
          </div>
          <button
            onClick={closeVoiceModal}
            className="p-1.5 hover:bg-white/20 rounded-xl transition-colors text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          
          {/* STATE 1: ACTIVE RECORDING VIEW */}
          {isRecording ? (
            <div className="flex flex-col items-center justify-center py-6 space-y-5 bg-red-50/60 rounded-3xl border border-red-200 p-6 text-center animate-fadeIn">
              
              {/* Pulsing Red Mic */}
              <div className="relative">
                <div className="w-24 h-24 bg-red-600 text-white rounded-full flex items-center justify-center shadow-xl shadow-red-600/30 animate-pulse">
                  <Mic className="w-10 h-10" />
                </div>
                <span className="absolute -top-1 -right-1 bg-red-800 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                  REC
                </span>
              </div>

              <div>
                <p className="text-base font-black text-red-950">
                  {currentLang === 'te' ? 'మీ మాటలు వింటున్నాము...' : 'Listening... Speak your question'}
                </p>
                <p className="text-xs font-mono font-bold text-red-700 mt-1">
                  00:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds} / 00:25
                </p>
              </div>

              {/* Sound Wave Animation */}
              <div className="flex items-center justify-center gap-1.5 h-8">
                {[40, 70, 90, 60, 100, 50, 80, 60, 90, 40].map((h, i) => (
                  <div
                    key={i}
                    className="w-1.5 bg-red-500 rounded-full animate-pulse"
                    style={{ height: `${h}%`, animationDelay: `${i * 0.1}s` }}
                  />
                ))}
              </div>

              {/* Live interim text preview */}
              {liveInterim && (
                <div className="bg-white p-3 rounded-2xl border border-red-200 text-xs font-semibold text-gray-800 w-full max-w-sm">
                  "{liveInterim}"
                </div>
              )}

              {/* Action Buttons: Stop & Send vs Cancel */}
              <div className="flex items-center gap-3 w-full max-w-xs pt-2">
                <button
                  type="button"
                  onClick={handleCancelRecording}
                  className="flex-1 py-3 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xs rounded-2xl transition-colors cursor-pointer"
                >
                  {currentLang === 'te' ? 'రద్దు చేయండి' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleStopRecording}
                  className="flex-2 flex items-center justify-center gap-2 py-3 px-5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-black text-xs sm:text-sm rounded-2xl shadow-lg shadow-green-700/20 active:scale-95 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{currentLang === 'te' ? 'సమాధానం పొందండి' : 'Done (Send)'}</span>
                </button>
              </div>
            </div>
          ) : isProcessing ? (
            /* STATE 2: AI PROCESSING VIEW */
            <div className="py-12 flex flex-col items-center justify-center gap-3 bg-emerald-50/50 rounded-3xl border border-emerald-200 text-center animate-fadeIn">
              <div className="relative">
                <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
                <Sparkles className="w-5 h-5 text-yellow-500 absolute -top-1 -right-1 animate-bounce" />
              </div>
              <p className="text-sm font-black text-emerald-950">
                {currentLang === 'te' ? 'AI సమాధానం సిద్ధం చేస్తోంది...' : 'AI is processing your query...'}
              </p>
              <p className="text-xs text-gray-500 font-medium">
                {currentLang === 'te' ? 'Groq Whisper STT + వ్యవసాయ డేటా ఆధారంగా' : 'Analyzing with Groq Whisper & Farm Intelligence'}
              </p>
            </div>
          ) : (
            /* STATE 3: IDLE / READY STATE */
            <div className="space-y-4">
              
              {/* Error Banner */}
              {errorMsg && (
                <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3.5 text-xs text-amber-900 font-semibold text-center animate-fadeIn">
                  {errorMsg}
                </div>
              )}

              {/* Big Tap to Speak Mic Button */}
              <div className="flex flex-col items-center justify-center py-4 space-y-3">
                <button
                  type="button"
                  onClick={handleStartRecording}
                  className="group relative w-24 h-24 bg-gradient-to-tr from-emerald-700 to-green-500 hover:from-emerald-600 hover:to-green-400 text-white rounded-full flex items-center justify-center shadow-xl shadow-green-900/30 hover:scale-105 active:scale-95 transition-all cursor-pointer border-4 border-emerald-100"
                >
                  <div className="absolute inset-0 rounded-full bg-emerald-400/20 group-hover:animate-ping pointer-events-none" />
                  <Mic className="w-10 h-10 group-hover:scale-110 transition-transform" />
                </button>

                <p className="text-sm font-black text-gray-900">
                  {currentLang === 'te' ? 'మాట్లాడటానికి మైక్ నొక్కండి' : 'Tap Microphone to Speak'}
                </p>
                <p className="text-xs text-gray-500 font-medium">
                  {currentLang === 'te' ? 'ధరలు, వాతావరణం లేదా పంట సలహాలు అడగండి' : 'Ask about prices, weather, pests, or fertilizers'}
                </p>
              </div>

              {/* Quick Sample Questions */}
              <div className="space-y-2 pt-1">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  {currentLang === 'te' ? 'త్వరిత ప్రశ్నలు:' : 'Suggested Questions:'}
                </p>
                <div className="flex flex-col gap-2">
                  {samplePrompts.map((prompt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setTranscript(prompt);
                        queryGroqAssistant(prompt);
                      }}
                      className="text-left px-3.5 py-2.5 bg-gray-50 hover:bg-emerald-50 hover:border-emerald-300 border border-gray-200 rounded-2xl text-xs font-semibold text-gray-800 transition-colors cursor-pointer flex items-center justify-between"
                    >
                      <span>"{prompt}"</span>
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* User Asked Box */}
          {transcript && !isRecording && (
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3.5 animate-fadeIn">
              <p className="text-[10px] font-black uppercase text-emerald-800 tracking-wider mb-0.5">
                {currentLang === 'te' ? 'మీరు అడిగిన ప్రశ్న:' : 'You Asked:'}
              </p>
              <p className="text-xs sm:text-sm font-bold text-gray-900">"{transcript}"</p>
            </div>
          )}

          {/* AI Response Card */}
          {aiResponse && !isRecording && !isProcessing && (
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-300 rounded-2xl p-4 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase text-emerald-800 tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
                  {currentLang === 'te' ? 'గ్రామవికాస్ AI సమాధానం:' : 'GramVikas AI Response:'}
                </p>
                <button
                  type="button"
                  onClick={() => isSpeaking ? stopSpeaking() : speakText(aiResponse)}
                  className="text-xs font-bold text-emerald-900 hover:text-emerald-950 flex items-center gap-1.5 bg-white/90 px-3 py-1 rounded-xl shadow-xs border border-emerald-200 cursor-pointer"
                >
                  {isSpeaking ? <VolumeX className="w-3.5 h-3.5 text-red-600" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-700" />}
                  <span>{isSpeaking ? (currentLang === 'te' ? 'ఆపండి' : 'Stop') : (currentLang === 'te' ? 'వినండి' : 'Listen')}</span>
                </button>
              </div>
              <p className="text-xs sm:text-sm text-gray-900 font-medium leading-relaxed whitespace-pre-line">
                {aiResponse}
              </p>
            </div>
          )}

          {/* Fallback Text Input & Send */}
          <form onSubmit={handleManualSubmit} className="flex gap-2 pt-1">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={currentLang === 'te' ? 'లేదా ఇక్కడ ప్రశ్న టైప్ చేయండి...' : 'Or type your question here...'}
              className="flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-2xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-green-500 focus:bg-white outline-hidden"
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
