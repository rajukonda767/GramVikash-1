// src/services/voiceService.js
// High-Fidelity Audio Streaming TTS + Web Speech API Voice Recognition (STT)

import { API_BASE_URL } from './api';

class VoiceService {
  constructor() {
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.currentAudio = null;
    this.recognition = null;
    this.isListening = false;
    this.isPlayingAudio = false;
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
   */
  speak(text, lang = 'en', onEnd = null) {
    if (!text) return;
    this.stopSpeaking();

    // Clean markdown characters
    const cleanText = text
      .replace(/[*_#`~[\]]/g, '')
      .replace(/₹/g, 'రూపాయలు ')
      .replace(/%/g, ' శాతం ')
      .trim();

    if (!cleanText) return;

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

  /**
   * Universal Speech Recognition with Explicit Mic Permission and Live Interim Text
   */
  async listen({ lang = 'en', onResult, onInterim, onError, onStart, onEnd }) {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      if (onError) onError('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    // Explicitly request microphone permission if needed
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Release stream so SpeechRecognition can bind exclusively
        stream.getTracks().forEach((track) => track.stop());
      } catch (permErr) {
        console.warn('Microphone permission denied:', permErr);
        if (onError) onError('Microphone permission denied. Please allow microphone access in your browser settings.');
        return;
      }
    }

    try {
      if (this.recognition) {
        try { this.recognition.abort(); } catch (e) {}
      }

      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;
      this.recognition.lang = this.getLanguageCode(lang);

      let finalTranscript = '';

      this.recognition.onstart = () => {
        this.isListening = true;
        if (onStart) onStart();
      };

      this.recognition.onresult = (event) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const piece = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += piece;
          } else {
            interimTranscript += piece;
          }
        }

        const currentText = finalTranscript || interimTranscript;
        if (onInterim && currentText) {
          onInterim(currentText);
        }

        if (finalTranscript && onResult) {
          onResult(finalTranscript.trim());
        }
      };

      this.recognition.onerror = (event) => {
        this.isListening = false;
        console.warn('Speech recognition error event:', event.error);
        if (event.error === 'no-speech') {
          if (onError) onError(lang === 'te' ? 'మాటలు వినబడలేదు. దయచేసి మైక్ దగ్గర మాట్లాడండి.' : 'No speech detected. Please speak clearly into the microphone.');
        } else if (event.error === 'not-allowed') {
          if (onError) onError(lang === 'te' ? 'మైక్రోఫోన్ అనుమతి నిరాకరించబడింది.' : 'Microphone access denied. Please allow mic permissions.');
        } else {
          if (onError) onError(event.error);
        }
      };

      this.recognition.onend = () => {
        this.isListening = false;
        if (onEnd) onEnd(finalTranscript.trim());
      };

      this.recognition.start();
    } catch (e) {
      console.warn('Recognition start exception:', e);
      if (onError) onError(e.message);
    }
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {}
      this.isListening = false;
    }
  }
}

export const voiceService = new VoiceService();
export default voiceService;
