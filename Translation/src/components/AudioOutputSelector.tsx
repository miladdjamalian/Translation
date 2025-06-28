import React, { useState, useEffect } from 'react';
import { Volume2, ChevronDown, RefreshCw } from 'lucide-react';

interface AudioOutputDevice {
  deviceId: string;
  label: string;
  kind: MediaDeviceKind;
}

interface AudioOutputSelectorProps {
  selectedDeviceId: string;
  onDeviceChange: (deviceId: string) => void;
}

const AudioOutputSelector: React.FC<AudioOutputSelectorProps> = ({
  selectedDeviceId,
  onDeviceChange
}) => {
  const [devices, setDevices] = useState<AudioOutputDevice[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadDevices = async () => {
    setIsLoading(true);
    try {
      const deviceList = await navigator.mediaDevices.enumerateDevices();
      const audioOutputs = deviceList
        .filter(device => device.kind === 'audiooutput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `Speaker ${device.deviceId.slice(0, 8)}`,
          kind: device.kind
        }));
      
      setDevices(audioOutputs);
      
      // Set default device if none selected
      if (!selectedDeviceId && audioOutputs.length > 0) {
        onDeviceChange(audioOutputs[0].deviceId);
      }
    } catch (error) {
      console.error('Error loading audio output devices:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDevices();
    
    // Listen for device changes
    navigator.mediaDevices.addEventListener('devicechange', loadDevices);
    
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', loadDevices);
    };
  }, []);

  const selectedDevice = devices.find(device => device.deviceId === selectedDeviceId);

  return (
    <div className="space-y-2">
      <label className="flex items-center space-x-2 text-sm font-medium text-gray-300">
        <Volume2 className="w-4 h-4" />
        <span>Audio Output</span>
        <button
          onClick={loadDevices}
          disabled={isLoading}
          className="p-1 text-gray-400 hover:text-white transition-colors"
          title="Refresh devices"
        >
          <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </label>
      <div className="relative">
        <select
          value={selectedDeviceId}
          onChange={(e) => onDeviceChange(e.target.value)}
          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
          disabled={devices.length === 0}
        >
          {devices.length === 0 ? (
            <option value="">No speakers found</option>
          ) : (
            devices.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label}
              </option>
            ))
          )}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
      </div>
      {selectedDevice && (
        <p className="text-xs text-gray-500">
          Selected: {selectedDevice.label}
        </p>
      )}
    </div>
  );
};

export default AudioOutputSelector;