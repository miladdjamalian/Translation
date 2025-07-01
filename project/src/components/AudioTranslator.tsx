import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Download, Zap, Target } from 'lucide-react';
import AudioVisualizer from './AudioVisualizer';
import LanguageSelector from './LanguageSelector';
import AudioDeviceSelector from './AudioDeviceSelector';
import AudioOutputSelector from './AudioOutputSelector';
import TranslationModeSelector from './TranslationModeSelector';
import TranslationDisplay from './TranslationDisplay';
import { useAudioProcessor } from '../hooks/useAudioProcessor';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useTranslation } from '../hooks/useTranslation';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

const AudioTranslator: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [sourceLanguage, setSourceLanguage] = useState('fa');
  const [targetLanguage, setTargetLanguage] = useState('en');
  const [selectedMicrophone, setSelectedMicrophone] = useState('');
  const [selectedSpeaker, setSelectedSpeaker] = useState('');
  const [translationMode, setTranslationMode] = useState<'online' | 'offline'>('online');
  const [latencyMode, setLatencyMode] = useState<'low' | 'high'>('low');
  const [currentText, setCurrentText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [offlineModelsReady, setOfflineModelsReady] = useState(false);

  // Improved continuous translation state
  const accumulatedTextRef = useRef<string>('');
  const accumulatedTranslationRef = useRef<string>('');
  const lastProcessedLengthRef = useRef<number>(0);
  const translationTimeoutRef = useRef<NodeJS.Timeout>();
  const isTranslatingRef = useRef(false);
  const sessionActiveRef = useRef(false);

  const { isOnline } = useNetworkStatus();

  const {
    startRecording,
    stopRecording,
    audioLevel,
    isRecordingActive
  } = useAudioProcessor(selectedMicrophone);

  const {
    transcript,
    confidence,
    isListening,
    startListening,
    stopListening,
    interimTranscript
  } = useSpeechRecognition(sourceLanguage);

  const {
    translate,
    isTranslating,
    detectedLanguage,
    downloadOfflineModels,
    isDownloadingModels
  } = useTranslation();

  const {
    speak,
    isSpeaking,
    stopSpeaking,
    setOutputDevice
  } = useSpeechSynthesis(targetLanguage, selectedSpeaker);

  // Check offline models availability
  useEffect(() => {
    const checkOfflineModels = async () => {
      const hasModels = localStorage.getItem('offline-models-downloaded') === 'true';
      setOfflineModelsReady(hasModels);
    };
    
    checkOfflineModels();
  }, []);

  // Set audio output device
  useEffect(() => {
    if (selectedSpeaker) {
      setOutputDevice(selectedSpeaker);
    }
  }, [selectedSpeaker, setOutputDevice]);

  const handleStartRecording = async () => {
    try {
      await startRecording();
      startListening();
      setIsRecording(true);
      sessionActiveRef.current = true;
      
      // Reset all state for new session
      setCurrentText('');
      setTranslatedText('');
      accumulatedTextRef.current = '';
      accumulatedTranslationRef.current = '';
      lastProcessedLengthRef.current = 0;
      isTranslatingRef.current = false;
      
      console.log('🎤 Recording session started - Translation mode:', translationMode);
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('Failed to access microphone. Please check permissions and device selection.');
    }
  };

  const handleStopRecording = () => {
    stopRecording();
    stopListening();
    stopSpeaking();
    setIsRecording(false);
    sessionActiveRef.current = false;
    
    if (translationTimeoutRef.current) {
      clearTimeout(translationTimeoutRef.current);
    }
    isTranslatingRef.current = false;
    
    console.log('🛑 Recording session stopped');
  };

  const handleDownloadOfflineModels = async () => {
    try {
      await downloadOfflineModels();
      localStorage.setItem('offline-models-downloaded', 'true');
      setOfflineModelsReady(true);
    } catch (error) {
      console.error('Failed to download offline models:', error);
    }
  };

  // Enhanced continuous translation with better stability
  useEffect(() => {
    const currentTranscript = transcript || interimTranscript;
    
    if (!currentTranscript || !sessionActiveRef.current) {
      return;
    }

    // Always update display immediately
    setCurrentText(currentTranscript);
    accumulatedTextRef.current = currentTranscript;
    
    // Only process new content that hasn't been translated yet
    const newContentLength = currentTranscript.length;
    const lastProcessedLength = lastProcessedLengthRef.current;
    
    // Skip if no new content or already translating
    if (newContentLength <= lastProcessedLength || isTranslatingRef.current) {
      return;
    }

    // Extract only the new part that needs translation
    const newContent = currentTranscript.slice(lastProcessedLength);
    
    // Only translate if we have meaningful new content
    if (!newContent.trim() || newContent.trim().length < 3) {
      return;
    }

    // Clear previous timeout to prevent overlapping translations
    if (translationTimeoutRef.current) {
      clearTimeout(translationTimeoutRef.current);
    }

    // Optimized delay for stable translation
    const delay = latencyMode === 'low' ? 1000 : 1500; // Increased for stability
    
    translationTimeoutRef.current = setTimeout(async () => {
      if (!sessionActiveRef.current || isTranslatingRef.current) return;
      
      isTranslatingRef.current = true;
      setIsProcessing(true);
      
      try {
        console.log('🔄 Translating new content:', newContent.trim());
        console.log('📊 Translation mode:', translationMode, '| Speed:', latencyMode);
        
        const newTranslation = await translate(
          newContent.trim(), 
          sourceLanguage, 
          targetLanguage, 
          latencyMode, 
          translationMode
        );
        
        if (newTranslation && newTranslation !== newContent.trim() && sessionActiveRef.current) {
          // Append new translation to accumulated translation
          const separator = accumulatedTranslationRef.current ? ' ' : '';
          const fullTranslation = accumulatedTranslationRef.current + separator + newTranslation;
          
          setTranslatedText(fullTranslation);
          accumulatedTranslationRef.current = fullTranslation;
          
          // Update the processed length to current position
          lastProcessedLengthRef.current = newContentLength;
          
          console.log('✅ Translation successful:', newTranslation);
          console.log('📝 Full accumulated translation:', fullTranslation);
          
          // Speak only the new translation part with minimal delay
          setTimeout(() => {
            if (newTranslation && sessionActiveRef.current) {
              console.log('🔊 Speaking new translation:', newTranslation);
              speak(newTranslation);
            }
          }, 200);
        } else {
          console.log('⚠️ Translation returned same text or empty');
        }
        
      } catch (error) {
        console.error('❌ Translation failed:', error);
        // Don't change translation mode on error - keep trying online
      } finally {
        setIsProcessing(false);
        isTranslatingRef.current = false;
      }
    }, delay);

    return () => {
      if (translationTimeoutRef.current) {
        clearTimeout(translationTimeoutRef.current);
      }
    };
  }, [transcript, interimTranscript, translate, sourceLanguage, targetLanguage, latencyMode, translationMode, speak, isSpeaking]);

  // Clear texts when languages change
  useEffect(() => {
    setCurrentText('');
    setTranslatedText('');
    accumulatedTextRef.current = '';
    accumulatedTranslationRef.current = '';
    lastProcessedLengthRef.current = 0;
    stopSpeaking();
  }, [sourceLanguage, targetLanguage, stopSpeaking]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Main Control Panel */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Language Selection */}
          <div className="space-y-4">
            <LanguageSelector
              label="Source Language"
              value={sourceLanguage}
              onChange={setSourceLanguage}
              detectedLanguage={detectedLanguage}
              allowAuto={true}
            />
            <LanguageSelector
              label="Target Language"
              value={targetLanguage}
              onChange={setTargetLanguage}
              allowAuto={false}
            />
          </div>

          {/* Audio Device Selection */}
          <div className="space-y-4">
            <AudioDeviceSelector
              selectedDeviceId={selectedMicrophone}
              onDeviceChange={setSelectedMicrophone}
            />
            <AudioOutputSelector
              selectedDeviceId={selectedSpeaker}
              onDeviceChange={setSelectedSpeaker}
            />
          </div>

          {/* Translation Mode */}
          <div className="space-y-4">
            <TranslationModeSelector
              mode={translationMode}
              onModeChange={setTranslationMode}
              isOnlineAvailable={isOnline}
              isOfflineAvailable={offlineModelsReady}
            />
            
            {/* Speed Mode */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                Speed Mode
              </label>
              <div className="flex rounded-lg bg-gray-700 p-1">
                <button
                  onClick={() => setLatencyMode('low')}
                  className={`flex-1 flex items-center justify-center space-x-1 px-2 py-2 rounded-md text-xs font-medium transition-all ${
                    latencyMode === 'low'
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Zap className="w-3 h-3" />
                  <span>Fast</span>
                </button>
                <button
                  onClick={() => setLatencyMode('high')}
                  className={`flex-1 flex items-center justify-center space-x-1 px-2 py-2 rounded-md text-xs font-medium transition-all ${
                    latencyMode === 'high'
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Target className="w-3 h-3" />
                  <span>Accurate</span>
                </button>
              </div>
            </div>
          </div>

          {/* Audio Visualizer */}
          <div className="flex flex-col items-center justify-center">
            <AudioVisualizer
              audioLevel={audioLevel}
              isRecording={isRecordingActive}
              isProcessing={isProcessing || isTranslating}
            />
            <div className="mt-4 space-y-2 text-center">
              <div className="flex items-center justify-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`} />
                <span className="text-sm text-gray-400">
                  {isListening ? 'Listening...' : 'Idle'}
                </span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  translationMode === 'online' ? 'bg-green-500' : 'bg-blue-500'
                }`} />
                <span className="text-xs text-gray-500">
                  {translationMode === 'online' ? 'Google/LibreTranslate' : 'Offline'} • {latencyMode === 'low' ? 'Fast' : 'Accurate'}
                </span>
              </div>
              {confidence > 0 && (
                <div className="text-xs text-gray-500">
                  Confidence: {Math.round(confidence * 100)}%
                </div>
              )}
            </div>
          </div>

          {/* Control Buttons */}
          <div className="space-y-4">
            <div className="flex flex-col space-y-3">
              <button
                onClick={isRecording ? handleStopRecording : handleStartRecording}
                disabled={!selectedMicrophone || (translationMode === 'offline' && !offlineModelsReady)}
                className={`flex items-center justify-center space-x-2 px-6 py-4 rounded-lg font-medium transition-all transform hover:scale-105 ${
                  isRecording
                    ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/30'
                    : 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-600 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30'
                }`}
              >
                {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                <span className="font-semibold">
                  {isRecording ? 'Stop Translation' : 'Start Continuous Translation'}
                </span>
              </button>
              
              {!offlineModelsReady && (
                <button
                  onClick={handleDownloadOfflineModels}
                  disabled={isDownloadingModels}
                  className="flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium bg-purple-600 hover:bg-purple-700 text-white disabled:bg-gray-600 text-sm transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>
                    {isDownloadingModels ? 'Downloading Models...' : 'Download Offline Models'}
                  </span>
                </button>
              )}
            </div>
            
            {/* Real-time Status */}
            <div className="bg-gray-900 rounded-lg p-3 space-y-2">
              <div className="text-xs text-gray-400 space-y-1">
                <div className="flex justify-between">
                  <span>Audio Level:</span>
                  <span>{Math.round(audioLevel * 100)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className={
                    isProcessing ? 'text-yellow-400' : 
                    isSpeaking ? 'text-green-400' : 
                    'text-gray-400'
                  }>
                    {isProcessing ? 'Processing...' : 
                     isSpeaking ? 'Speaking...' : 
                     'Ready'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Network:</span>
                  <span className={isOnline ? 'text-green-400' : 'text-red-400'}>
                    {isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Mode:</span>
                  <span className={translationMode === 'online' ? 'text-green-400' : 'text-blue-400'}>
                    {translationMode === 'online' ? 'Online' : 'Offline'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Processed:</span>
                  <span className="text-blue-400">{lastProcessedLengthRef.current} chars</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Translation Display */}
      <TranslationDisplay
        originalText={currentText}
        translatedText={translatedText}
        sourceLanguage={sourceLanguage}
        targetLanguage={targetLanguage}
        isProcessing={isProcessing || isTranslating}
        isSpeaking={isSpeaking}
        confidence={confidence}
        detectedLanguage={detectedLanguage}
        translationMode={translationMode}
        interimText={interimTranscript}
      />

      {/* Performance Tips */}
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
        <div className="text-sm text-gray-400 space-y-2">
          <h4 className="text-white font-medium">🚀 Enhanced Translation System:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p>• <strong>Google Translate API:</strong> Fast and accurate translations</p>
              <p>• <strong>LibreTranslate:</strong> Privacy-focused backup service</p>
            </div>
            <div>
              <p>• <strong>Continuous Processing:</strong> No interruptions during speech</p>
              <p>• <strong>Smart Queue Management:</strong> Only new content is processed</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioTranslator;