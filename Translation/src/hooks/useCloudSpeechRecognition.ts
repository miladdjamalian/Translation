import { useState, useRef, useCallback, useEffect } from 'react';
import { API_ENDPOINTS, apiRequest, TIMEOUTS } from '../config/api';

export const useCloudSpeechRecognition = (language: string, provider: 'google' | 'azure' = 'google') => {
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const processingTimeoutRef = useRef<NodeJS.Timeout>();
  const sessionIdRef = useRef<string>('');
  const accumulatedTranscriptRef = useRef<string>('');

  const getLanguageCode = (lang: string) => {
    const languageCodes: Record<string, string> = {
      'auto': 'fa-IR',
      'en': 'en-US',
      'fa': 'fa-IR',
      'ar': 'ar-SA',
      'es': 'es-ES',
      'fr': 'fr-FR',
      'de': 'de-DE',
      'it': 'it-IT',
      'pt': 'pt-PT',
      'ru': 'ru-RU',
      'ja': 'ja-JP',
      'ko': 'ko-KR',
      'zh': 'zh-CN',
      'hi': 'hi-IN',
      'th': 'th-TH',
      'vi': 'vi-VN',
      'nl': 'nl-NL',
      'sv': 'sv-SE',
      'no': 'no-NO',
      'da': 'da-DK',
      'fi': 'fi-FI',
      'tr': 'tr-TR',
      'pl': 'pl-PL',
      'cs': 'cs-CZ',
      'hu': 'hu-HU',
      'ro': 'ro-RO',
      'bg': 'bg-BG',
      'hr': 'hr-HR',
      'sk': 'sk-SK',
      'sl': 'sl-SI',
      'et': 'et-EE',
      'lv': 'lv-LV',
      'lt': 'lt-LT',
      'he': 'he-IL',
      'ur': 'ur-PK',
      'bn': 'bn-BD',
      'ta': 'ta-IN',
      'te': 'te-IN',
      'ml': 'ml-IN',
      'kn': 'kn-IN',
      'gu': 'gu-IN',
      'pa': 'pa-IN',
      'mr': 'mr-IN',
      'ne': 'ne-NP',
      'si': 'si-LK',
      'my': 'my-MM',
      'km': 'km-KH',
      'lo': 'lo-LA',
      'ka': 'ka-GE',
      'am': 'am-ET',
      'sw': 'sw-TZ',
      'zu': 'zu-ZA',
      'af': 'af-ZA',
      'xh': 'xh-ZA'
    };
    
    return languageCodes[lang] || 'fa-IR';
  };

  const processAudioChunk = useCallback(async (audioBlob: Blob) => {
    if (!audioBlob || audioBlob.size === 0) return;

    setIsProcessing(true);
    
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'audio.webm');
      formData.append('provider', provider);
      formData.append('language', getLanguageCode(language));
      formData.append('audioFormat', 'webm');

      console.log(`🎤 Sending ${audioBlob.size} bytes to ${provider} Speech API`);

      const response = await apiRequest(API_ENDPOINTS.SPEECH_TRANSCRIBE, {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(TIMEOUTS.SPEECH_RECOGNITION)
      });

      if (!response.ok) {
        throw new Error(`Speech API error: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.transcript && result.transcript.trim()) {
        console.log(`✅ ${provider} Speech result:`, result.transcript);
        
        // Accumulate transcript instead of replacing
        const newText = result.transcript.trim();
        accumulatedTranscriptRef.current += (accumulatedTranscriptRef.current ? ' ' : '') + newText;
        setTranscript(accumulatedTranscriptRef.current);
        setConfidence(result.confidence || 0);
        setInterimTranscript('');
      }

    } catch (error) {
      console.error(`❌ ${provider} Speech API error:`, error);
    } finally {
      setIsProcessing(false);
    }
  }, [language, provider]);

  const startListening = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000
        }
      });
      
      streamRef.current = stream;
      sessionIdRef.current = Date.now().toString();
      accumulatedTranscriptRef.current = '';
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      // Process audio in smaller chunks for better real-time experience
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          
          // Process chunk immediately for real-time experience
          const audioBlob = new Blob([event.data], { type: 'audio/webm' });
          processAudioChunk(audioBlob);
        }
      };
      
      mediaRecorder.onstart = () => {
        setIsListening(true);
        setTranscript('');
        setInterimTranscript('');
        accumulatedTranscriptRef.current = '';
        console.log(`🎤 ${provider} Speech recognition started`);
      };
      
      mediaRecorder.onstop = () => {
        setIsListening(false);
        console.log(`🛑 ${provider} Speech recognition stopped`);
      };
      
      // Start recording with smaller time slices for better real-time processing
      mediaRecorder.start(800); // 800ms chunks for faster processing
      
    } catch (error) {
      console.error('Failed to start cloud speech recognition:', error);
      throw error;
    }
  }, [language, provider, processAudioChunk]);

  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current);
    }
    
    setIsListening(false);
    setInterimTranscript('');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  return {
    transcript,
    interimTranscript,
    confidence,
    isListening,
    isProcessing,
    startListening,
    stopListening
  };
};