import axios from 'axios';

export class AzureTranslationService {
  constructor() {
    if (process.env.AZURE_TRANSLATOR_KEY && process.env.AZURE_TRANSLATOR_REGION) {
      this.apiKey = process.env.AZURE_TRANSLATOR_KEY;
      this.region = process.env.AZURE_TRANSLATOR_REGION;
      this.endpoint = 'https://api.cognitive.microsofttranslator.com';
      console.log('✅ Azure Translation client initialized');
    } else {
      console.warn('⚠️ Azure Translation not configured');
    }
  }

  async translateText(text, sourceLanguage = 'auto', targetLanguage = 'en', mode = 'balanced') {
    if (!this.apiKey) {
      throw new Error('Azure Translation client not initialized');
    }

    try {
      console.log(`🔄 Azure Translate: "${text}" (${sourceLanguage} → ${targetLanguage})`);

      const url = `${this.endpoint}/translate?api-version=3.0&to=${targetLanguage}`;
      
      // Add source language if not auto-detect
      const finalUrl = sourceLanguage !== 'auto' ? `${url}&from=${sourceLanguage}` : url;

      const headers = {
        'Ocp-Apim-Subscription-Key': this.apiKey,
        'Ocp-Apim-Subscription-Region': this.region,
        'Content-Type': 'application/json'
      };

      const body = [{ text }];

      const response = await axios.post(finalUrl, body, { headers });
      
      if (response.data && response.data[0] && response.data[0].translations) {
        const result = response.data[0];
        const translation = result.translations[0];
        
        return {
          translation: translation.text,
          detectedLanguage: result.detectedLanguage?.language || sourceLanguage,
          confidence: result.detectedLanguage?.score || 0.9,
          provider: 'azure'
        };
      } else {
        throw new Error('Invalid response from Azure Translator');
      }

    } catch (error) {
      console.error('❌ Azure Translation error:', error);
      throw new Error(`Azure Translation API error: ${error.message}`);
    }
  }

  async translateBatch(texts, sourceLanguage = 'auto', targetLanguage = 'en') {
    if (!this.apiKey) {
      throw new Error('Azure Translation client not initialized');
    }

    try {
      console.log(`🔄 Azure Batch Translate: ${texts.length} texts (${sourceLanguage} → ${targetLanguage})`);

      const url = `${this.endpoint}/translate?api-version=3.0&to=${targetLanguage}`;
      const finalUrl = sourceLanguage !== 'auto' ? `${url}&from=${sourceLanguage}` : url;

      const headers = {
        'Ocp-Apim-Subscription-Key': this.apiKey,
        'Ocp-Apim-Subscription-Region': this.region,
        'Content-Type': 'application/json'
      };

      const body = texts.map(text => ({ text }));

      const response = await axios.post(finalUrl, body, { headers });
      
      if (response.data && Array.isArray(response.data)) {
        return response.data.map((result, index) => ({
          originalText: texts[index],
          translation: result.translations[0].text,
          detectedLanguage: result.detectedLanguage?.language || sourceLanguage,
          confidence: result.detectedLanguage?.score || 0.9
        }));
      } else {
        throw new Error('Invalid response from Azure Translator');
      }

    } catch (error) {
      console.error('❌ Azure Batch Translation error:', error);
      throw new Error(`Azure Batch Translation API error: ${error.message}`);
    }
  }

  async detectLanguage(text) {
    if (!this.apiKey) {
      throw new Error('Azure Translation client not initialized');
    }

    try {
      const url = `${this.endpoint}/detect?api-version=3.0`;
      
      const headers = {
        'Ocp-Apim-Subscription-Key': this.apiKey,
        'Ocp-Apim-Subscription-Region': this.region,
        'Content-Type': 'application/json'
      };

      const body = [{ text }];

      const response = await axios.post(url, body, { headers });
      
      if (response.data && response.data[0]) {
        const result = response.data[0];
        return {
          language: result.language,
          confidence: result.score
        };
      } else {
        throw new Error('Invalid response from Azure Language Detection');
      }

    } catch (error) {
      console.error('❌ Azure Language Detection error:', error);
      throw new Error(`Azure Language Detection error: ${error.message}`);
    }
  }
}