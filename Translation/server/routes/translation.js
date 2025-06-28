import express from 'express';
import { GoogleTranslationService } from '../services/googleTranslation.js';
import { AzureTranslationService } from '../services/azureTranslation.js';

const router = express.Router();

// Initialize translation services
const googleTranslation = new GoogleTranslationService();
const azureTranslation = new AzureTranslationService();

// Translation endpoint
router.post('/translate', async (req, res) => {
  try {
    const { 
      text, 
      sourceLanguage = 'auto', 
      targetLanguage = 'en',
      provider = 'google',
      mode = 'balanced' // fast, balanced, accurate
    } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'No text provided for translation' });
    }

    console.log(`🔄 Translating "${text}" from ${sourceLanguage} to ${targetLanguage} using ${provider}`);

    let translation = '';
    let detectedLanguage = sourceLanguage;
    let confidence = 0;

    if (provider === 'google' && process.env.GOOGLE_CLOUD_PROJECT_ID) {
      const result = await googleTranslation.translateText(
        text,
        sourceLanguage,
        targetLanguage,
        mode
      );
      translation = result.translation;
      detectedLanguage = result.detectedLanguage;
      confidence = result.confidence;
    } else if (provider === 'azure' && process.env.AZURE_TRANSLATOR_KEY) {
      const result = await azureTranslation.translateText(
        text,
        sourceLanguage,
        targetLanguage,
        mode
      );
      translation = result.translation;
      detectedLanguage = result.detectedLanguage;
      confidence = result.confidence;
    } else {
      return res.status(400).json({ 
        error: `Provider ${provider} not configured or invalid` 
      });
    }

    console.log(`✅ Translation successful: "${translation}"`);

    res.json({
      translation,
      detectedLanguage,
      confidence,
      provider,
      mode,
      originalText: text,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Translation error:', error);
    res.status(500).json({ 
      error: 'Translation failed',
      details: error.message 
    });
  }
});

// Batch translation for continuous text
router.post('/translate-batch', async (req, res) => {
  try {
    const { 
      texts, 
      sourceLanguage = 'auto', 
      targetLanguage = 'en',
      provider = 'google'
    } = req.body;

    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      return res.status(400).json({ error: 'No texts provided for batch translation' });
    }

    console.log(`🔄 Batch translating ${texts.length} texts using ${provider}`);

    let results = [];

    if (provider === 'google') {
      results = await googleTranslation.translateBatch(texts, sourceLanguage, targetLanguage);
    } else if (provider === 'azure') {
      results = await azureTranslation.translateBatch(texts, sourceLanguage, targetLanguage);
    }

    res.json({
      results,
      provider,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Batch translation error:', error);
    res.status(500).json({ 
      error: 'Batch translation failed',
      details: error.message 
    });
  }
});

export default router;