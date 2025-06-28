import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import { Readable } from 'stream';
import { promisify } from 'util';

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegStatic);

export class AzureSpeechService {
  constructor() {
    if (process.env.AZURE_SPEECH_KEY && process.env.AZURE_SPEECH_REGION) {
      try {
        this.speechConfig = sdk.SpeechConfig.fromSubscription(
          process.env.AZURE_SPEECH_KEY,
          process.env.AZURE_SPEECH_REGION
        );
        
        // Configure for best quality
        this.speechConfig.speechRecognitionLanguage = 'fa-IR';
        this.speechConfig.outputFormat = sdk.OutputFormat.Detailed;
        
        console.log('✅ Azure Speech client initialized');
      } catch (error) {
        console.error('❌ Failed to initialize Azure Speech client:', error);
        this.speechConfig = null;
      }
    } else {
      console.warn('⚠️ Azure Speech not configured - missing AZURE_SPEECH_KEY or AZURE_SPEECH_REGION');
      this.speechConfig = null;
    }
  }

  async convertWebmToWav(webmBuffer) {
    return new Promise((resolve, reject) => {
      console.log('🔄 Converting WebM to WAV for Azure Speech API');
      
      const chunks = [];
      const inputStream = new Readable();
      inputStream.push(webmBuffer);
      inputStream.push(null);

      ffmpeg(inputStream)
        .inputFormat('webm')
        .audioCodec('pcm_s16le')
        .audioFrequency(16000)
        .audioChannels(1)
        .format('wav')
        .on('error', (err) => {
          console.error('❌ FFmpeg conversion error:', err);
          reject(new Error(`Audio conversion failed: ${err.message}`));
        })
        .on('end', () => {
          console.log('✅ WebM to WAV conversion completed');
          const wavBuffer = Buffer.concat(chunks);
          resolve(wavBuffer);
        })
        .pipe()
        .on('data', (chunk) => {
          chunks.push(chunk);
        });
    });
  }

  async transcribeAudio(audioBuffer, language = 'fa-IR', audioFormat = 'webm') {
    if (!this.speechConfig) {
      throw new Error('Azure Speech client not initialized');
    }

    try {
      console.log('🔄 Azure Speech: Processing audio buffer of size:', audioBuffer.length);
      
      // Set language
      this.speechConfig.speechRecognitionLanguage = language;
      
      let processedBuffer = audioBuffer;
      
      // Convert WebM to WAV if needed
      if (audioFormat === 'webm') {
        try {
          processedBuffer = await this.convertWebmToWav(audioBuffer);
          console.log('✅ Audio converted from WebM to WAV, new size:', processedBuffer.length);
        } catch (conversionError) {
          console.error('❌ Audio conversion failed:', conversionError);
          throw new Error(`Audio format conversion failed: ${conversionError.message}`);
        }
      }
      
      // Create audio config from buffer
      const audioConfig = sdk.AudioConfig.fromWavFileInput(processedBuffer);
      
      // Create recognizer
      const recognizer = new sdk.SpeechRecognizer(this.speechConfig, audioConfig);
      
      console.log(`🎤 Azure Speech: Processing ${processedBuffer.length} bytes of converted audio`);

      return new Promise((resolve, reject) => {
        recognizer.recognizeOnceAsync(
          (result) => {
            console.log('📥 Azure Speech API result:', {
              reason: result.reason,
              text: result.text,
              resultId: result.resultId
            });
            
            if (result.reason === sdk.ResultReason.RecognizedSpeech) {
              const finalResult = {
                transcript: result.text || '',
                confidence: result.properties?.getProperty(sdk.PropertyId.SpeechServiceResponse_JsonResult) ? 0.9 : 0.7,
                detectedLanguage: language
              };
              console.log('✅ Azure Speech final result:', finalResult);
              resolve(finalResult);
            } else if (result.reason === sdk.ResultReason.NoMatch) {
              console.log('⚠️ Azure Speech: No match found');
              resolve({
                transcript: '',
                confidence: 0,
                detectedLanguage: language
              });
            } else {
              console.error('❌ Azure Speech recognition failed:', result.errorDetails);
              reject(new Error(`Azure Speech recognition failed: ${result.errorDetails}`));
            }
            recognizer.close();
          },
          (error) => {
            console.error('❌ Azure Speech error:', error);
            recognizer.close();
            reject(new Error(`Azure Speech API error: ${error}`));
          }
        );
      });

    } catch (error) {
      console.error('❌ Azure Speech transcription error:', error);
      throw new Error(`Azure Speech API error: ${error.message}`);
    }
  }

  async startStreamingRecognition(language = 'fa-IR', sessionId) {
    if (!this.speechConfig) {
      throw new Error('Azure Speech client not initialized');
    }

    try {
      this.speechConfig.speechRecognitionLanguage = language;
      
      // Create audio config for streaming
      const audioConfig = sdk.AudioConfig.fromDefaultMicrophoneInput();
      
      // Create recognizer
      const recognizer = new sdk.SpeechRecognizer(this.speechConfig, audioConfig);
      
      // Set up event handlers
      recognizer.recognizing = (s, e) => {
        console.log(`📝 Azure Stream ${sessionId} (interim): "${e.result.text}"`);
        // Send interim results to WebSocket
      };
      
      recognizer.recognized = (s, e) => {
        if (e.result.reason === sdk.ResultReason.RecognizedSpeech) {
          console.log(`📝 Azure Stream ${sessionId} (final): "${e.result.text}"`);
          // Send final results to WebSocket
        }
      };
      
      recognizer.canceled = (s, e) => {
        console.error(`❌ Azure Stream ${sessionId} canceled:`, e.errorDetails);
        recognizer.stopContinuousRecognitionAsync();
      };
      
      // Start continuous recognition
      recognizer.startContinuousRecognitionAsync();
      
      return {
        sessionId,
        recognizer,
        status: 'active'
      };

    } catch (error) {
      console.error('❌ Azure streaming setup error:', error);
      throw new Error(`Azure Streaming setup error: ${error.message}`);
    }
  }
}
