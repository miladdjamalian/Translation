import { Translate } from '@google-cloud/translate/build/src/v2/index.js';

export class GoogleTranslationService {
  constructor() {
    if (process.env.GOOGLE_CLOUD_PROJECT_ID) {
      this.translate = new Translate({
        projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
        credentials: {
          client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
          private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY?.replace(/\\n/g, '\n')
        }
      });
      console.log('✅ Google Cloud Translation client initialized');
    } else {
      console.warn('⚠️ Google Cloud Translation not configured');
    }
  }

  async translateText(text, sourceLanguage = 'auto', targetLanguage = 'en', mode = 'balanced') {
    if (!this.translate) {
      throw new Error('Google Cloud Translation client not initialized');
    }

    try {
      console.log(`🔄 Google Translate: "${text}" (${sourceLanguage} → ${targetLanguage})`);

      const options = {
        from: sourceLanguage === 'auto' ? undefined : sourceLanguage,
        to: targetLanguage,
        format: 'text'
      };

      // Adjust model based on mode
      if (mode === 'accurate') {
        options.model = 'nmt'; // Neural Machine Translation for best quality
      } else if (mode === 'fast') {
        options.model = 'base'; // Faster but less accurate
      }

      const [translation, metadata] = await this.translate.translate(text, options);
      
      // Detect source language if auto
      let detectedLanguage = sourceLanguage;
      if (sourceLanguage === 'auto' && metadata && metadata.data && metadata.data.translations) {
        detectedLanguage = metadata.data.translations[0]?.detectedSourceLanguage || sourceLanguage;
      }

      return {
        translation: Array.isArray(translation) ? translation[0] : translation,
        detectedLanguage,
        confidence: 0.9, // Google Translate typically has high confidence
        provider: 'google'
      };

    } catch (error) {
      console.error('❌ Google Translation error:', error);
      throw new Error(`Google Translation API error: ${error.message}`);
    }
  }

  async translateBatch(texts, sourceLanguage = 'auto', targetLanguage = 'en') {
    if (!this.translate) {
      throw new Error('Google Cloud Translation client not initialized');
    }

    try {
      console.log(`🔄 Google Batch Translate: ${texts.length} texts (${sourceLanguage} → ${targetLanguage})`);

      const options = {
        from: sourceLanguage === 'auto' ? undefined : sourceLanguage,
        to: targetLanguage,
        format: 'text'
      };

      const [translations] = await this.translate.translate(texts, options);
      
      return texts.map((originalText, index) => ({
        originalText,
        translation: translations[index],
        detectedLanguage: sourceLanguage,
        confidence: 0.9
      }));

    } catch (error) {
      console.error('❌ Google Batch Translation error:', error);
      throw new Error(`Google Batch Translation API error: ${error.message}`);
    }
  }

  async detectLanguage(text) {
    if (!this.translate) {
      throw new Error('Google Cloud Translation client not initialized');
    }

    try {
      const [detection] = await this.translate.detect(text);
      return {
        language: detection.language,
        confidence: detection.confidence
      };
    } catch (error) {
      console.error('❌ Google Language Detection error:', error);
      throw new Error(`Google Language Detection error: ${error.message}`);
    }
  }
}