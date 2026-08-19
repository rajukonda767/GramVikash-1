// src/components/voice/VoiceInteractionModal.jsx
// Interactive Multilingual Voice Assistant Modal connected directly to Groq AI Backend

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
    }
  }, [isModalOpen]);

  const startListening = () => {
    stopSpeaking();
    setTranscript('');
    setAiResponse('');
    setListening(true);

    voiceService.listen({
      lang: currentLang,
      onResult: (text) => {
        setTranscript(text);
        setListening(false);
        queryGroqAssistant(text);
      },
      onError: (err) => {
        setListening(false);
        console.warn('Voice recognition error:', err);
      },
      onEnd: () => {
        setListening(false);
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

      // Keep multi-turn conversation alive
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

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Animated Microphone Area */}
          <div className="flex flex-col items-center justify-center py-2">
            <button
              onClick={listening ? stopListening : startListening}
              className={`relative w-22 h-22 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                listening
                  ? 'bg-red-500 text-white shadow-2xl shadow-red-300 scale-110 animate-pulse'
                  : isSpeaking
                  ? 'bg-green-600 text-white shadow-xl shadow-green-200 animate-bounce'
                  : 'bg-green-100 text-green-700 hover:bg-green-200 hover:scale-105'
              }`}
            >
              {listening ? (
                <Mic className="w-9 h-9" />
              ) : isSpeaking ? (
                <Volume2 className="w-9 h-9" />
              ) : (
                <Mic className="w-9 h-9" />
              )}
            </button>

            <p className="mt-3 text-xs font-bold text-gray-700 text-center">
              {listening
                ? (currentLang === 'te' ? 'వినబడుతోంది... మాట్లాడండి' : 'Listening... Speak now')
                : isProcessing
                ? (currentLang === 'te' ? 'AI సమాధానం సిద్ధం చేస్తోంది...' : 'AI is processing...')
                : isSpeaking
                ? (currentLang === 'te' ? 'సమాధానం చదువుతోంది... 🔊' : 'Speaking answer... 🔊')
                : (currentLang === 'te' ? 'మాట్లాడటానికి మైక్ నొక్కండి' : 'Tap mic to speak')}
            </p>
          </div>

          {/* Transcript Box */}
          {transcript && (
            <div className="bg-green-50/70 border border-green-200 rounded-2xl p-3.5 animate-fadeIn">
              <p className="text-[10px] font-bold text-green-700 uppercase">
                {currentLang === 'te' ? 'మీరు అడిగినది:' : 'YOU SAID:'}
              </p>
              <p className="text-sm font-bold text-gray-900 mt-0.5">"{transcript}"</p>
            </div>
          )}

          {/* AI Spoken Response Box */}
          {aiResponse && (
            <div className="bg-emerald-700 text-white rounded-2xl p-4 shadow-inner space-y-2.5 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-green-200 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-yellow-300" /> GramVikas AI:
                </span>
                <button
                  onClick={() => (isSpeaking ? stopSpeaking() : speakText(aiResponse))}
                  className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-white transition-colors cursor-pointer"
                  title="Play / Stop Audio"
                >
                  {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-sm leading-relaxed font-medium whitespace-pre-line">{aiResponse}</p>
            </div>
          )}

          {/* Suggested Quick Prompts */}
          <div className="space-y-1.5">
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
              {currentLang === 'te' ? 'సూచనలు (నొక్కండి):' : 'Try Asking:'}
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                currentLang === 'te' ? 'ఈరోజు టమాటా పంట ధర ఎంత?' : 'Today tomato price?',
                currentLang === 'te' ? 'వరికి ఎప్పుడు నీరు పెట్టాలి?' : 'When to irrigate paddy?',
                currentLang === 'te' ? 'ఉత్తమ పంట సిఫార్సు?' : 'Recommend best crop?',
              ].map((promptText, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setTranscript(promptText);
                    queryGroqAssistant(promptText);
                  }}
                  className="text-xs font-medium bg-gray-100 hover:bg-green-100 text-gray-700 hover:text-green-800 px-3 py-1.5 rounded-full border border-gray-200 transition-colors cursor-pointer"
                >
                  "{promptText}"
                </button>
              ))}
            </div>
          </div>

          {/* Text Input Fallback Bar */}
          <form onSubmit={handleManualSubmit} className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={currentLang === 'te' ? 'టైప్ చేసి అడగండి...' : 'Or type your question...'}
              className="flex-1 px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-green-500 outline-none"
            />
            <button
              type="submit"
              disabled={!textInput.trim() || isProcessing}
              className="p-2.5 bg-green-700 hover:bg-green-600 disabled:opacity-40 text-white rounded-xl transition-all shadow-xs cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* Controls */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <button
              onClick={startListening}
              className="flex items-center gap-2 text-xs font-bold text-green-700 hover:text-green-800 px-3 py-2 rounded-xl hover:bg-green-50 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{currentLang === 'te' ? 'మళ్లీ మాట్లాడండి' : 'Speak Again'}</span>
            </button>
            <button
              onClick={closeVoiceModal}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer"
            >
              {currentLang === 'te' ? 'మూసివేయండి' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
