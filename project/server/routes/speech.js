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

    // بررسی وجود فایل
    if (!req.file) {
      console.log('❌ No file attached');
      return res.status(400).json({ error: 'No audio file provided' });
    }

    // بررسی وجود buffer
    if (!req.file.buffer || req.file.buffer.length === 0) {
      console.log('❌ Audio file is empty');
      return res.status(400).json({ error: 'Audio file is empty' });
    }

    const audioBuffer = req.file.buffer;

    console.log(`🎧 File received: ${req.file.originalname}, ${req.file.mimetype}, ${audioBuffer.length} bytes`);
    console.log(`🌐 Language: ${language}, Format: ${audioFormat}`);

    const result = await googleSpeech.transcribeAudio(audioBuffer,
