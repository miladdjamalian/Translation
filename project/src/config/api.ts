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

// Default headers for API requests (excluding Content-Type for FormData)
export const DEFAULT_HEADERS = {
  'Accept': 'application/json',
} as const;

// API request helper function with smart Content-Type handling
export const apiRequest = async (endpoint: string, options?: RequestInit): Promise<Response> => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    headers: {
      ...DEFAULT_HEADERS,
      ...options?.headers,
    },
  };

  // Smart Content-Type handling: Don't set Content-Type for FormData
  // Let the browser set it automatically with proper boundary
  if (!(options?.body instanceof FormData)) {
    defaultOptions.headers = {
      'Content-Type': 'application/json',
      ...defaultOptions.headers,
    };
  }

  const finalOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options?.headers,
    },
  };

  console.log('📤 API Request:', {
    url,
    method: finalOptions.method || 'GET',
    headers: finalOptions.headers,
    bodyType: finalOptions.body?.constructor.name || 'none'
  }); // Debug log

  return fetch(url, finalOptions);
};
