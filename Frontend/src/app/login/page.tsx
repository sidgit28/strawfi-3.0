'use client';

import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, AlertCircle } from 'lucide-react';

function LoginForm() {
  const { signIn, user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Debug current state
  console.log('🔍 Login page state:', { 
    hasUser: !!user, 
    userEmail: user?.email,
    authLoading: loading, 
    formLoading, 
    redirectTo 
  });

  // Redirect if already logged in
  useEffect(() => {
    console.log('🔄 Login redirect check:', { 
      hasUser: !!user, 
      authLoading: loading, 
      formLoading,
      redirectTo 
    });
    
    if (user && !loading && !formLoading) {
      console.log('✅ User authenticated, redirecting to:', redirectTo);
      // Small delay to ensure auth state is fully settled
      setTimeout(() => {
        router.push(redirectTo);
      }, 100);
    }
  }, [user, loading, formLoading, redirectTo, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFormLoading(true);

    try {
      alert('HANDLE SUBMIT WORKS');
      console.log('Starting sign in process...');
      await signIn(email, password);
      console.log('Sign in completed, waiting for user state update...');
      // The redirect will be handled by the useEffect above
    } catch (err: any) {
      console.error('Sign in error:', err);
      setError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleSignUp = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push('/register');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-sm">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-slate-900">Welcome Back</h2>
          <p className="mt-2 text-sm text-slate-600">
            Sign in to access your financial multiverse
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center space-x-2">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Email address
            </label>
            <div className="mt-1 relative">
              <Mail className="absolute inset-y-0 left-3 h-5 w-5 text-slate-400 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Password
            </label>
            <div className="mt-1 relative">
              <Lock className="absolute inset-y-0 left-3 h-5 w-5 text-slate-400 pointer-events-none" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={formLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {formLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-600">
          Don't have an account?{' '}
          <button
            onClick={handleSignUp}
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
