import React from 'react';
import { Wifi, WifiOff, Cloud, HardDrive } from 'lucide-react';

interface TranslationModeSelectorProps {
  mode: 'online' | 'offline';
  onModeChange: (mode: 'online' | 'offline') => void;
  isOnlineAvailable: boolean;
  isOfflineAvailable: boolean;
}

const TranslationModeSelector: React.FC<TranslationModeSelectorProps> = ({
  mode,
  onModeChange,
  isOnlineAvailable,
  isOfflineAvailable
}) => {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300 mb-2">
        Translation Mode
      </label>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => onModeChange('online')}
          disabled={!isOnlineAvailable}
          className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
            mode === 'online'
              ? 'bg-green-600 text-white shadow'
              : isOnlineAvailable
              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              : 'bg-gray-800 text-gray-500 cursor-not-allowed'
          }`}
        >
          <Cloud className="w-4 h-4" />
          <span>Online</span>
          {isOnlineAvailable && <Wifi className="w-3 h-3" />}
          {!isOnlineAvailable && <WifiOff className="w-3 h-3" />}
        </button>
        
        <button
          onClick={() => onModeChange('offline')}
          disabled={!isOfflineAvailable}
          className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
            mode === 'offline'
              ? 'bg-blue-600 text-white shadow'
              : isOfflineAvailable
              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              : 'bg-gray-800 text-gray-500 cursor-not-allowed'
          }`}
        >
          <HardDrive className="w-4 h-4" />
          <span>Offline</span>
        </button>
      </div>
      
      <div className="text-xs text-gray-500 space-y-1">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isOnlineAvailable ? 'bg-green-500' : 'bg-red-500'}`} />
          <span>Online: {isOnlineAvailable ? 'Available' : 'No internet connection'}</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isOfflineAvailable ? 'bg-blue-500' : 'bg-yellow-500'}`} />
          <span>Offline: {isOfflineAvailable ? 'Ready' : 'Models downloading...'}</span>
        </div>
      </div>
      
      <div className="text-xs text-gray-500 space-y-1 mt-2">
        <p>• Online: High accuracy, latest AI models, requires internet</p>
        <p>• Offline: Privacy-focused, works without internet, local processing</p>
      </div>
    </div>
  );
};

export default TranslationModeSelector;