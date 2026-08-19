// src/context/VoiceContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import voiceService from '../services/voiceService';

const VoiceContext = createContext();

export function VoiceProvider({ children }) {
  const { i18n } = useTranslation();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [autoSpeakEnabled, setAutoSpeakEnabled] = useState(true);

  // Stop speaking when user changes language or unmounts
  useEffect(() => {
    voiceService.stopSpeaking();
    setIsSpeaking(false);
  }, [i18n.language]);

  const speakText = (textObjOrString) => {
    if (!textObjOrString) return;

    let textToSpeak = '';
    const currentLang = i18n.language || 'en';

    if (typeof textObjOrString === 'object') {
      textToSpeak = textObjOrString[currentLang] || textObjOrString['en'] || Object.values(textObjOrString)[0];
    } else {
      textToSpeak = textObjOrString;
    }

    setIsSpeaking(true);
    voiceService.speak(textToSpeak, currentLang, () => {
      setIsSpeaking(false);
    });
  };

  const stopSpeaking = () => {
    voiceService.stopSpeaking();
    setIsSpeaking(false);
  };

  const openVoiceModal = () => {
    stopSpeaking();
    setIsModalOpen(true);
  };

  const closeVoiceModal = () => {
    stopSpeaking();
    setIsModalOpen(false);
  };

  return (
    <VoiceContext.Provider
      value={{
        isSpeaking,
        isModalOpen,
        autoSpeakEnabled,
        setAutoSpeakEnabled,
        speakText,
        stopSpeaking,
        openVoiceModal,
        closeVoiceModal,
      }}
    >
      {children}
    </VoiceContext.Provider>
  );
}

export function useVoice() {
  const context = useContext(VoiceContext);
  if (!context) {
    throw new Error('useVoice must be used within a VoiceProvider');
  }
  return context;
}
