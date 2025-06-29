import express from 'express';
import multer from 'multer';
import { GoogleCloudSpeechService } from '../services/googleSpeech.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const googleSpeech = new GoogleCloudSpeechService();

router.post('/transcribe', upload.single('audio'), async (req, res) => {
  try {
    console.log('📥 Received transcription request');
    const { language = 'fa-IR', audioFormat = 'webm' } = req.body;

    if (!req.file || !req.file.buffer || req.file.buffer.length === 0) {
      console.log('❌ No valid audio file received');
      return res.status(400).json({ error: 'No valid audio file received' });
    }

    const audioBuffer = req.file.buffer;

    const result = await googleSpeech.transcribeAudio(audioBuffer, language, audioFormat);
    return res.status(200).json(result);

  } catch (error) {
    console.error('❌ Transcription error:', error);
    return res.status(500).send(`Google Speech API error: ${error.message}`);
  }
});

export default router;
