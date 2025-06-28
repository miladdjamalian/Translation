import * as sdk from 'microsoft-cognitiveservices-speech-sdk';

export class AzureSpeechService {
  constructor() {
    if (process.env.AZURE_SPEECH_KEY && process.env.AZURE_SPEECH_REGION) {
      this.speechConfig = sdk.SpeechConfig.fromSubscription(
        process.env.AZURE_SPEECH_KEY,
        process.env.AZURE_SPEECH_REGION
      );
      
      // Configure for best quality
      this.speechConfig.speechRecognitionLanguage = 'fa-IR';
      this.speechConfig.outputFormat = sdk.OutputFormat.Detailed;
      
      console.log('✅ Azure Speech client initialized');
    } else {
      console.warn('⚠️ Azure Speech not configured');
    }
  }

  async transcribeAudio(audioBuffer, language = 'fa-IR', audioFormat = 'webm') {
    if (!this.speechConfig) {
      throw new Error('Azure Speech client not initialized');
    }

    try {
      // Set language
      this.speechConfig.speechRecognitionLanguage = language;
      
      // Create audio config from buffer
      const audioConfig = sdk.AudioConfig.fromWavFileInput(audioBuffer);
      
      // Create recognizer
      const recognizer = new sdk.SpeechRecognizer(this.speechConfig, audioConfig);
      
      console.log(`🎤 Azure Speech: Processing ${audioBuffer.length} bytes of ${audioFormat} audio`);

      return new Promise((resolve, reject) => {
        recognizer.recognizeOnceAsync(
          (result) => {
            if (result.reason === sdk.ResultReason.RecognizedSpeech) {
              resolve({
                transcript: result.text || '',
                confidence: result.properties?.getProperty(sdk.PropertyId.SpeechServiceResponse_JsonResult) ? 0.9 : 0.7,
                detectedLanguage: language
              });
            } else if (result.reason === sdk.ResultReason.NoMatch) {
              resolve({
                transcript: '',
                confidence: 0,
                detectedLanguage: language
              });
            } else {
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