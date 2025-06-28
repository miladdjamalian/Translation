// API Configuration
// این فایل تنظیمات API را مدیریت می‌کند

// Backend URL - در production از environment variable استفاده می‌شود
export const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 
  (import.meta.env.DEV ? 'http://localhost:3001' : 'https://your-backend-url.onrender.com');

// API Endpoints
export const API_ENDPOINTS = {
  HEALTH: `${API_BASE_URL}/health`,
  SPEECH_TRANSCRIBE: `${API_BASE_URL}/api/speech/transcribe`,
  SPEECH_STREAM_START: `${API_BASE_URL}/api/speech/stream-start`,
  TRANSLATION_TRANSLATE: `${API_BASE_URL}/api/translation/translate`,
  TRANSLATION_BATCH: `${API_BASE_URL}/api/translation/translate-batch`,
} as const;

// WebSocket URL
export const WS_URL = API_BASE_URL.replace(/^https?/, 'ws');

// Request timeout configurations
export const TIMEOUTS = {
  HEALTH_CHECK: 5000,
  SPEECH_RECOGNITION: 10000,
  TRANSLATION: 8000,
  WEBSOCKET_RECONNECT: 3000,
} as const;

// Retry configurations
export const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  BACKOFF_MULTIPLIER: 2,
} as const;

// Default headers for API requests
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
} as const;

// Helper function to create API URLs
export const createApiUrl = (endpoint: string, params?: Record<string, string>) => {
  const url = new URL(endpoint);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }
  return url.toString();
};

// Helper function for API requests with retry logic
export const apiRequest = async (
  url: string,
  options: RequestInit = {},
  retries = RETRY_CONFIG.MAX_RETRIES
): Promise<Response> => {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...DEFAULT_HEADERS,
        ...options.headers,
      },
    });

    if (!response.ok && retries > 0) {
      await new Promise(resolve => 
        setTimeout(resolve, RETRY_CONFIG.RETRY_DELAY * (RETRY_CONFIG.MAX_RETRIES - retries + 1))
      );
      return apiRequest(url, options, retries - 1);
    }

    return response;
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => 
        setTimeout(resolve, RETRY_CONFIG.RETRY_DELAY * (RETRY_CONFIG.MAX_RETRIES - retries + 1))
      );
      return apiRequest(url, options, retries - 1);
    }
    throw error;
  }
};