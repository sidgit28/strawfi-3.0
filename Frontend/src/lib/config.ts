// Environment Configuration
export const config = {
  // API Configuration
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 
             (process.env.NODE_ENV === 'production' 
               ? 'https://api.strawfi.com'  // Updated to correct backend URL
               : 'http://localhost:3001'),  // Local backend for development
    timeout: 30000, // 30 seconds
  },

  // Authentication Configuration
  auth: {
    jwtExpirationBuffer: 300, // 5 minutes in seconds
    sessionRefreshInterval: 3600000, // 1 hour in milliseconds
  },

  // WebSocket Configuration
  websocket: {
    url: process.env.NEXT_PUBLIC_WS_URL || 
         (process.env.NODE_ENV === 'production' 
           ? 'wss://api.strawfi.com'  // Updated to correct WebSocket URL
           : 'ws://localhost:3001'),  // Local WebSocket for development
  },

  // Feature Flags
  features: {
    enableDebugLogs: process.env.NODE_ENV !== 'production',
    enableAnalytics: process.env.NODE_ENV === 'production',
  },

  // External APIs
  external: {
    openRouterApiKey: process.env.OPENROUTER_API_KEY,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },

  // URLs for reference
  frontend: {
    baseUrl: process.env.NODE_ENV === 'production' 
      ? 'https://strawfi.com'
      : 'http://localhost:3000',
  },
};

export function validateConfig() {
  return; 
  
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing.join(', '));
    console.error('📍 Make sure .env.local is in Frontend/ directory and contains:');
    console.error('NEXT_PUBLIC_SUPABASE_URL=your_url');
    console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key');
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  if (config.features.enableDebugLogs) {
    console.log('✅ Environment configuration loaded:', {
      nodeEnv: process.env.NODE_ENV,
      apiBaseUrl: config.api.baseUrl,
      wsUrl: config.websocket.url,
      hasOpenRouterKey: !!config.external.openRouterApiKey,
    });
  }
}

// Export common URLs for backward compatibility
export const API_BASE_URL = config.api.baseUrl;
export const WS_URL = config.websocket.url; 