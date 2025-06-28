import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Zap, Target, Cloud, Server } from 'lucide-react';
import AudioVisualizer from './AudioVisualizer';
import LanguageSelector from './LanguageSelector';
import AudioDeviceSelector from './AudioDeviceSelector';
import AudioOutputSelector from './AudioOutputSelector';
import TranslationDisplay from './TranslationDisplay';
import { useAudioProcessor } from '../hooks/useAudioProcessor';
import { useCloudSpeechRecognition } from '../hooks/useCloudSpeechRecognition';
import { useCloudTranslation } from '../hooks/useCloudTranslation';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { API_ENDPOINTS, apiRequest, TIMEOUTS } from '../config/api';

const CloudAudioTranslator: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [sourceLanguage, setSourceLanguage] = useState('fa');
  const [targetLanguage, setTargetLanguage] = useState('en');
  const [selectedMicrophone, setSelectedMicrophone] = useState('');
  const [selectedSpeaker, setSelectedSpeaker] = useState('');
  const [speechProvider, setSpeechProvider] = useState<'google' | 'azure'>('google');
  const [translationProvider, setTranslationProvider] = useState<'google' | 'azure'>('google');
  const [latencyMode, setLatencyMode] = useState<'low' | 'high'>('low');
  const [currentText, setCurrentText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  // Enhanced continuous translation state
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
    isProcessing: isSpeechProcessing,
    startListening,
    stopListening,
    interimTranscript
  } = useCloudSpeechRecognition(sourceLanguage, speechProvider);

  const {
    translate,
    isTranslating,
    detectedLanguage
  } = useCloudTranslation();

  const {
    speak,
    isSpeaking,
    stopSpeaking,
    setOutputDevice
  } = useSpeechSynthesis(targetLanguage, selectedSpeaker);

  // Check server status
  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        const response = await apiRequest(API_ENDPOINTS.HEALTH, {
          method: 'GET',
          signal: AbortSignal.timeout(TIMEOUTS.HEALTH_CHECK)
        });
        
        if (response.ok) {
          const data = await response.json();
          setServerStatus('online');
          console.log('✅ Server status:', data);
        } else {
          setServerStatus('offline');
        }
      } catch (error) {
        setServerStatus('offline');
        console.error('❌ Server not available:', error);
      }
    };

    checkServerStatus();
    const interval = setInterval(checkServerStatus, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Set audio output device
  useEffect(() => {
    if (selectedSpeaker) {
      setOutputDevice(selectedSpeaker);
    }
  }, [selectedSpeaker, setOutputDevice]);

  const handleStartRecording = async () => {
    if (serverStatus !== 'online') {
      alert('سرور در دسترس نیست. لطفاً مطمئن شوید که سرور backend روی پورت 3001 در حال اجرا است.');
      return;
    }

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
      
      console.log(`🎤 Cloud recording session started - Speech: ${speechProvider}, Translation: ${translationProvider}`);
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('دسترسی به میکروفون ناموفق بود. لطفاً مجوزها و انتخاب دستگاه را بررسی کنید.');
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
    
    console.log('🛑 Cloud recording session stopped');
  };

  // Enhanced continuous translation with cloud APIs
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
    if (!newContent.trim() || newContent.trim().length < 5) {
      return;
    }

    // Clear previous timeout to prevent overlapping translations
    if (translationTimeoutRef.current) {
      clearTimeout(translationTimeoutRef.current);
    }

    // Optimized delay for stable translation
    const delay = latencyMode === 'low' ? 600 : 1000;
    
    translationTimeoutRef.current = setTimeout(async () => {
      if (!sessionActiveRef.current || isTranslatingRef.current) return;
      
      isTranslatingRef.current = true;
      setIsProcessing(true);
      
      try {
        console.log(`🔄 Translating new content with ${translationProvider}:`, newContent.trim());
        
        const newTranslation = await translate(
          newContent.trim(), 
          sourceLanguage, 
          targetLanguage, 
          latencyMode, 
          translationProvider
        );
        
        if (newTranslation && newTranslation !== newContent.trim() && sessionActiveRef.current) {
          // Append new translation to accumulated translation
          const separator = accumulatedTranslationRef.current ? ' ' : '';
          const fullTranslation = accumulatedTranslationRef.current + separator + newTranslation;
          
          setTranslatedText(fullTranslation);
          accumulatedTranslationRef.current = fullTranslation;
          
          // Update the processed length to current position
          lastProcessedLengthRef.current = newContentLength;
          
          console.log(`✅ ${translationProvider} translation successful:`, newTranslation);
          
          // Speak only the new translation part with minimal delay
          setTimeout(() => {
            if (newTranslation && sessionActiveRef.current && !isSpeaking) {
              console.log('🔊 Speaking new translation:', newTranslation);
              speak(newTranslation);
            }
          }, 200);
        } else {
          console.log('⚠️ Translation returned same text or empty');
        }
        
      } catch (error) {
        console.error(`❌ ${translationProvider} translation failed:`, error);
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
  }, [transcript, interimTranscript, translate, sourceLanguage, targetLanguage, latencyMode, translationProvider, speak, isSpeaking]);

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
      {/* Server Status Banner */}
      {serverStatus !== 'online' && (
        <div className={`rounded-lg p-4 border ${
          serverStatus === 'checking' 
            ? 'bg-yellow-900 border-yellow-600 text-yellow-200'
            : 'bg-red-900 border-red-600 text-red-200'
        }`}>
          <div className="flex items-center space-x-2">
            <Server className="w-5 h-5" />
            <span className="font-medium">
              {serverStatus === 'checking' 
                ? 'در حال بررسی وضعیت سرور...'
                : 'سرور backend آفلاین است. لطفاً سرور را با دستور npm run server راه‌اندازی کنید'
              }
            </span>
          </div>
        </div>
      )}

      {/* Main Control Panel */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Language Selection */}
          <div className="space-y-4">
            <LanguageSelector
              label="زبان مبدا"
              value={sourceLanguage}
              onChange={setSourceLanguage}
              detectedLanguage={detectedLanguage}
              allowAuto={true}
            />
            <LanguageSelector
              label="زبان مقصد"
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

          {/* Cloud Provider Selection */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                ارائه‌دهنده تشخیص گفتار
              </label>
              <div className="flex rounded-lg bg-gray-700 p-1">
                <button
                  onClick={() => setSpeechProvider('google')}
                  className={`flex-1 flex items-center justify-center space-x-1 px-2 py-2 rounded-md text-xs font-medium transition-all ${
                    speechProvider === 'google'
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Cloud className="w-3 h-3" />
                  <span>Google</span>
                </button>
                <button
                  onClick={() => setSpeechProvider('azure')}
                  className={`flex-1 flex items-center justify-center space-x-1 px-2 py-2 rounded-md text-xs font-medium transition-all ${
                    speechProvider === 'azure'
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Cloud className="w-3 h-3" />
                  <span>Azure</span>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                ارائه‌دهنده ترجمه
              </label>
              <div className="flex rounded-lg bg-gray-700 p-1">
                <button
                  onClick={() => setTranslationProvider('google')}
                  className={`flex-1 flex items-center justify-center space-x-1 px-2 py-2 rounded-md text-xs font-medium transition-all ${
                    translationProvider === 'google'
                      ? 'bg-green-600 text-white shadow'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Cloud className="w-3 h-3" />
                  <span>Google</span>
                </button>
                <button
                  onClick={() => setTranslationProvider('azure')}
                  className={`flex-1 flex items-center justify-center space-x-1 px-2 py-2 rounded-md text-xs font-medium transition-all ${
                    translationProvider === 'azure'
                      ? 'bg-green-600 text-white shadow'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Cloud className="w-3 h-3" />
                  <span>Azure</span>
                </button>
              </div>
            </div>
          </div>

          {/* Audio Visualizer */}
          <div className="flex flex-col items-center justify-center">
            <AudioVisualizer
              audioLevel={audioLevel}
              isRecording={isRecordingActive}
              isProcessing={isProcessing || isTranslating || isSpeechProcessing}
            />
            <div className="mt-4 space-y-2 text-center">
              <div className="flex items-center justify-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`} />
                <span className="text-sm text-gray-400">
                  {isListening ? 'در حال گوش دادن...' : 'آماده'}
                </span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  serverStatus === 'online' ? 'bg-green-500' : 'bg-red-500'
                }`} />
                <span className="text-xs text-gray-500">
                  سرور: {serverStatus === 'online' ? 'آنلاین' : 'آفلاین'}
                </span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-xs text-gray-500">
                  {speechProvider}/{translationProvider} • {latencyMode === 'low' ? 'سریع' : 'دقیق'}
                </span>
              </div>
              {confidence > 0 && (
                <div className="text-xs text-gray-500">
                  اطمینان: {Math.round(confidence * 100)}%
                </div>
              )}
            </div>
          </div>

          {/* Control Buttons */}
          <div className="space-y-4">
            <div className="flex flex-col space-y-3">
              <button
                onClick={isRecording ? handleStopRecording : handleStartRecording}
                disabled={!selectedMicrophone || serverStatus !== 'online'}
                className={`flex items-center justify-center space-x-2 px-6 py-4 rounded-lg font-medium transition-all transform hover:scale-105 ${
                  isRecording
                    ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/30'
                    : 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-600 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30'
                }`}
              >
                {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                <span className="font-semibold">
                  {isRecording ? 'توقف ترجمه' : 'شروع ترجمه ابری'}
                </span>
              </button>
              
              {/* Speed Mode */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  حالت سرعت
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
                    <span>سریع</span>
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
                    <span>دقیق</span>
                  </button>
                </div>
              </div>
            </div>
            
            {/* Real-time Status */}
            <div className="bg-gray-900 rounded-lg p-3 space-y-2">
              <div className="text-xs text-gray-400 space-y-1">
                <div className="flex justify-between">
                  <span>سطح صدا:</span>
                  <span>{Math.round(audioLevel * 100)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>وضعیت:</span>
                  <span className={
                    isProcessing || isSpeechProcessing ? 'text-yellow-400' : 
                    isSpeaking ? 'text-green-400' : 
                    'text-gray-400'
                  }>
                    {isProcessing || isSpeechProcessing ? 'در حال پردازش...' : 
                     isSpeaking ? 'در حال صحبت...' : 
                     'آماده'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>شبکه:</span>
                  <span className={isOnline ? 'text-green-400' : 'text-red-400'}>
                    {isOnline ? 'آنلاین' : 'آفلاین'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>پردازش شده:</span>
                  <span className="text-blue-400">{lastProcessedLengthRef.current} کاراکتر</span>
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
        isProcessing={isProcessing || isTranslating || isSpeechProcessing}
        isSpeaking={isSpeaking}
        confidence={confidence}
        detectedLanguage={detectedLanguage}
        translationMode="online"
        interimText={interimTranscript}
      />

      {/* Cloud Features Info */}
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
        <div className="text-sm text-gray-400 space-y-2">
          <h4 className="text-white font-medium">☁️ سیستم ترجمه ابری پیشرفته:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p>• <strong>Google Cloud Speech-to-Text:</strong> دقت بالا برای زبان فارسی</p>
              <p>• <strong>Microsoft Azure Speech:</strong> تشخیص گفتار سازمانی</p>
            </div>
            <div>
              <p>• <strong>Google Cloud Translation:</strong> ترجمه ماشینی عصبی</p>
              <p>• <strong>Azure Translator:</strong> ترجمه حرفه‌ای بلادرنگ</p>
            </div>
          </div>
          <div className="mt-4 p-3 bg-gray-900 rounded-lg">
            <p className="text-xs text-gray-500">
              <strong>تنظیمات مورد نیاز:</strong> کلیدهای API خود را در فایل .env پیکربندی کنید و سرور backend را با 'npm run server' راه‌اندازی کنید
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CloudAudioTranslator;