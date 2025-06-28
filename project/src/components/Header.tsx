import React from 'react';
import { Languages, Mic } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Languages className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Real-time Audio Translator</h1>
            <p className="text-gray-400 text-sm">Live speech translation with AI-powered voice synthesis</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 text-gray-400">
          <Mic className="w-5 h-5" />
          <span className="text-sm">Professional Edition</span>
        </div>
      </div>
    </header>
  );
};

export default Header;