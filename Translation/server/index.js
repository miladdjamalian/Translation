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

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Configure multer for audio uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Routes
app.use('/api/speech', upload.single('audio'), speechRoutes);
app.use('/api/translation', translationRoutes);

// Health check
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

// WebSocket for real-time audio streaming
wss.on('connection', (ws) => {
  console.log('🔌 New WebSocket connection established');
  
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      
      if (data.type === 'audio-chunk') {
        // Handle real-time audio streaming for speech recognition
        // This will be implemented in the speech service
        const { audioData, language, sessionId } = data;
        
        // Process audio chunk and send back transcript
        // Implementation will be added in speech service
        ws.send(JSON.stringify({
          type: 'transcript',
          sessionId,
          text: 'Processing...',
          isFinal: false
        }));
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Failed to process audio'
      }));
    }
  });
  
  ws.on('close', () => {
    console.log('🔌 WebSocket connection closed');
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 WebSocket server ready for real-time audio`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL}`);
});