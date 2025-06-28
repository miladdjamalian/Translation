import { useEffect, useRef } from 'react';

interface AudioProcessorOptions {
  onStart?: () => void;
  onStop?: () => void;
  onVolumeChange?: (volume: number) => void;
  isActive: boolean;
  socket: WebSocket;
  sessionId: string;
  language: string;
}

export default function useAudioProcessor({
  onStart,
  onStop,
  onVolumeChange,
  isActive,
  socket,
  sessionId,
  language
}: AudioProcessorOptions) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isActive) return;

    let audioContext: AudioContext;
    let analyser: AnalyserNode;
    let dataArray: Uint8Array;

    const handleSuccess = async (stream: MediaStream) => {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 256;
      const bufferLength = analyser.frequencyBinCount;
      dataArray = new Uint8Array(bufferLength);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      dataArrayRef.current = dataArray;
      sourceRef.current = source;

      // Setup MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          const reader = new FileReader();
          reader.onloadend = () => {
            const audioBase64 = reader.result?.toString().split(',')[1];
            if (audioBase64 && socket.readyState === WebSocket.OPEN) {
              socket.send(JSON.stringify({
                type: 'audio-chunk',
                audioData: audioBase64,
                language,
                sessionId,
              }));
            }
          };
          reader.readAsDataURL(event.data);
        }
      };

      mediaRecorder.start(500);

      const tick = () => {
        if (!analyser || !dataArray || !onVolumeChange) return;
        analyser.getByteFrequencyData(dataArray);
        const volume = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        onVolumeChange(volume);
        animationFrameIdRef.current = requestAnimationFrame(tick);
      };

      tick();
      onStart?.();
    };

    navigator.mediaDevices.getUserMedia({ audio: true }).then(handleSuccess);

    return () => {
      animationFrameIdRef.current && cancelAnimationFrame(animationFrameIdRef.current);
      analyserRef.current?.disconnect();
      sourceRef.current?.disconnect();
      audioContextRef.current?.close();
      mediaRecorderRef.current?.stop();
      onStop?.();
    };
  }, [isActive]);
}
