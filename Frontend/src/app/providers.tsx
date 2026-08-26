'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { validateConfig } from '@/lib/config';
import { useEffect, useState } from 'react';

// Error Boundary Component
function ErrorFallback({ error, resetError }: { error: Error; resetError: () => void }) {
  return (
    <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
        <div className="flex items-center mb-4">
          <div className="bg-red-100 p-2 rounded-full mr-3">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Configuration Error</h2>
        </div>
        <p className="text-gray-600 mb-4">{error.message}</p>
        <div className="flex gap-2">
          <button
            onClick={resetError}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    </div>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [configError, setConfigError] = useState<Error | null>(null);
  const [isConfigValid, setIsConfigValid] = useState(false);

  useEffect(() => {
    try {
      // Debug: Check what environment variables are loaded
      console.log('🔍 Environment Debug:', {
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING',
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
        NODE_ENV: process.env.NODE_ENV,
      });
      
      validateConfig();
      setIsConfigValid(true);
      console.log('✅ Configuration validation passed');
    } catch (error) {
      console.error('❌ Configuration validation failed:', error);
      setConfigError(error as Error);
    }
  }, []);

  if (configError) {
    return <ErrorFallback error={configError} resetError={() => setConfigError(null)} />;
  }

  if (!isConfigValid) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Validating configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}