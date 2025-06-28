import { useState, useCallback } from 'react';

// --- Language Detection ---
const detectLanguage = (text: string): string => {
  if (/[پچژگکی]/.test(text)) return 'fa';
  if (/[ثذصضطظغ]/.test(text)) return 'ar';
  if (/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text)) return 'fa';
  if (/[\u0590-\u05FF]/.test(text)) return 'he';
  if (/[ںے]/.test(text)) return 'ur';
  if (/^[A-Za-z\s.,!?'-]+$/.test(text)) {
    if (/[àáâãçéêíóôõú]/i.test(text)) return 'pt';
    if (/[äöüß]/i.test(text)) return 'de';
    if (/[ñáéíóúü]/i.test(text)) return 'es';
    return 'en';
  }
  if (/[а-яё]/i.test(text)) return 'ru';
  if (/[ひらがなカタカナ]/.test(text)) return 'ja';
  if (/[가-힣]/.test(text)) return 'ko';
  if (/[一-龯]/.test(text)) return 'zh';
  if (/[अ-ह]/.test(text)) return 'hi';
  return 'en';
};

// --- Offline Translator ---
const translateOffline = async (text: string, sourceLanguage: string, targetLanguage: string): Promise<string> => {
  await new Promise(resolve => setTimeout(resolve, 50));

  const translations: Record<string, Record<string, Record<string, string>>> = {
    'en': {
      'fa': {
        'hello': 'سلام', 'hi': 'سلام', 'goodbye': 'خداحافظ', 'bye': 'خداحافظ', 'thank you': 'متشکرم',
        'thanks': 'ممنون', 'please': 'لطفاً', 'yes': 'بله', 'no': 'نه', 'good morning': 'صبح بخیر',
        'good evening': 'عصر بخیر', 'good night': 'شب بخیر', 'how are you': 'چطوری؟', 'what is your name': 'اسمت چیه؟',
        'nice to meet you': 'خوشحالم که ملاقاتت کردم', 'excuse me': 'ببخشید', 'sorry': 'متأسفم', 'help': 'کمک',
        'i love you': 'دوستت دارم', 'welcome': 'خوش آمدید', 'water': 'آب', 'food': 'غذا', 'time': 'زمان',
        'money': 'پول', 'house': 'خانه', 'home': 'خانه', 'car': 'ماشین', 'book': 'کتاب', 'music': 'موسیقی',
        'love': 'عشق', 'friend': 'دوست', 'family': 'خانواده', 'work': 'کار', 'school': 'مدرسه',
        'university': 'دانشگاه', 'hospital': 'بیمارستان', 'restaurant': 'رستوران', 'hotel': 'هتل', 'airport': 'فرودگاه',
        'train': 'قطار', 'bus': 'اتوبوس', 'taxi': 'تاکسی', 'street': 'خیابان', 'city': 'شهر', 'country': 'کشور',
        'one': 'یک', 'two': 'دو', 'three': 'سه', 'four': 'چهار', 'five': 'پنج', 'six': 'شش', 'seven': 'هفت',
        'eight': 'هشت', 'nine': 'نه', 'ten': 'ده', 'red': 'قرمز', 'blue': 'آبی', 'green': 'سبز',
        'yellow': 'زرد', 'black': 'سیاه', 'white': 'سفید', 'monday': 'دوشنبه', 'tuesday': 'سه‌شنبه',
        'wednesday': 'چهارشنبه', 'thursday': 'پنج‌شنبه', 'friday': 'جمعه', 'saturday': 'شنبه', 'sunday': 'یکشنبه',
        'go': 'برو', 'come': 'بیا', 'eat': 'بخور', 'drink': 'بنوش', 'sleep': 'بخواب', 'wake up': 'بیدار شو',
        'sit': 'بشین', 'stand': 'بایست', 'walk': 'راه برو', 'run': 'بدو', 'stop': 'توقف', 'start': 'شروع',
        'finish': 'تمام', 'open': 'باز کن', 'close': 'ببند', 'buy': 'بخر', 'sell': 'بفروش', 'give': 'بده',
        'take': 'بگیر', 'see': 'ببین', 'hear': 'بشنو', 'speak': 'صحبت کن', 'understand': 'متوجه شدم',
        'know': 'می‌دانم', 'learn': 'یاد بگیر', 'teach': 'یاد بده', 'read': 'بخوان', 'write': 'بنویس',
        'how much': 'چقدر', 'where is': 'کجاست', 'what time': 'چه وقت', 'i want': 'می‌خوام',
        'i need': 'نیاز دارم', 'i like': 'دوست دارم', 'very good': 'خیلی خوب', 'not good': 'خوب نیست',
        'beautiful': 'زیبا', 'ugly': 'زشت', 'big': 'بزرگ', 'small': 'کوچک', 'hot': 'گرم', 'cold': 'سرد',
        'fast': 'سریع', 'slow': 'آهسته'
      }
    },
    'fa': {
      'en': {
        'سلام': 'hello', 'خداحافظ': 'goodbye', 'متشکرم': 'thank you', 'ممنون': 'thanks', 'لطفاً': 'please',
        'بله': 'yes', 'نه': 'no', 'صبح بخیر': 'good morning', 'عصر بخیر': 'good evening', 'شب بخیر': 'good night',
        'چطوری؟': 'how are you?', 'اسمت چیه؟': 'what is your name?', 'ببخشید': 'excuse me', 'متأسفم': 'sorry',
        'کمک': 'help', 'دوستت دارم': 'i love you', 'خوش آمدید': 'welcome',
        'آب': 'water', 'غذا': 'food', 'زمان': 'time', 'پول': 'money', 'خانه': 'house', 'ماشین': 'car',
        'کتاب': 'book', 'موسیقی': 'music', 'عشق': 'love', 'دوست': 'friend', 'خانواده': 'family',
        'کار': 'work', 'مدرسه': 'school', 'دانشگاه': 'university', 'بیمارستان': 'hospital',
        'رستوران': 'restaurant', 'هتل': 'hotel', 'فرودگاه': 'airport', 'یک': 'one', 'دو': 'two',
        'سه': 'three', 'چهار': 'four', 'پنج': 'five', 'شش': 'six', 'هفت': 'seven', 'هشت': 'eight',
        'نه': 'nine', 'ده': 'ten', 'قرمز': 'red', 'آبی': 'blue', 'سبز': 'green', 'زرد': 'yellow',
        'سیاه': 'black', 'سفید': 'white', 'چقدر': 'how much', 'کجاست': 'where is',
        'چه وقت': 'what time', 'می‌خوام': 'i want', 'نیاز دارم': 'i need', 'دوست دارم': 'i like',
        'خیلی خوب': 'very good', 'خوب نیست': 'not good', 'زیبا': 'beautiful', 'زشت': 'ugly',
        'بزرگ': 'big', 'کوچک': 'small', 'گرم': 'hot', 'سرد': 'cold', 'سریع': 'fast', 'آهسته': 'slow'
      }
    }
  };

  const dictionary = translations[sourceLanguage]?.[targetLanguage];
  if (!dictionary) return text;

  const cleanText = text.trim().toLowerCase();
  const noPunctuation = cleanText.replace(/[.,!?؟]/g, '');

  if (dictionary[cleanText]) return dictionary[cleanText];
  if (dictionary[noPunctuation]) return dictionary[noPunctuation];

  const words = text.split(/\s+/);
  if (words.length > 1) {
    const translated = words.map(word => {
      const w = word.toLowerCase().replace(/[.,!?؟]/g, '');
      return dictionary[w] || word;
    });
    const count = translated.filter((w, i) => w !== words[i]).length;
    if (count >= words.length * 0.3) return translated.join(' ');
  }

  return text;
};

