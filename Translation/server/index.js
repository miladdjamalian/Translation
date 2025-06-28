import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import speechRoutes from './routes/speech.js';
import translationRoutes from './routes/translation.js';

dotenv.config();

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// === Middleware ===
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// === Multer (برای فایل صوتی) ===
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// === Routes ===
app.get('/', (req, res) => {
  res.send('🎧 Translation Backend is Live!');
});
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    services: {
      googleCloud: !!process.env.GOOGLE_CLOUD_PROJECT_ID,
      azureSpeech: !!process.env.AZURE_SPEECH_KEY,
      azureTranslator: !!process.env.AZURE_TRANSLATOR_KEY
    }
  });
});
app.use('/api/speech', upload.single('audio'), speechRoutes);
app.use('/api/translation', translationRoutes);

// === WebSocket ===
wss.on('connection', (ws) => {
  console.log('🔌 WebSocket connection opened');

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);

      if (data.type === 'audio-chunk') {
        const { audioData, language, sessionId } = data;

        // پاسخ فرضی (بعداً با AI جایگزین می‌کنی)
        ws.send(JSON.stringify({
          type: 'transcript',
          sessionId,
          text: 'Processing...',
          isFinal: false
        }));
      }
    } catch (err) {
      console.error('WebSocket error:', err);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format or processing error'
      }));
    }
  });

  ws.on('close', () => {
    console.log('🔌 WebSocket connection closed');
  });
});

// === Start Server ===
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 WebSocket ready`);
  console.log(`🌐 Frontend: ${process.env.FRONTEND_URL}`);
});
