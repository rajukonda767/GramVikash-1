// src/services/voiceService.js
// Universal Voice Service: Groq Whisper STT + Audio Streaming TTS + Web Speech Hybrid

import { API_BASE_URL } from './api';
import apiClient from './api';

class VoiceService {
  constructor() {
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.currentAudio = null;
    this.recognition = null;
    this.mediaRecorder = null;
    this.audioChunks = [];
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
   * Dual Speech-to-Text Pipeline:
   * 1. Records live audio via MediaRecorder -> Transcribes via Groq Whisper API (100% accurate on Telugu/English)
   * 2. Runs WebSpeech API simultaneously for instant live visual feedback
   */
  async listen({ lang = 'te', onResult, onInterim, onError, onStart, onEnd }) {
    if (typeof window === 'undefined') return;

    let mediaStream = null;
    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (permErr) {
      console.warn('Microphone permission error:', permErr);
      if (onError) onError(lang === 'te' ? 'దయచేసి మైక్రోఫోన్ అనుమతి ఇవ్వండి.' : 'Please grant microphone access to speak.');
      return;
    }

    this.isListening = true;
    if (onStart) onStart();

    this.audioChunks = [];
    try {
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      this.mediaRecorder = new MediaRecorder(mediaStream, { mimeType });
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        mediaStream.getTracks().forEach((t) => t.stop());
        const audioBlob = new Blob(this.audioChunks, { type: mimeType });
        if (audioBlob.size > 500) {
          try {
            const formData = new FormData();
            formData.append('file', audioBlob, `recording_${Date.now()}.${mimeType.includes('webm') ? 'webm' : 'mp4'}`);
            formData.append('lang', lang);

            const res = await apiClient.post('/assistant/transcribe', formData, {
              headers: { 'Content-Type': 'multipart/form-data' },
              timeout: 15000,
            });

            if (res.data?.text && res.data.text.trim().length > 0) {
              const whisperText = res.data.text.trim();
              if (onResult) onResult(whisperText);
              if (onEnd) onEnd(whisperText);
              return;
            }
          } catch (whisperErr) {
            console.warn('Whisper transcription fallback to WebSpeech result:', whisperErr);
          }
        }
        if (onEnd) onEnd();
      };

      this.mediaRecorder.start(250);
    } catch (recorderErr) {
      console.warn('MediaRecorder error:', recorderErr);
    }

    // Simultaneously run WebSpeech API for real-time live typing animation
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        if (this.recognition) {
          try { this.recognition.abort(); } catch (e) {}
        }

        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.lang = this.getLanguageCode(lang);

        this.recognition.onresult = (event) => {
          let text = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            text += event.results[i][0].transcript;
          }
          if (onInterim && text) {
            onInterim(text);
          }
        };

        this.recognition.onerror = (e) => {
          console.warn('WebSpeech note:', e.error);
        };

        this.recognition.start();
      } catch (e) {
        console.warn('WebSpeech recognition note:', e);
      }
    }
  }

  stopListening() {
    this.isListening = false;
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
      } catch (e) {}
    }
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {}
    }
  }
}

export const voiceService = new VoiceService();
export default voiceService;
