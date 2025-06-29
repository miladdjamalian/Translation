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

// Configure multer for audio uploads with better error handling
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    fieldSize: 10 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    console.log('📁 Multer processing file:', {
      fieldname: file.fieldname,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    }); // Debug log
    
    // Accept audio files
    if (file.mimetype.startsWith('audio/') || file.mimetype === 'application/octet-stream') {
      cb(null, true);
    } else {
      console.log('❌ Rejected file type:', file.mimetype); // Debug log
      cb(new Error('Only audio files are allowed'), false);
    }
  }
});

// Add error handling for multer
const uploadMiddleware = (req, res, next) => {
  upload.single('audio')(req, res, (err) => {
    if (err) {
      console.error('❌ Multer error:', err); // Debug log
      return res.status(400).json({ 
        error: 'File upload error', 
        details: err.message 
      });
    }
    next();
  });
};

// Routes
app.use('/api/speech', uploadMiddleware, speechRoutes);
app.use('/api/translation', translationRoutes);

// Health check with Google Cloud service information
app.get('/health', (req, res) => {
  const healthStatus = {
    status: 'OK', 
    timestamp: new Date().toISOString(),
    services: {
      googleCloud: !!process.env.GOOGLE_CLOUD_PROJECT_ID
    },
    environment: {
      nodeEnv: process.env.NODE_ENV,
      port: process.env.PORT,
      frontendUrl: process.env.FRONTEND_URL
    }
  };
  
  console.log('🏥 Health check requested:', healthStatus); // Debug log
  res.json(healthStatus);
});

// WebSocket for real-time audio streaming
wss.on('connection', (ws) => {
  console.log('🔌 New WebSocket connection established');
  
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      console.log('📨 WebSocket message received:', { type: data.type, sessionId: data.sessionId }); // Debug log
      
      if (data.type === 'audio-chunk') {
        // Handle real-time audio streaming for speech recognition
        const { audioData, language, sessionId } = data;
        
        console.log('🔊 Processing audio chunk for session:', sessionId, 'language:', language); // Debug log
        
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
      console.error('❌ WebSocket message error:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Failed to process audio'
      }));
    }
  });
  
  ws.on('close', () => {
    console.log('🔌 WebSocket connection closed');
  });
  
  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 WebSocket server ready for real-time audio`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL}`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Log Google Cloud service availability
  console.log('🔍 Service availability:');
  console.log(`  - Google Cloud: ${!!process.env.GOOGLE_CLOUD_PROJECT_ID ? '✅' : '❌'}`);
});
  // Root route for base URL
app.get('/', (req, res) => {
  res.send('🎧 Translation Backend is Live!');
});
});
