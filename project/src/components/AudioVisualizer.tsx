import React from 'react';
import { Mic, Loader2, Volume2 } from 'lucide-react';

interface AudioVisualizerProps {
  audioLevel: number;
  isRecording: boolean;
  isProcessing: boolean;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  audioLevel,
  isRecording,
  isProcessing
}) => {
  const bars = Array.from({ length: 20 }, (_, i) => {
    const threshold = (i + 1) / 20;
    const isActive = audioLevel > threshold;
    const height = isActive ? 100 : 20;
    
    return (
      <div
        key={i}
        className={`w-2 rounded-full transition-all duration-100 ${
          isActive 
            ? isRecording 
              ? 'bg-blue-500' 
              : 'bg-gray-500'
            : 'bg-gray-700'
        }`}
        style={{ height: `${height}%` }}
      />
    );
  });

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
          isRecording 
            ? 'bg-blue-600 shadow-lg shadow-blue-500/50' 
            : 'bg-gray-700'
        }`}>
          {isProcessing ? (
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          ) : isRecording ? (
            <Mic className="w-8 h-8 text-white" />
          ) : (
            <Volume2 className="w-8 h-8 text-gray-400" />
          )}
        </div>
        {isRecording && (
          <div className="absolute inset-0 rounded-full bg-blue-600 animate-ping opacity-75" />
        )}
      </div>
      
      <div className="flex items-end space-x-1 h-20">
        {bars}
      </div>
    </div>
  );
};

export default AudioVisualizer;