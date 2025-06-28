import { useState, useRef, useCallback } from 'react';

export const useAudioProcessor = (deviceId?: string) => {
  const [audioLevel, setAudioLevel] = useState(0);
  const [isRecordingActive, setIsRecordingActive] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number>();

  const analyzeAudio = useCallback(() => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    console.log('🔊 Audio data array sample:', dataArray.slice(0, 10)); // Debug log
    
    // Calculate average volume
    const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
    const normalizedLevel = Math.min(average / 128, 1);
    
    console.log('📊 Audio level calculated:', normalizedLevel, 'from average:', average); // Debug log
    
    setAudioLevel(normalizedLevel);
    
    if (isRecordingActive) {
      animationFrameRef.current = requestAnimationFrame(analyzeAudio);
    }
  }, [isRecordingActive]);

  const startRecording = useCallback(async () => {
    try {
      console.log('🎤 Starting recording with device:', deviceId); // Debug log
      
      // ✅ تغییر کلیدی: نرخ نمونه‌برداری را به 48000 هرتز تغییر دادیم
      // این تغییر تضمین می‌کند که تمام قسمت‌های سیستم از یک نرخ نمونه‌برداری استفاده کنند
      const constraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000, // 🔧 تغییر از 16000 به 48000 برای سازگاری با Opus
          channelCount: 1, // تک کانال برای بهینه‌سازی
          ...(deviceId && { deviceId: { exact: deviceId } })
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('✅ Microphone stream obtained with 48kHz:', stream, 'tracks:', stream.getAudioTracks().length); // Debug log
      
      streamRef.current = stream;
      
      // Set up audio analysis
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      console.log('🔗 Audio context and analyser connected'); // Debug log
      
      // Set up media recorder
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
        ? 'audio/webm;codecs=opus' 
        : 'audio/webm';
      
      console.log('🎵 Using MIME type:', mimeType); // Debug log
      
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: mimeType
      });
      
      mediaRecorderRef.current.start();
      setIsRecordingActive(true);
      
      console.log('🔴 MediaRecorder started with 48kHz sample rate'); // Debug log
      
      // Start audio analysis
      analyzeAudio();
      
    } catch (error) {
      console.error('❌ Error starting recording:', error);
      throw error;
    }
  }, [analyzeAudio, deviceId]);

  const stopRecording = useCallback(() => {
    console.log('🛑 Stopping recording'); // Debug log
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('🔇 Audio track stopped:', track.label); // Debug log
      });
    }
    
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    setIsRecordingActive(false);
    setAudioLevel(0);
  }, []);

  return {
    startRecording,
    stopRecording,
    audioLevel,
    isRecordingActive
  };
};
