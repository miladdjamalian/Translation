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
  const isProcessingRef = useRef<boolean>(false);

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
    if (!audioBlob || audioBlob.size === 0) {
      console.log('⚠️ Empty audio blob, skipping'); // Debug log
      return;
    }

    if (isProcessingRef.current) {
      console.log('⚠️ Already processing, skipping chunk'); // Debug log
      return;
    }

    isProcessingRef.current = true;
    setIsProcessing(true);
    
    try {
      console.log('📤 Sending audio chunk to backend:', audioBlob.size, 'bytes, provider:', provider, 'language:', getLanguageCode(language)); // Debug log
      
      const formData = new FormData();
      formData.append('audio', audioBlob, 'audio.webm');
      formData.append('provider', provider);
      formData.append('language', getLanguageCode(language));
      formData.append('audioFormat', 'webm');

      const response = await apiRequest(API_ENDPOINTS.SPEECH_TRANSCRIBE, {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(TIMEOUTS.SPEECH_REQUEST)
      });

      console.log('📥 Speech API response status:', response.status, response.ok); // Debug log

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Speech API error response:', errorText); // Debug log
        throw new Error(`Speech API error: ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log('📋 Speech API result:', result); // Debug log
      
      if (result.transcript && result.transcript.trim()) {
        console.log(`✅ ${provider} Speech result:`, result.transcript);
        
        // Accumulate transcript instead of replacing
        const newText = result.transcript.trim();
        accumulatedTranscriptRef.current += (accumulatedTranscriptRef.current ? ' ' : '') + newText;
        setTranscript(accumulatedTranscriptRef.current);
        setConfidence(result.confidence || 0);
        setInterimTranscript('');
      } else {
        console.log('⚠️ No transcript in result or empty transcript'); // Debug log
      }

    } catch (error) {
      console.error(`❌ ${provider} Speech API error:`, error);
    } finally {
      setIsProcessing(false);
      isProcessingRef.current = false;
    }
  }, [language, provider]);

  const startListening = useCallback(async () => {
    try {
      console.log('🎤 Starting cloud speech recognition for language:', getLanguageCode(language), 'provider:', provider); // Debug log
      
      // ✅ تغییر کلیدی: نرخ نمونه‌برداری را به 48000 هرتز تغییر دادیم
      // این تغییر تضمین می‌کند که نرخ نمونه‌برداری میکروفون با کدک Opus مطابقت داشته باشد
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000, // 🔧 تغییر از 16000 به 48000 برای سازگاری با Opus
          channelCount: 1 // تک کانال برای بهینه‌سازی حجم
        }
      });
      
      console.log('✅ Got media stream for speech recognition with 48kHz sample rate:', stream); // Debug log
      
      streamRef.current = stream;
      sessionIdRef.current = Date.now().toString();
      accumulatedTranscriptRef.current = '';
      
      // Check supported MIME types
      const supportedTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/wav'
      ];
      
      let mimeType = 'audio/webm';
      for (const type of supportedTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          break;
        }
      }
      
      console.log('🎵 Using MIME type for speech recognition:', mimeType); // Debug log
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      // Process audio in chunks for real-time experience
      mediaRecorder.ondataavailable = (event) => {
        console.log('📊 MediaRecorder data available:', event.data.size, 'bytes'); // Debug log
        
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          
          // Process chunk immediately for real-time experience
          const audioBlob = new Blob([event.data], { type: mimeType });
          console.log('🔄 Processing audio chunk:', audioBlob.size, 'bytes'); // Debug log
          processAudioChunk(audioBlob);
        } else {
          console.log('⚠️ Received empty data chunk'); // Debug log
        }
      };
      
      mediaRecorder.onstart = () => {
        setIsListening(true);
        setTranscript('');
        setInterimTranscript('');
        accumulatedTranscriptRef.current = '';
        console.log(`🔴 ${provider} Speech recognition started with 48kHz sample rate`);
      };
      
      mediaRecorder.onstop = () => {
        setIsListening(false);
        console.log(`🛑 ${provider} Speech recognition stopped`);
      };
      
      mediaRecorder.onerror = (event) => {
        console.error('❌ MediaRecorder error:', event); // Debug log
        setIsListening(false);
      };
      
      // Start recording with smaller time slices for better real-time processing
      console.log('🔴 Starting MediaRecorder with 1000ms chunks'); // Debug log
      mediaRecorder.start(1000); // 1000ms chunks for better processing
      
    } catch (error) {
      console.error('❌ Failed to start cloud speech recognition:', error);
      throw error;
    }
  }, [language, provider, processAudioChunk]);

  const stopListening = useCallback(() => {
    console.log('🛑 Stopping cloud speech recognition'); // Debug log
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('🔇 Speech recognition track stopped:', track.label); // Debug log
      });
    }
    
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current);
    }
    
    setIsListening(false);
    setInterimTranscript('');
    isProcessingRef.current = false;
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
