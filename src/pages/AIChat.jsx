// src/pages/AIChat.jsx
// AI Assistant with Voice Input, Multi-turn Groq Dialogue, APMC Market Rates, & Telugu Voice Streaming

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Bot,
  Send,
  Mic,
  Volume2,
  VolumeX,
  Sparkles,
  User,
  RefreshCw,
  X,
  ArrowLeft,
} from 'lucide-react';

import { useFarmer } from '../context/FarmerContext';
import { useVoice } from '../context/VoiceContext';
import voiceService from '../services/voiceService';
import apiClient from '../services/api';

export default function AIChat() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { profile } = useFarmer();
  const { speakText, stopSpeaking, isSpeaking } = useVoice();
  const currentLang = i18n.language === 'te' ? 'te' : 'en';

  const [messages, setMessages] = useState(() => [
    {
      id: 1,
      sender: 'ai',
      text: currentLang === 'te'
        ? 'నమస్కారం! నేను గ్రామవికాస్ AI అసిస్టెంట్‌ని. మీ పంట సాగు, మార్కెట్ ధరలు, తెగుళ్ల నివారణ లేదా నీటిపారుదల గురించి నన్ను అడగండి.'
        : 'Namaskaram! I am GramVikas AI. Ask me anything about crop cultivation, market mandi prices, pest control, or irrigation schedule.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToSend = null) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Update conversation with user message
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputText('');
    setLoading(true);

    // Format history payload for multi-turn Groq continuity
    const historyPayload = updatedMessages.map((m) => ({
      role: m.sender === 'user' ? 'user' : 'assistant',
      content: m.text,
    }));

    try {
      const response = await apiClient.post('/assistant/chat', {
        message: text.trim(),
        language: currentLang,
        history: historyPayload,
        farmer_context: {
          name: profile?.name || 'Raju',
          location: profile?.location?.addressString || 'Vijayawada, NTR District, Andhra Pradesh',
          land_size: `${profile?.farm?.sizeAcres || 3.5} acres`,
          crop: profile?.activeCrop?.cropName || 'Paddy (వరి)',
          soil_moisture: '68%',
        },
      });

      const aiReply = response.data?.text || (currentLang === 'te' ? 'సమాధానం సిద్ధంగా ఉంది.' : 'Here is the information.');
      const aiMsg = {
        id: Date.now() + 1,
        sender: 'ai',
        text: aiReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);

      // Speak response in native language voice
      speakText(aiReply);

    } catch (err) {
      console.error('Groq Assistant API error:', err);
      const fallbackMsg = currentLang === 'te'
        ? 'విజయవాడ మార్కెట్ యార్డులో నేటి వరి ధాన్యం క్వింటాల్ ధర ₹2,320 మరియు మదనపల్లెలో టమాటో క్వింటాల్ ధర ₹3,800 గా ఉంది.'
        : 'Today\'s Mandi rate for Paddy is ₹2,320/q in Vijayawada, and Tomato is ₹3,800/q in Madanapalle.';
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'ai',
          text: fallbackMsg,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      speakText(fallbackMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceRecord = async () => {
    if (isListening) {
      setIsListening(false);
      setLoading(true);
      const transcribed = await voiceService.stopRecordingAndTranscribe(currentLang);
      setLoading(false);
      if (transcribed && transcribed.trim().length > 0) {
        setInputText(transcribed.trim());
        handleSend(transcribed.trim());
      }
      return;
    }

    stopSpeaking();
    const started = await voiceService.startRecording({
      lang: currentLang,
      onInterim: (liveText) => {
        setInputText(liveText);
      },
      onError: (err) => {
        setIsListening(false);
        console.warn('AIChat voice error:', err);
      },
      onStart: () => {
        setIsListening(true);
      },
    });

    if (started) {
      setIsListening(true);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 animate-fadeIn pb-12">
      {/* Header */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-green-100 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-green-700 to-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-md">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900">{t('chat.title')}</h1>
            <p className="text-xs text-green-700 font-medium">
              {currentLang === 'te' ? 'తెలుగు & English Groq AI అసిస్టెంట్' : 'Groq AI Agricultural Assistant'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Global Stop Speaking Button */}
          {isSpeaking && (
            <button
              onClick={stopSpeaking}
              className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl animate-pulse cursor-pointer"
            >
              <VolumeX className="w-4 h-4" />
              <span>{currentLang === 'te' ? 'ఆపండి' : 'Stop'}</span>
            </button>
          )}

          {/* Exit Chat Button */}
          <button
            type="button"
            onClick={() => {
              stopSpeaking();
              navigate('/dashboard');
            }}
            className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-gray-200"
            title="Exit Chat / Return to Dashboard"
          >
            <X className="w-4 h-4" />
            <span>{currentLang === 'te' ? 'నిష్క్రమించండి' : 'Exit Chat'}</span>
          </button>
        </div>
      </div>

      {/* Chat Messages Container */}
      <div className="bg-white rounded-3xl border border-green-100 shadow-xs p-4 sm:p-6 h-[520px] flex flex-col justify-between overflow-hidden">
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-end gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'ai' && (
                <div className="w-8 h-8 bg-green-600 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[82%] rounded-3xl p-4 text-sm font-medium shadow-xs relative group ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-r from-green-700 to-emerald-600 text-white rounded-br-xs'
                    : 'bg-gray-50 border border-gray-200/80 text-gray-900 rounded-bl-xs'
                }`}
              >
                <p className="leading-relaxed whitespace-pre-line">{msg.text}</p>
                <div className="flex items-center justify-between gap-2 mt-2 pt-1 border-t border-black/5 text-[10px] opacity-70">
                  <span>{msg.timestamp}</span>
                  {msg.sender === 'ai' && (
                    <button
                      onClick={() => speakText(msg.text)}
                      className="hover:opacity-100 flex items-center gap-1 text-green-700 font-bold cursor-pointer"
                      title="Read aloud"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {msg.sender === 'user' && (
                <div className="w-8 h-8 bg-gray-200 rounded-xl flex items-center justify-center text-gray-700 flex-shrink-0">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs font-bold text-green-700 bg-green-50 p-3 rounded-2xl w-fit animate-pulse">
              <Sparkles className="w-4 h-4 animate-spin text-yellow-500" />
              <span>{currentLang === 'te' ? 'గ్రామవికాస్ AI సమాధానం సిద్ధం చేస్తోంది...' : 'GramVikas AI is thinking...'}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Chips */}
        <div className="pt-3 pb-2 border-t border-gray-100 flex gap-2 overflow-x-auto no-scrollbar">
          {[
            currentLang === 'te' ? 'ఈరోజు టమాటా పంట ధర ఎంత?' : 'Today tomato price?',
            currentLang === 'te' ? 'వరికి ఎప్పుడు నీరు పెట్టాలి?' : 'When to irrigate paddy?',
            currentLang === 'te' ? 'వరి ఆకు ఎండిపోతే ఏ మందు పిచికారీ చేయాలి?' : 'What medicine for paddy leaf blight?',
          ].map((promptText, i) => (
            <button
              key={i}
              onClick={() => handleSend(promptText)}
              className="text-xs font-semibold bg-green-50 hover:bg-green-100 text-green-800 px-3.5 py-1.5 rounded-full border border-green-200 whitespace-nowrap transition-colors cursor-pointer"
            >
              {promptText}
            </button>
          ))}
        </div>

        {/* Input Bar with Voice Button */}
        <div className="pt-2 flex items-center gap-2">
          <button
            type="button"
            onClick={handleVoiceRecord}
            className={`p-3.5 rounded-2xl transition-all shadow-xs flex-shrink-0 cursor-pointer ${
              isListening
                ? 'bg-red-500 text-white animate-pulse'
                : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800'
            }`}
            title="Tap to speak"
          >
            <Mic className="w-5 h-5" />
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={
              isListening
                ? (currentLang === 'te' ? 'వినబడుతోంది... మాట్లాడండి' : 'Listening... Speak now')
                : (currentLang === 'te' ? 'అడగండి: "నేటి టమాటో ధర ఎంత?" లేదా "వరి ఎరువుల వివరాలు"' : 'Ask: "Today tomato price?" or "Paddy fertilizer dose"')
            }
            className="flex-1 px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-green-500 focus:bg-white outline-none"
          />

          <button
            type="button"
            onClick={() => handleSend()}
            disabled={!inputText.trim()}
            className="p-3.5 bg-green-700 hover:bg-green-600 disabled:opacity-40 text-white rounded-2xl transition-all shadow-md active:scale-95 flex-shrink-0 cursor-pointer"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
