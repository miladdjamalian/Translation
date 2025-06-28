import React from 'react';
import { Zap, Target, Gauge } from 'lucide-react';

interface ControlPanelProps {
  latencyMode: 'low' | 'high';
  onLatencyModeChange: (mode: 'low' | 'high') => void;
  confidence: number;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  latencyMode,
  onLatencyModeChange,
  confidence
}) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Translation Mode
        </label>
        <div className="flex rounded-lg bg-gray-700 p-1">
          <button
            onClick={() => onLatencyModeChange('low')}
            className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
              latencyMode === 'low'
                ? 'bg-blue-600 text-white shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Low Latency</span>
          </button>
          <button
            onClick={() => onLatencyModeChange('high')}
            className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
              latencyMode === 'high'
                ? 'bg-blue-600 text-white shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Target className="w-4 h-4" />
            <span>High Accuracy</span>
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Speech Confidence
        </label>
        <div className="flex items-center space-x-2">
          <Gauge className="w-4 h-4 text-gray-400" />
          <div className="flex-1 bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                confidence >= 0.8 ? 'bg-green-500' :
                confidence >= 0.6 ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
              style={{ width: `${confidence * 100}%` }}
            />
          </div>
          <span className="text-sm text-gray-400 min-w-[3rem]">
            {Math.round(confidence * 100)}%
          </span>
        </div>
      </div>

      <div className="text-xs text-gray-500 space-y-1">
        <p>• Low Latency: Faster response, may sacrifice some accuracy</p>
        <p>• High Accuracy: Better translation quality, slight delay</p>
      </div>
    </div>
  );
};

export default ControlPanel;