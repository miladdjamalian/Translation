import { useState, useCallback, useRef, useEffect } from 'react';

export const useSpeechSynthesis = (language: string, outputDeviceId?: string) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentOutputDeviceRef = useRef<string>('');
  const speechQueueRef = useRef<string[]>([]);

  const getLanguageCode = (lang: string) => {
    const languageCodes: Record<string, string> = {
      'en': 'en',
      'fa': 'fa',
      'ar': 'ar',
      'es': 'es',
      'fr': 'fr',
      'de': 'de',
      'it': 'it',
      'pt': 'pt',
      'ru': 'ru',
      'ja': 'ja',
      'ko': 'ko',
      'zh': 'zh',
      'hi': 'hi',
      'th': 'th',
      'vi': 'vi',
      'nl': 'nl',
      'sv': 'sv',
      'no': 'no',
      'da': 'da',
      'fi': 'fi',
      'tr': 'tr',
      'pl': 'pl',
      'cs': 'cs',
      'hu': 'hu',
      'ro': 'ro',
      'bg': 'bg',
      'hr': 'hr',
      'sk': 'sk',
      'sl': 'sl',
      'et': 'et',
      'lv': 'lv',
      'lt': 'lt',
      'he': 'he',
      'ur': 'ur',
      'bn': 'bn',
      'ta': 'ta',
      'te': 'te',
      'ml': 'ml',
      'kn': 'kn',
      'gu': 'gu',
      'pa': 'pa',
      'mr': 'mr',
      'ne': 'ne',
      'si': 'si',
      'my': 'my',
      'km': 'km',
      'lo': 'lo',
      'ka': 'ka',
      'am': 'am',
      'sw': 'sw',
      'zu': 'zu',
      'af': 'af',
      'xh': 'xh'
    };
    
    return languageCodes[lang] || 'en';
  };

  const loadVoices = useCallback(() => {
    const availableVoices = speechSynthesis.getVoices();
    setVoices(availableVoices);
  }, []);

  const setOutputDevice = useCallback(async (deviceId: string) => {
    currentOutputDeviceRef.current = deviceId;
    
    // Initialize audio context for device selection
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
  }, []);

  const processQueue = useCallback(async () => {
    if (isSpeaking || speechQueueRef.current.length === 0) {
      return;
    }

    const text = speechQueueRef.current.shift();
    if (!text) return;

    if (utteranceRef.current) {
      speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    const targetLangCode = getLanguageCode(language);
    
    // Find the best voice for the target language
    const languageVoices = voices.filter(voice => {
      const voiceLang = voice.lang.toLowerCase();
      return voiceLang.startsWith(targetLangCode) || 
             voiceLang.startsWith(targetLangCode.split('-')[0]);
    });
    
    if (languageVoices.length > 0) {
      // Prefer neural/premium voices, especially for Persian and Arabic
      const preferredVoice = languageVoices.find(voice => {
        const name = voice.name.toLowerCase();
        return name.includes('neural') || 
               name.includes('premium') ||
               name.includes('enhanced') ||
               name.includes('natural') ||
               name.includes('google') ||
               (targetLangCode === 'fa' && (name.includes('persian') || name.includes('farsi'))) ||
               (targetLangCode === 'ar' && name.includes('arabic'));
      }) || languageVoices[0];
      
      utterance.voice = preferredVoice;
    }
    
    // Optimized speech parameters for real-time dubbing
    if (targetLangCode === 'fa' || targetLangCode === 'ar') {
      utterance.rate = 1.1; // Slightly faster for RTL languages
      utterance.pitch = 1.0;
    } else {
      utterance.rate = 1.2; // Faster rate for real-time feel
      utterance.pitch = 1.0;
    }
    
    utterance.volume = 0.9;
    
    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      utteranceRef.current = null;
      processQueue();
    };
    
    utterance.onerror = (event) => {
      if (event.error !== 'interrupted') {
        console.error('Speech synthesis error:', event.error);
      }
      setIsSpeaking(false);
      utteranceRef.current = null;
      processQueue();
    };
    
    utteranceRef.current = utterance;
    
    // Use audio context for device selection if available
    if (currentOutputDeviceRef.current && audioContextRef.current) {
      try {
        // Create audio element for device-specific output
        const audio = new Audio();
        if ('setSinkId' in audio) {
          await (audio as any).setSinkId(currentOutputDeviceRef.current);
        }
      } catch (error) {
        console.warn('Could not set audio output device:', error);
      }
    }
    
    speechSynthesis.speak(utterance);
  }, [language, voices, isSpeaking]);

  const speak = useCallback((text: string) => {
    if (!text.trim()) return;
    speechQueueRef.current.push(text);
    processQueue();
  }, [processQueue]);

  const stopSpeaking = useCallback(() => {
    speechSynthesis.cancel();
    setIsSpeaking(false);
    utteranceRef.current = null;
  }, []);

  // Load voices on mount and when they change
  useEffect(() => {
    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;
    
    return () => {
      speechSynthesis.onvoiceschanged = null;
    };
  }, [loadVoices]);

  return {
    speak,
    stopSpeaking,
    isSpeaking,
    voices,
    setOutputDevice
  };
};