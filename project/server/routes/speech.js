import express from 'express';
import { GoogleCloudSpeechService } from '../services/googleSpeech.js';

const router = express.Router();

// Initialize Google speech service
const googleSpeech = new GoogleCloudSpeechService();

// Speech-to-Text endpoint
router.post('/transcribe', async (req, res) => {
  try {
    console.log('📥 Received /api/speech/transcribe request'); // Debug log
    console.log('📋 Request body keys:', Object.keys(req.body)); // Debug log
    console.log('📁 Request file info:', req.file ? {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    } : 'No file'); // Debug log
    
    const { language = 'fa-IR', audioFormat = 'webm' } = req.body;
    
    if (!req.file) {
      console.log('❌ No audio file provided in request'); // Debug log
      return res.status(400).json({ error: 'No audio file provided' });
    }

    console.log(`🎤 Transcribing audio with Google Cloud Speech (${language})`);
    console.log(`📊 Audio size: ${req.file.size} bytes, format: ${audioFormat}, mimetype: ${req.file.mimetype}`);

    if (!process.env.GOOGLE_CLOUD_PROJECT_ID) {
      console.log('❌ Google Cloud not configured'); // Debug log
      return res.status(400).json({ 
        error: 'Google Cloud Speech not configured',
        details: 'Missing GOOGLE_CLOUD_PROJECT_ID environment variable'
      });
    }

    console.log('🔄 Using Google Cloud Speech service'); // Debug log
    const result = await googleSpeech.transcribeAudio(
      req.file.buffer,
      language,
      audioFormat
    );

    console.log(`📤 Backend sending transcription result: "${result.transcript}" (confidence: ${result.confidence})`); // Debug log

    res.json({
      transcript: result.transcript,
      confidence: result.confidence,
      detectedLanguage: result.detectedLanguage || language,
      provider: 'google',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Speech transcription error:', error);
    res.status(500).json({ 
      error: 'Speech transcription failed',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Real-time speech recognition endpoint
router.post('/stream-start', async (req, res) => {
  try {
    const { language = 'fa-IR', sessionId } = req.body;
    
    console.log(`🔄 Starting Google streaming session ${sessionId}`);
    
    // Initialize streaming session
    const streamingSession = await googleSpeech.startStreamingRecognition(language, sessionId);
    
    res.json({
      sessionId,
      status: 'started',
      provider: 'google',
      language
    });
    
  } catch (error) {
    console.error('❌ Streaming start error:', error);
    res.status(500).json({ 
      error: 'Failed to start streaming session',
      details: error.message 
    });
  }
});

export default router;