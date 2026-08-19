// src/services/voiceService.js
// Universal Voice Service for GramVikas:
// High-Fidelity Audio Streaming TTS (Telugu, Hindi, English) + Web Speech API STT (Voice Input)

import { API_BASE_URL } from './api';

class VoiceService {
  constructor() {
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.currentAudio = null;
    this.recognition = null;
    this.isListening = false;
    this.isPlayingAudio = false;

    this.initRecognition();
  }

  initRecognition() {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
    }
  }

  getLanguageCode(lang = 'en') {
    switch (lang) {
      case 'te': return 'te-IN'; // Telugu
      case 'hi': return 'hi-IN'; // Hindi
      default: return 'en-IN'; // Indian English
    }
  }

  /**
   * High-fidelity TTS: Streams full sentences in native Telugu, Hindi, or English.
   * Guarantees that Telugu words are NEVER skipped or reduced to numbers only.
   */
  speak(text, lang = 'en', onEnd = null) {
    if (!text) return;
    this.stopSpeaking();

    // Clean formatting characters
    const cleanText = text
      .replace(/[*_#`~[\]]/g, '')
      .replace(/₹/g, 'రూపాయలు ')
      .replace(/%/g, ' శాతం ')
      .trim();

    if (!cleanText) return;

    // Use backend streaming TTS endpoint
    try {
      const baseUrl = API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`;
      const ttsUrl = `${baseUrl}/assistant/tts?text=${encodeURIComponent(cleanText)}&lang=${lang}`;

      this.currentAudio = new Audio(ttsUrl);
      this.isPlayingAudio = true;

      this.currentAudio.onended = () => {
        this.isPlayingAudio = false;
        this.currentAudio = null;
        if (onEnd) onEnd();
      };

      this.currentAudio.onerror = (err) => {
        console.warn('Audio streaming fallback to Web Speech:', err);
        this.isPlayingAudio = false;
        this.fallbackWebSpeech(cleanText, lang, onEnd);
      };

      this.currentAudio.play().catch((playErr) => {
        console.warn('Audio play autoplay policy fallback:', playErr);
        this.isPlayingAudio = false;
        this.fallbackWebSpeech(cleanText, lang, onEnd);
      });
    } catch (e) {
      console.warn('TTS streaming init error:', e);
      this.fallbackWebSpeech(cleanText, lang, onEnd);
    }
  }

  fallbackWebSpeech(text, lang = 'en', onEnd = null) {
    if (!this.synth) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = this.getLanguageCode(lang);
    utterance.rate = 0.92;
    utterance.pitch = 1.0;

    if (onEnd) {
      utterance.onend = onEnd;
    }

    this.synth.speak(utterance);
  }

  stopSpeaking() {
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch (e) {}
      this.currentAudio = null;
    }
    this.isPlayingAudio = false;

    if (this.synth && this.synth.speaking) {
      this.synth.cancel();
    }
  }

  isSpeaking() {
    return this.isPlayingAudio || (this.synth ? this.synth.speaking : false);
  }

  // Listen to user voice input via Web Speech API
  listen({ lang = 'en', onResult, onError, onStart, onEnd }) {
    if (!this.recognition) {
      this.initRecognition();
    }
    if (!this.recognition) {
      if (onError) onError('Speech recognition is not supported on this browser.');
      return;
    }

    this.recognition.lang = this.getLanguageCode(lang);

    this.recognition.onstart = () => {
      this.isListening = true;
      if (onStart) onStart();
    };

    this.recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (onResult) onResult(transcript);
    };

    this.recognition.onerror = (event) => {
      this.isListening = false;
      if (onError) onError(event.error);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      if (onEnd) onEnd();
    };

    try {
      this.recognition.start();
    } catch (e) {
      console.warn('Recognition already active:', e);
    }
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  // Helper to parse spoken numbers & parameters
  parseSoilValuesFromSpeech(transcript) {
    const text = transcript.toLowerCase();
    const values = {};

    const nMatch = text.match(/(?:n|nitrogen|నత్రజని|नाइट्रोजन)\s*(?:is|=|:)?\s*(\d+(\.\d+)?)/i);
    if (nMatch) values.nitrogen = parseFloat(nMatch[1]);

    const pMatch = text.match(/(?:p|phosphorus|భాస్వరం|फास्फोरस)\s*(?:is|=|:)?\s*(\d+(\.\d+)?)/i);
    if (pMatch) values.phosphorus = parseFloat(pMatch[1]);

    const kMatch = text.match(/(?:k|potassium|పొటాషియం|पोटेशियम)\s*(?:is|=|:)?\s*(\d+(\.\d+)?)/i);
    if (kMatch) values.potassium = parseFloat(kMatch[1]);

    const phMatch = text.match(/(?:ph|పిహెచ్|पीएच)\s*(?:is|=|:)?\s*(\d+(\.\d+)?)/i);
    if (phMatch) values.ph = parseFloat(phMatch[1]);

    const numbers = text.match(/\b\d+(\.\d+)?\b/g);
    if (numbers && numbers.length >= 3 && Object.keys(values).length === 0) {
      values.nitrogen = parseFloat(numbers[0]);
      values.phosphorus = parseFloat(numbers[1]);
      values.potassium = parseFloat(numbers[2]);
      if (numbers.length >= 4) values.ph = parseFloat(numbers[3]);
    }

    return values;
  }
}

export const voiceService = new VoiceService();
export default voiceService;
