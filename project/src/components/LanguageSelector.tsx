import React from 'react';
import { ChevronDown, Globe } from 'lucide-react';

interface LanguageSelectorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  detectedLanguage?: string;
  allowAuto?: boolean;
}

const LANGUAGES = [
  { code: 'auto', name: 'Auto Detect' },
  { code: 'en', name: 'English' },
  { code: 'fa', name: 'فارسی (Persian)' },
  { code: 'ar', name: 'العربية (Arabic)' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'it', name: 'Italiano' },
  { code: 'pt', name: 'Português' },
  { code: 'ru', name: 'Русский' },
  { code: 'ja', name: '日本語' },
  { code: 'ko', name: '한국어' },
  { code: 'zh', name: '中文' },
  { code: 'hi', name: 'हिन्दी' },
  { code: 'th', name: 'ไทย' },
  { code: 'vi', name: 'Tiếng Việt' },
  { code: 'nl', name: 'Nederlands' },
  { code: 'sv', name: 'Svenska' },
  { code: 'no', name: 'Norsk' },
  { code: 'da', name: 'Dansk' },
  { code: 'fi', name: 'Suomi' },
  { code: 'tr', name: 'Türkçe' },
  { code: 'pl', name: 'Polski' },
  { code: 'cs', name: 'Čeština' },
  { code: 'hu', name: 'Magyar' },
  { code: 'ro', name: 'Română' },
  { code: 'bg', name: 'Български' },
  { code: 'hr', name: 'Hrvatski' },
  { code: 'sk', name: 'Slovenčina' },
  { code: 'sl', name: 'Slovenščina' },
  { code: 'et', name: 'Eesti' },
  { code: 'lv', name: 'Latviešu' },
  { code: 'lt', name: 'Lietuvių' },
  { code: 'mt', name: 'Malti' },
  { code: 'ga', name: 'Gaeilge' },
  { code: 'cy', name: 'Cymraeg' },
  { code: 'eu', name: 'Euskera' },
  { code: 'ca', name: 'Català' },
  { code: 'gl', name: 'Galego' },
  { code: 'is', name: 'Íslenska' },
  { code: 'mk', name: 'Македонски' },
  { code: 'sq', name: 'Shqip' },
  { code: 'sr', name: 'Српски' },
  { code: 'bs', name: 'Bosanski' },
  { code: 'me', name: 'Crnogorski' },
  { code: 'he', name: 'עברית' },
  { code: 'ur', name: 'اردو' },
  { code: 'bn', name: 'বাংলা' },
  { code: 'ta', name: 'தமிழ்' },
  { code: 'te', name: 'తెలుగు' },
  { code: 'ml', name: 'മലയാളം' },
  { code: 'kn', name: 'ಕನ್ನಡ' },
  { code: 'gu', name: 'ગુજરાતી' },
  { code: 'pa', name: 'ਪੰਜਾਬੀ' },
  { code: 'mr', name: 'मराठी' },
  { code: 'ne', name: 'नेपाली' },
  { code: 'si', name: 'සිංහල' },
  { code: 'my', name: 'မြန်မာ' },
  { code: 'km', name: 'ខ្មែរ' },
  { code: 'lo', name: 'ລາວ' },
  { code: 'ka', name: 'ქართული' },
  { code: 'am', name: 'አማርኛ' },
  { code: 'sw', name: 'Kiswahili' },
  { code: 'zu', name: 'isiZulu' },
  { code: 'af', name: 'Afrikaans' },
  { code: 'xh', name: 'isiXhosa' }
];

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  label,
  value,
  onChange,
  detectedLanguage,
  allowAuto = false
}) => {
  const availableLanguages = allowAuto ? LANGUAGES : LANGUAGES.filter(lang => lang.code !== 'auto');
  const selectedLanguage = availableLanguages.find(lang => lang.code === value);

  return (
    <div className="space-y-2">
      <label className="flex items-center space-x-2 text-sm font-medium text-gray-300">
        <Globe className="w-4 h-4" />
        <span>{label}</span>
        {detectedLanguage && value === 'auto' && (
          <span className="text-blue-400 text-xs">
            (Detected: {LANGUAGES.find(l => l.code === detectedLanguage)?.name || detectedLanguage})
          </span>
        )}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
          dir={value === 'fa' || value === 'ar' || value === 'he' || value === 'ur' ? 'rtl' : 'ltr'}
        >
          {availableLanguages.map((language) => (
            <option key={language.code} value={language.code}>
              {language.name}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
};

export default LanguageSelector;