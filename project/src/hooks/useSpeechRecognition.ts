import { useState, useRef, useCallback, useEffect } from 'react';

export const useSpeechRecognition = (language: string) => {
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [isListening, setIsListening] = useState(false);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef('');
  const restartTimeoutRef = useRef<NodeJS.Timeout>();

  const getLanguageCode = (lang: string) => {
    const languageCodes: Record<string, string> = {
      'auto': 'fa-IR', // Default to Persian for auto
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
    
    return languageCodes[lang] || 'fa-IR'; // Default to Persian
  };

  const startListening = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.error('Speech recognition not supported');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    // Optimized settings for continuous Persian speech recognition
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 3; // More alternatives for better accuracy
    recognition.lang = getLanguageCode(language);
    
    // Reset transcripts
    finalTranscriptRef.current = '';
    setTranscript('');
    setInterimTranscript('');
    
    recognition.onstart = () => {
      setIsListening(true);
      console.log('Speech recognition started for language:', recognition.lang);
    };
    
    recognition.onresult = (event) => {
      let finalText = '';
      let interimText = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript;
        
        if (result.isFinal) {
          finalText += text;
          setConfidence(result[0].confidence || 0.8);
          console.log('Final result:', text, 'Confidence:', result[0].confidence);
        } else {
          interimText += text;
          console.log('Interim result:', text);
        }
      }
      
      // Update final transcript (cumulative)
      if (finalText) {
        finalTranscriptRef.current += finalText + ' ';
        setTranscript(finalTranscriptRef.current.trim());
        setInterimTranscript(''); // Clear interim when we have final
      } else {
        // Only show interim if no final text yet
        setInterimTranscript(interimText);
      }
    };
    
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      
      // Don't restart on certain errors
      if (event.error === 'no-speech' || event.error === 'audio-capture') {
        // These are expected, just continue
        return;
      }
      
      if (event.error === 'network') {
        console.warn('Network error in speech recognition, will retry...');
      }
      
      // For other errors, stop and potentially restart
      setIsListening(false);
    };
    
    recognition.onend = () => {
      console.log('Speech recognition ended');
      setIsListening(false);
      
      // Auto-restart for continuous listening (with delay to prevent rapid restarts)
      if (recognitionRef.current) {
        if (restartTimeoutRef.current) {
          clearTimeout(restartTimeoutRef.current);
        }
        
        restartTimeoutRef.current = setTimeout(() => {
          try {
            if (recognitionRef.current) {
              console.log('Restarting speech recognition...');
              recognition.start();
            }
          } catch (error) {
            console.error('Failed to restart recognition:', error);
          }
        }, 500); // 500ms delay before restart
      }
    };
    
    recognitionRef.current = recognition;
    
    try {
      recognition.start();
    } catch (error) {
      console.error('Failed to start recognition:', error);
    }
  }, [language]);

  const stopListening = useCallback(() => {
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
    }
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
    setInterimTranscript('');
  }, []);

  // Reset when language changes
  useEffect(() => {
    if (isListening) {
      stopListening();
      setTimeout(() => startListening(), 100);
    }
  }, [language]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  return {
    transcript,
    interimTranscript,
    confidence,
    isListening,
    startListening,
    stopListening
  };
};