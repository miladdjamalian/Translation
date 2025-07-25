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
      console.log('🔄 Google Speech: Processing audio buffer of size:', audioBuffer.length);

      const formatMapping = {
        'webm': 'WEBM_OPUS',
        'wav': 'LINEAR16',
        'mp3': 'MP3',
        'flac': 'FLAC'
      };

      const encoding = formatMapping[audioFormat] || 'WEBM_OPUS';
      const isPersian = language === 'fa-IR' || language === 'fa';

      const request = {
        audio: {
          content: audioBuffer.toString('base64')
        },
        config: {
          encoding,
          sampleRateHertz: 48000,
          languageCode: isPersian ? 'fa-IR' : language,
          alternativeLanguageCodes: isPersian ? ['en-US'] : ['en-US', 'fa-IR'],
          enableAutomaticPunctuation: true,
          enableWordTimeOffsets: false,
          model: isPersian ? 'default' : 'latest_long',
          useEnhanced: !isPersian,
          profanityFilter: false,
          speechContexts: [{
            phrases: isPersian ? [
              'سلام', 'خداحافظ', 'متشکرم', 'ممنون', 'لطفاً', 'ببخشید'
            ] : [
              'hello', 'goodbye', 'thank you', 'please', 'excuse me'
            ]
          }]
        }
      };

      console.log('📤 Sending request to Google Speech API with config:', {
        encoding: request.config.encoding,
        languageCode: request.config.languageCode,
        model: request.config.model,
        useEnhanced: request.config.useEnhanced,
        audioSize: audioBuffer.length
      });

      const [response] = await this.client.recognize(request);

      console.log('📥 Google Speech API response:', {
        resultsCount: response.results?.length || 0,
        results: response.results?.map(r => ({
          alternatives: r.alternatives?.length || 0,
          transcript: r.alternatives?.[0]?.transcript || '',
          confidence: r.alternatives?.[0]?.confidence || 0
        })) || []
      });

      if (!response.results || response.results.length === 0) {
        console.log('⚠️ No results from Google Speech API');
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

      console.log('✅ Google Speech final result:', finalResult);
      return finalResult;

    } catch (error) {
      console.error('❌ Google Speech transcription error:', error);
      console.error('❌ Error details:', {
        message: error.message,
        code: error.code,
        details: error.details
      });

      if (error.message.includes('not supported for language') && language.includes('fa')) {
        throw new Error('Google Speech API does not fully support Persian language with advanced models. Please use Azure Speech for Persian.');
      }

      throw new Error(`Google Speech API error: ${error.message}`);
    }
  }

  async startStreamingRecognition(language = 'fa-IR', sessionId) {
    if (!this.client) {
      throw new Error('Google Cloud Speech client not initialized');
    }

    try {
      const isPersian = language === 'fa-IR' || language === 'fa';

      const request = {
        config: {
          encoding: 'WEBM_OPUS',
          sampleRateHertz: 48000,
          languageCode: isPersian ? 'fa-IR' : language,
          alternativeLanguageCodes: isPersian ? ['en-US'] : ['en-US', 'fa-IR'],
          enableAutomaticPunctuation: true,
          model: isPersian ? 'default' : 'latest_long',
          useEnhanced: !isPersian
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
