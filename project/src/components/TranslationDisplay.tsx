import React from 'react';
import { Copy, Volume2, Loader2, CheckCircle, Cloud, HardDrive, Mic } from 'lucide-react';

interface TranslationDisplayProps {
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  isProcessing: boolean;
  isSpeaking: boolean;
  confidence: number;
  detectedLanguage?: string;
  translationMode: 'online' | 'offline';
  interimText?: string;
}

const TranslationDisplay: React.FC<TranslationDisplayProps> = ({
  originalText,
  translatedText,
  sourceLanguage,
  targetLanguage,
  isProcessing,
  isSpeaking,
  confidence,
  detectedLanguage,
  translationMode,
  interimText
}) => {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-400';
    if (confidence >= 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getLanguageName = (code: string) => {
    const languageNames: Record<string, string> = {
      'auto': 'Auto Detect',
      'en': 'English',
      'fa': 'فارسی',
      'ar': 'العربية',
      'es': 'Español',
      'fr': 'Français',
      'de': 'Deutsch',
      'it': 'Italiano',
      'pt': 'Português',
      'ru': 'Русский',
      'ja': '日本語',
      'ko': '한국어',
      'zh': '中文',
      'hi': 'हिन्दी',
      'ur': 'اردو',
      'he': 'עברית',
      'th': 'ไทย',
      'vi': 'Tiếng Việt',
      'nl': 'Nederlands',
      'sv': 'Svenska',
      'no': 'Norsk',
      'da': 'Dansk',
      'fi': 'Suomi',
      'tr': 'Türkçe',
      'pl': 'Polski',
      'cs': 'Čeština',
      'hu': 'Magyar',
      'ro': 'Română',
      'bg': 'Български',
      'hr': 'Hrvatski',
      'sk': 'Slovenčina',
      'sl': 'Slovenščina',
      'et': 'Eesti',
      'lv': 'Latviešu',
      'lt': 'Lietuvių',
      'bn': 'বাংলা',
      'ta': 'தமிழ்',
      'te': 'తెలుగు',
      'ml': 'മലയാളം',
      'kn': 'ಕನ್ನಡ',
      'gu': 'ગુજરાતી',
      'pa': 'ਪੰਜਾਬੀ',
      'mr': 'मराठी',
      'ne': 'नेपाली',
      'si': 'සිංහල',
      'my': 'မြန်မာ',
      'km': 'ខ្មែរ',
      'lo': 'ລາວ',
      'ka': 'ქართული',
      'am': 'አማርኛ',
      'sw': 'Kiswahili',
      'zu': 'isiZulu',
      'af': 'Afrikaans',
      'xh': 'isiXhosa'
    };
    return languageNames[code] || code.toUpperCase();
  };

  const isRTL = (lang: string) => {
    return ['fa', 'ar', 'he', 'ur'].includes(lang);
  };

  // Determine which language to display for source
  const displaySourceLanguage = sourceLanguage === 'auto' && detectedLanguage 
    ? detectedLanguage 
    : sourceLanguage;
  
  const displaySourceLanguageName = sourceLanguage === 'auto' && detectedLanguage
    ? `${getLanguageName(detectedLanguage)} (Detected)`
    : getLanguageName(sourceLanguage);
  
  const displayTargetLanguageName = getLanguageName(targetLanguage);

  // Show interim text if available and no final text yet
  const displayText = originalText || interimText;
  const isInterim = !originalText && interimText;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Original Text */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 relative overflow-hidden">
        {/* Real-time indicator */}
        {isInterim && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse" />
        )}
        
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isInterim ? 'bg-blue-500 animate-pulse' : 'bg-blue-500'}`} />
            <span>Original Text</span>
            <span className="text-sm text-blue-400">({displaySourceLanguageName})</span>
            {isInterim && <Mic className="w-4 h-4 text-blue-400 animate-pulse" />}
          </h3>
          <div className="flex items-center space-x-2">
            {confidence > 0 && (
              <div className={`flex items-center space-x-1 ${getConfidenceColor(confidence)}`}>
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">{Math.round(confidence * 100)}%</span>
              </div>
            )}
            <button
              onClick={() => copyToClipboard(displayText)}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              disabled={!displayText}
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="min-h-[120px] p-4 bg-gray-900 rounded-lg">
          {displayText ? (
            <p 
              className={`leading-relaxed ${isInterim ? 'text-gray-300 italic' : 'text-gray-200'}`}
              dir={isRTL(displaySourceLanguage) ? 'rtl' : 'ltr'}
              style={{ 
                fontFamily: isRTL(displaySourceLanguage) ? 'Tahoma, Arial, sans-serif' : 'inherit',
                textAlign: isRTL(displaySourceLanguage) ? 'right' : 'left'
              }}
            >
              {displayText}
              {isInterim && <span className="ml-1 animate-pulse">|</span>}
            </p>
          ) : (
            <p className="text-gray-500 italic">Waiting for speech input...</p>
          )}
        </div>
      </div>

      {/* Translated Text */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 relative overflow-hidden">
        {/* Speaking indicator */}
        {isSpeaking && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-blue-500 animate-pulse" />
        )}
        
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isSpeaking ? 'bg-green-500 animate-pulse' : 'bg-green-500'}`} />
            <span>Translation</span>
            <span className="text-sm text-green-400">({displayTargetLanguageName})</span>
            <div className="flex items-center space-x-1">
              {translationMode === 'online' ? (
                <Cloud className="w-4 h-4 text-green-400" />
              ) : (
                <HardDrive className="w-4 h-4 text-blue-400" />
              )}
              <span className="text-xs text-gray-400">
                {translationMode === 'online' ? 'Cloud' : 'Local'}
              </span>
            </div>
            {isSpeaking && <Volume2 className="w-4 h-4 text-green-400 animate-pulse" />}
          </h3>
          <div className="flex items-center space-x-2">
            {isSpeaking && (
              <div className="flex items-center space-x-1 text-green-400">
                <Volume2 className="w-4 h-4 animate-pulse" />
                <span className="text-sm">Speaking</span>
              </div>
            )}
            <button
              onClick={() => copyToClipboard(translatedText)}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              disabled={!translatedText}
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="min-h-[120px] p-4 bg-gray-900 rounded-lg relative">
          {isProcessing ? (
            <div className="flex items-center justify-center space-x-2 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Translating...</span>
            </div>
          ) : translatedText ? (
            <p 
              className="text-gray-200 leading-relaxed"
              dir={isRTL(targetLanguage) ? 'rtl' : 'ltr'}
              style={{ 
                fontFamily: isRTL(targetLanguage) ? 'Tahoma, Arial, sans-serif' : 'inherit',
                textAlign: isRTL(targetLanguage) ? 'right' : 'left'
              }}
            >
              {translatedText}
            </p>
          ) : (
            <p className="text-gray-500 italic">Translation will appear here...</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TranslationDisplay;