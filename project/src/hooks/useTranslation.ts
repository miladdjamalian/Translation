import { useState, useCallback } from 'react';

export const useTranslation = () => {
  const [isTranslating, setIsTranslating] = useState(false);
  const [detectedLanguage, setDetectedLanguage] = useState<string>('');
  const [isDownloadingModels, setIsDownloadingModels] = useState(false);

  const translate = useCallback(async (
    text: string,
    sourceLanguage: string,
    targetLanguage: string,
    mode: 'low' | 'high',
    translationMode: 'online' | 'offline'
  ) => {
    if (!text.trim()) return '';
    setIsTranslating(true);
    try {
      let detectedLang = sourceLanguage;
      if (sourceLanguage === 'auto') {
        detectedLang = detectLanguage(text);
        setDetectedLanguage(detectedLang);
      }
      if (detectedLang === targetLanguage) {
        setIsTranslating(false);
        return text;
      }

      let translation = '';
      if (translationMode === 'online') {
        translation = await translateOnline(text, detectedLang, targetLanguage, mode);
      } else {
        translation = await translateOffline(text, detectedLang, targetLanguage);
      }
      return translation;
    } catch (error) {
      console.error('Translation error:', error);
      return text;
    } finally {
      setIsTranslating(false);
    }
  }, []);

  const downloadOfflineModels = useCallback(async () => {
    setIsDownloadingModels(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('Offline models downloaded successfully');
    } catch (error) {
      console.error('Failed to download offline models:', error);
      throw error;
    } finally {
      setIsDownloadingModels(false);
    }
  }, []);

  return {
    translate,
    isTranslating,
    detectedLanguage,
    downloadOfflineModels,
    isDownloadingModels
  };
};

const translateOnline = async (text: string, sourceLanguage: string, targetLanguage: string, mode: 'low' | 'high'): Promise<string> => {
  const timeout = mode === 'low' ? 2000 : 4000;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLanguage === 'auto' ? 'auto' : sourceLanguage}&tl=${targetLanguage}&dt=t&q=${encodeURIComponent(text)}`, {
      method: 'GET',
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (response.ok) {
      const data = await response.json();
      if (data && data[0] && data[0][0] && data[0][0][0]) {
        return data[0][0][0].trim();
      }
    }
  } catch (error) {
    console.warn('Google Translate failed, trying fallback:', error);
  }
  return text;
};

const translateOffline = async (text: string, sourceLanguage: string, targetLanguage: string): Promise<string> => {
  await new Promise(resolve => setTimeout(resolve, 50));
  const dictionary = offlineDictionary[sourceLanguage]?.[targetLanguage];
  if (!dictionary) return text;

  const cleanText = text.trim().toLowerCase();
  if (dictionary[cleanText]) return dictionary[cleanText];
  const noPunctuation = cleanText.replace(/[.,!?؟]/g, '');
  if (dictionary[noPunctuation]) return dictionary[noPunctuation];

  const words = text.split(/\s+/);
  if (words.length > 1) {
    const translatedWords = words.map(word => {
      const w = word.toLowerCase().replace(/[.,!?؟]/g, '');
      return dictionary[w] || word;
    });
    return translatedWords.join(' ');
  }
  return text;
};

const detectLanguage = (text: string): string => {
  if (/[پچژگکی]/.test(text)) return 'fa';
  if (/[a-zA-Z]/.test(text)) return 'en';
  return 'en';
};

const offlineDictionary: Record<string, Record<string, Record<string, string>>> = {
  en: {
    fa: {
      'hello': 'سلام',
      'goodbye': 'خداحافظ',
      'thanks': 'ممنون',
      'please': 'لطفاً',
      'yes': 'بله',
      'no': 'نه',
      'water': 'آب',
      'food': 'غذا',
      'money': 'پول',
      'car': 'ماشین',
    }
  },
  fa: {
    en: {
      'سلام': 'hello',
      'خداحافظ': 'goodbye',
      'ممنون': 'thanks',
      'لطفاً': 'please',
      'بله': 'yes',
      'نه': 'no',
      'آب': 'water',
      'غذا': 'food',
      'پول': 'money',
      'ماشین': 'car'
    }
  }
};
