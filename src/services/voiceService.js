// src/services/voiceService.js
// Production-Grade Voice Service: MediaRecorder Audio Capture + Groq Whisper STT + Streaming TTS

import { API_BASE_URL } from './api';
import apiClient from './api';

class VoiceService {
  constructor() {
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.currentAudio = null;
    this.mediaStream = null;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.recognition = null;
    this.isRecording = false;
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
   * Start Live Audio Recording with MediaRecorder
   */
  async startRecording({ lang = 'te', onInterim = null, onError = null, onStart = null } = {}) {
    if (typeof window === 'undefined') return false;

    this.stopSpeaking();
    this.audioChunks = [];

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
    } catch (permErr) {
      console.error('Microphone permission denied:', permErr);
      if (onError) {
        onError(
          lang === 'te'
            ? 'మైక్రోఫోన్ అనుమతి నిరాకరించబడింది. దయచేసి బ్రౌజర్ సెట్టింగ్స్‌లో మైక్ అనుమతించండి.'
            : 'Microphone permission denied. Please allow microphone access in your browser settings.'
        );
      }
      return false;
    }

    try {
      // Pick best supported audio container
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
        mimeType = 'audio/ogg';
      }

      this.mediaRecorder = new MediaRecorder(this.mediaStream, { mimeType });
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(100);
      this.isRecording = true;
      if (onStart) onStart();

      // Optional: concurrent WebSpeech for live typing preview (non-blocking)
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          this.recognition = new SpeechRecognition();
          this.recognition.continuous = true;
          this.recognition.interimResults = true;
          this.recognition.lang = this.getLanguageCode(lang);

          this.recognition.onresult = (event) => {
            let live = '';
            for (let i = 0; i < event.results.length; ++i) {
              live += event.results[i][0].transcript;
            }
            if (onInterim && live.trim()) {
              onInterim(live.trim());
            }
          };

          this.recognition.onerror = (e) => {
            // Non-fatal: MediaRecorder continues recording!
            console.debug('WebSpeech visual note:', e.error);
          };

          this.recognition.start();
        } catch (recErr) {
          console.debug('SpeechRecognition preview note:', recErr);
        }
      }

      return true;
    } catch (err) {
      console.error('Failed to start MediaRecorder:', err);
      if (onError) onError('Could not initialize audio recording device.');
      return false;
    }
  }

  /**
   * Stop Recording & Transcribe via Backend Whisper Endpoint
   */
  async stopRecordingAndTranscribe(lang = 'te') {
    this.isRecording = false;

    // Stop WebSpeech preview
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {}
      this.recognition = null;
    }

    if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
      this.cleanupMediaStream();
      return '';
    }

    return new Promise((resolve) => {
      this.mediaRecorder.onstop = async () => {
        this.cleanupMediaStream();

        const mimeType = this.mediaRecorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(this.audioChunks, { type: mimeType });

        if (audioBlob.size < 1000) {
          console.warn('Audio recording is too short/empty.');
          resolve('');
          return;
        }

        try {
          const extension = mimeType.includes('mp4') ? 'mp4' : (mimeType.includes('ogg') ? 'ogg' : 'webm');
          const formData = new FormData();
          formData.append('file', audioBlob, `voice_query_${Date.now()}.${extension}`);
          formData.append('lang', lang);

          const response = await apiClient.post('/assistant/transcribe', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 20000,
          });

          const text = response.data?.text || '';
          resolve(text.trim());
        } catch (err) {
          console.error('Whisper transcription error:', err);
          resolve('');
        }
      };

      try {
        this.mediaRecorder.stop();
      } catch (e) {
        this.cleanupMediaStream();
        resolve('');
      }
    });
  }

  cancelRecording() {
    this.isRecording = false;
    if (this.recognition) {
      try { this.recognition.abort(); } catch (e) {}
      this.recognition = null;
    }
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try { this.mediaRecorder.stop(); } catch (e) {}
    }
    this.cleanupMediaStream();
    this.audioChunks = [];
  }

  cleanupMediaStream() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
  }
}

export const voiceService = new VoiceService();
export default voiceService;
