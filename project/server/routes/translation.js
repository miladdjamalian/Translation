import express from 'express';
import { GoogleTranslationService } from '../services/googleTranslation.js';

const router = express.Router();

// Initialize Google translation service
const googleTranslation = new GoogleTranslationService();

// Translation endpoint
router.post('/translate', async (req, res) => {
  try {
    const { 
      text, 
      sourceLanguage = 'auto', 
      targetLanguage = 'en',
      mode = 'balanced' // fast, balanced, accurate
    } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'No text provided for translation' });
    }

    console.log(`🔄 Translating "${text}" from ${sourceLanguage} to ${targetLanguage} using Google`);

    if (!process.env.GOOGLE_CLOUD_PROJECT_ID) {
      return res.status(400).json({ 
        error: 'Google Cloud Translation not configured',
        details: 'Missing GOOGLE_CLOUD_PROJECT_ID environment variable'
      });
    }

    const result = await googleTranslation.translateText(
      text,
      sourceLanguage,
      targetLanguage,
      mode
    );

    console.log(`✅ Google Translation successful: "${result.translation}"`);

    res.json({
      translation: result.translation,
      detectedLanguage: result.detectedLanguage,
      confidence: result.confidence,
      provider: 'google',
      mode,
      originalText: text,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Google Translation error:', error);
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
      targetLanguage = 'en'
    } = req.body;

    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      return res.status(400).json({ error: 'No texts provided for batch translation' });
    }

    console.log(`🔄 Batch translating ${texts.length} texts using Google`);

    if (!process.env.GOOGLE_CLOUD_PROJECT_ID) {
      return res.status(400).json({ 
        error: 'Google Cloud Translation not configured'
      });
    }

    const results = await googleTranslation.translateBatch(texts, sourceLanguage, targetLanguage);

    res.json({
      results,
      provider: 'google',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Google Batch translation error:', error);
    res.status(500).json({ 
      error: 'Batch translation failed',
      details: error.message 
    });
  }
});

export default router;