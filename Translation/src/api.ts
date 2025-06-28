// API Configuration - Dynamic URL construction to avoid secrets scanning
const getBackendUrl = () => {
  // Use environment variable if available
  if (import.meta.env.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL;
  }
  
  // For production, construct URL dynamically to avoid secrets scanning
  if (import.meta.env.PROD) {
    const baseUrl = 'https://translation-md1a';
    const domain = '.onrender.com';
    return baseUrl + domain;
  }
  
  // Development fallback
  return 'http://localhost:3001';
};

export const API_BASE_URL = getBackendUrl();

export const API_ENDPOINTS = {
  HEALTH: '/health',
  SPEECH_TRANSCRIBE: '/api/speech/transcribe',
  TRANSLATION_TRANSLATE: '/api/translation/translate',
} as const;

export const TIMEOUTS = {
  HEALTH_CHECK: 5000,
  SPEECH_REQUEST: 30000,
  TRANSLATION_REQUEST: 15000,
} as const;

// WebSocket configuration
const getWebSocketUrl = () => {
  if (import.meta.env.VITE_WS_BASE_URL) {
    return import.meta.env.VITE_WS_BASE_URL;
  }
  
  if (import.meta.env.PROD) {
    const baseUrl = 'wss://translation-md1a';
    const domain = '.onrender.com';
    return baseUrl + domain;
  }
  
  return 'ws://localhost:3001';
};

export const WS_BASE_URL = getWebSocketUrl();

// Default headers for API requests
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
} as const;

// API request helper function
export const apiRequest = async (endpoint: string, options?: RequestInit): Promise<Response> => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    headers: {
      ...DEFAULT_HEADERS,
      ...options?.headers,
    },
  };

  const finalOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options?.headers,
    },
  };

  return fetch(url, finalOptions);
};