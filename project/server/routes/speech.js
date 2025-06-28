import express from 'express';
import { GoogleCloudSpeechService } from '../services/googleSpeech.js';
import { AzureSpeechService } from '../services/azureSpeech.js';

const router = express.Router();

// Initialize speech services
const googleSpeech = new GoogleCloudSpeechService();
const azureSpeech = new AzureSpeechService();

// Speech-to-Text endpoint
router.post('/transcribe', async (req, res) => {
  try {
    const { provider = 'google', language = 'fa-IR', audioFormat = 'webm' } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    console.log(`🎤 Transcribing audio with ${provider} (${language})`);
    console.log(`📊 Audio size: ${req.file.size} bytes, format: ${audioFormat}`);

    let transcript = '';
    let confidence = 0;
    let detectedLanguage = language;

    if (provider === 'google' && process.env.GOOGLE_CLOUD_PROJECT_ID) {
      const result = await googleSpeech.transcribeAudio(
        req.file.buffer,
        language,
        audioFormat
      );
      transcript = result.transcript;
      confidence = result.confidence;
      detectedLanguage = result.detectedLanguage || language;
    } else if (provider === 'azure' && process.env.AZURE_SPEECH_KEY) {
      const result = await azureSpeech.transcribeAudio(
        req.file.buffer,
        language,
        audioFormat
      );
      transcript = result.transcript;
      confidence = result.confidence;
      detectedLanguage = result.detectedLanguage || language;
    } else {
      return res.status(400).json({ 
        error: `Provider ${provider} not configured or invalid` 
      });
    }

    console.log(`✅ Transcription successful: "${transcript}" (confidence: ${confidence})`);

    res.json({
      transcript,
      confidence,
      detectedLanguage,
      provider,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Speech transcription error:', error);
    res.status(500).json({ 
      error: 'Speech transcription failed',
      details: error.message 
    });
  }
});

// Real-time speech recognition endpoint
router.post('/stream-start', async (req, res) => {
  try {
    const { provider = 'google', language = 'fa-IR', sessionId } = req.body;
    
    console.log(`🔄 Starting streaming session ${sessionId} with ${provider}`);
    
    // Initialize streaming session
    let streamingSession;
    
    if (provider === 'google') {
      streamingSession = await googleSpeech.startStreamingRecognition(language, sessionId);
    } else if (provider === 'azure') {
      streamingSession = await azureSpeech.startStreamingRecognition(language, sessionId);
    }
    
    res.json({
      sessionId,
      status: 'started',
      provider,
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