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

    if (!req.file) {
      console.log('❌ No file attached');
      return res.status(400).json({ error: 'No audio file provided' });
    }

    if (!req.file.buffer || req.file.buffer.length === 0) {
      console.log('❌ Audio file is empty');
      return res.status(400).json({ error: 'Audio file is empty' });
    }

    const audioBuffer = req.file.buffer;

    console.log(`🎧 File received: ${req.file.originalname}, ${req.file.mimetype}, ${audioBuffer.length} bytes`);
    console.log(`🌐 Language: ${language}, Format: ${audioFormat}`);

    const result = await googleSpeech.transcribeAudio(audioBuffer, language, audioFormat);
    return res.status(200).json(result);

  } catch (error) {
    console.error('❌ Transcription error:', error.message);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

export default router;
