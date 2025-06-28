import { SpeechClient } from '@google-cloud/speech';

export class GoogleCloudSpeechService {
  constructor() {
    if (process.env.GOOGLE_CLOUD_PROJECT_ID) {
      try {
        this.client = new SpeechClient({
          projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
          credentials: {
            client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
            private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY?.replace(/\\n/g, '\n')
          }
        });
        console.log('✅ Google Cloud Speech client initialized');
      } catch (error) {
        console.error('❌ Failed to initialize Google Cloud Speech client:', error);
        this.client = null;
      }
    } else {
      console.warn('⚠️ Google Cloud Speech not configured - missing GOOGLE_CLOUD_PROJECT_ID');
      this.client = null;
    }
  }

  async transcribeAudio(audioBuffer, language = 'fa-IR', audioFormat = 'webm') {
    if (!this.client) {
      throw new Error('Google Cloud Speech client not initialized');
    }

    try {
      console.log('🔄 Google Speech: Processing audio buffer of size:', audioBuffer.length); // Debug log
      
      // Convert audio format mapping
      const formatMapping = {
        'webm': 'WEBM_OPUS',
        'wav': 'LINEAR16',
        'mp3': 'MP3',
        'flac': 'FLAC'
      };

      const encoding = formatMapping[audioFormat] || 'WEBM_OPUS';
      console.log('🎵 Using encoding:', encoding, 'for format:', audioFormat); // Debug log

      const request = {
        audio: {
          content: audioBuffer.toString('base64')
        },
        config: {
          encoding: encoding,
          sampleRateHertz: 16000,
          languageCode: language,
          alternativeLanguageCodes: ['en-US', 'fa-IR', 'ar-SA'],
          enableAutomaticPunctuation: true,
          enableWordTimeOffsets: false,
          model: 'latest_long', // Best model for accuracy
          useEnhanced: true, // Use enhanced model if available
          profanityFilter: false,
          speechContexts: [{
            phrases: [
              // Persian common phrases
              'سلام', 'خداحافظ', 'متشکرم', 'ممنون', 'لطفاً', 'ببخشید',
              // Arabic common phrases  
              'السلام عليكم', 'شكرا', 'من فضلك', 'عفوا',
              // English common phrases
              'hello', 'goodbye', 'thank you', 'please', 'excuse me'
            ]
          }]
        }
      };

      console.log('📤 Sending request to Google Speech API with config:', {
        encoding: request.config.encoding,
        sampleRateHertz: request.config.sampleRateHertz,
        languageCode: request.config.languageCode,
        audioSize: audioBuffer.length
      }); // Debug log

      const [response] = await this.client.recognize(request);
      
      console.log('📥 Google Speech API response:', {
        resultsCount: response.results?.length || 0,
        results: response.results?.map(r => ({
          alternatives: r.alternatives?.length || 0,
          transcript: r.alternatives?.[0]?.transcript || '',
          confidence: r.alternatives?.[0]?.confidence || 0
        })) || []
      }); // Debug log
      
      if (!response.results || response.results.length === 0) {
        console.log('⚠️ No results from Google Speech API'); // Debug log
        return {
          transcript: '',
          confidence: 0,
          detectedLanguage: language
        };
      }

      const result = response.results[0];
      const alternative = result.alternatives[0];
      
      const finalResult = {
        transcript: alternative.transcript || '',
        confidence: alternative.confidence || 0,
        detectedLanguage: result.languageCode || language
      };
      
      console.log('✅ Google Speech final result:', finalResult); // Debug log
      
      return finalResult;

    } catch (error) {
      console.error('❌ Google Speech transcription error:', error);
      console.error('❌ Error details:', {
        message: error.message,
        code: error.code,
        details: error.details
      }); // Debug log
      throw new Error(`Google Speech API error: ${error.message}`);
    }
  }

  async startStreamingRecognition(language = 'fa-IR', sessionId) {
    if (!this.client) {
      throw new Error('Google Cloud Speech client not initialized');
    }

    try {
      const request = {
        config: {
          encoding: 'WEBM_OPUS',
          sampleRateHertz: 16000,
          languageCode: language,
          alternativeLanguageCodes: ['en-US', 'fa-IR', 'ar-SA'],
          enableAutomaticPunctuation: true,
          model: 'latest_long',
          useEnhanced: true
        },
        interimResults: true,
        singleUtterance: false
      };

      const recognizeStream = this.client
        .streamingRecognize(request)
        .on('error', (error) => {
          console.error(`❌ Google Streaming error for session ${sessionId}:`, error);
        })
        .on('data', (data) => {
          if (data.results[0] && data.results[0].alternatives[0]) {
            const transcript = data.results[0].alternatives[0].transcript;
            const isFinal = data.results[0].isFinal;
            const confidence = data.results[0].alternatives[0].confidence || 0;
            
            console.log(`📝 Google Stream ${sessionId}: "${transcript}" (final: ${isFinal})`);
            
            // Send to WebSocket clients
            // This will be handled by the WebSocket server
          }
        });

      return {
        sessionId,
        stream: recognizeStream,
        status: 'active'
      };

    } catch (error) {
      console.error('❌ Google streaming setup error:', error);
      throw new Error(`Google Streaming setup error: ${error.message}`);
    }
  }
}
