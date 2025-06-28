import { useState, useCallback } from 'react';
import { API_ENDPOINTS, apiRequest, TIMEOUTS } from '../config/api';

export const useCloudTranslation = () => {
  const [isTranslating, setIsTranslating] = useState(false);
  const [detectedLanguage, setDetectedLanguage] = useState<string>('');

  const translate = useCallback(async (
    text: string,
    sourceLanguage: string,
    targetLanguage: string,
    mode: 'low' | 'high'
  ) => {
    if (!text.trim()) return '';
    
    setIsTranslating(true);
    
    try {
      // Detect language if auto is selected
      let detectedLang = sourceLanguage;
      if (sourceLanguage === 'auto') {
        detectedLang = detectLanguage(text);
        setDetectedLanguage(detectedLang);
      }

      // Skip translation if source and target are the same
      if (detectedLang === targetLanguage) {
        setIsTranslating(false);
        return text;
      }

      console.log('🔄 Sending to Google Translation API:', text);

      const response = await apiRequest(API_ENDPOINTS.TRANSLATION_TRANSLATE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text,
          sourceLanguage: detectedLang,
          targetLanguage,
          provider: 'google',
          mode: mode === 'low' ? 'fast' : 'accurate'
        }),
        signal: AbortSignal.timeout(TIMEOUTS.TRANSLATION_REQUEST)
      });

      if (!response.ok) {
        throw new Error(`Google Translation API error: ${response.statusText}`);
      }

      const result = await response.json();
      
      console.log('✅ Google Translation result:', result.translation);
      
      if (result.detectedLanguage && sourceLanguage === 'auto') {
        setDetectedLanguage(result.detectedLanguage);
      }

      return result.translation || text;

    } catch (error) {
      console.error('❌ Google Translation API error:', error);
      throw error;
    } finally {
      setIsTranslating(false);
    }
  }, []);

  const downloadOfflineModels = useCallback(async () => {
    // This is not needed for cloud mode
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Google Cloud APIs are ready');
  }, []);

  return {
    translate,
    isTranslating,
    detectedLanguage,
    downloadOfflineModels,
    isDownloadingModels: false
  };
};

// Enhanced language detection
const detectLanguage = (text: string): string => {
  if (/[پچژگکی]/.test(text)) return 'fa';
  if (/[ثذصضطظغ]/.test(text)) return 'ar';
  if (/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text)) {
    return 'fa';
  }
  if (/[\u0590-\u05FF]/.test(text)) return 'he';
  if (/[ںے]/.test(text)) return 'ur';
  if (/^[A-Za-z\s.,!?'-]+$/.test(text)) return 'en';
  if (/[а-яё]/i.test(text)) return 'ru';
  if (/[ひらがなカタカナ]/.test(text)) return 'ja';
  if (/[가-힣]/.test(text)) return 'ko';
  if (/[一-龯]/.test(text)) return 'zh';
  if (/[अ-ह]/.test(text)) return 'hi';
  
  return 'en';
};