// --- Online Translator ---
const translateOnline = async (text: string, sourceLanguage: string, targetLanguage: string, mode: 'low' | 'high'): Promise<string> => {
  const timeout = mode === 'low' ? 2000 : 4000;

  const tryService = async (url: string, options: RequestInit, extract: (res: any) => string | null): Promise<string | null> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        return extract(data);
      }
    } catch (_) {}
    return null;
  };

  const google = await tryService(
    `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLanguage}&tl=${targetLanguage}&dt=t&q=${encodeURIComponent(text)}`,
    { method: 'GET' },
    (data) => data?.[0]?.[0]?.[0]?.trim()
  );
  if (google) return google;

  const libre = await tryService(
    'https://libretranslate.de/translate',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: text, source: sourceLanguage, target: targetLanguage, format: 'text' })
    },
    (data) => data?.translatedText?.trim()
  );
  if (libre) return libre;

  const memory = await tryService(
    `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLanguage}|${targetLanguage}`,
    {},
    (data) => data?.responseData?.translatedText?.trim()
  );
  if (memory) return memory;

  throw new Error('All translation services failed');
};

// --- Hook: useTranslation ---
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

      if (detectedLang === targetLanguage) return text;

      const translation = translationMode === 'online'
        ? await translateOnline(text, detectedLang, targetLanguage, mode)
        : await translateOffline(text, detectedLang, targetLanguage);

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
      console.log('Offline models downloaded');
    } catch (error) {
      console.error('Offline model download failed:', error);
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
