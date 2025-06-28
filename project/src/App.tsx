import React, { useState } from 'react';
import AudioTranslator from './components/AudioTranslator';
import CloudAudioTranslator from './components/CloudAudioTranslator';
import Header from './components/Header';
import { Cloud, Wifi } from 'lucide-react';

function App() {
  const [useCloudMode, setUseCloudMode] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <Header />
      
      {/* Mode Selector */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-center">
          <div className="bg-gray-800 rounded-lg p-1 border border-gray-700">
            <button
              onClick={() => setUseCloudMode(false)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                !useCloudMode
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Wifi className="w-4 h-4" />
              <span>Standard Mode</span>
            </button>
            <button
              onClick={() => setUseCloudMode(true)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                useCloudMode
                  ? 'bg-green-600 text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Cloud className="w-4 h-4" />
              <span>Cloud Mode (Premium)</span>
            </button>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-4">
        {useCloudMode ? <CloudAudioTranslator /> : <AudioTranslator />}
      </main>
    </div>
  );
}

export default App;