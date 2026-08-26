'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Mail, Lock, AlertCircle, CheckCircle } from 'lucide-react';

export default function RegisterPage() {
  const { signUp } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setVerificationSent(false);

    try {
      const { needsEmailVerification } = await signUp(email, password);
      
      if (needsEmailVerification) {
        setVerificationSent(true);
      } else {
        router.push('/knowledge-repo');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-sm">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-slate-900">Create Account</h2>
          <p className="mt-2 text-sm text-slate-600">
            Join us to start exploring the financial multiverse
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center space-x-2">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {verificationSent && (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg flex items-center space-x-2">
              <CheckCircle size={20} />
              <span>
                Verification email sent! Please check your inbox and follow the link to verify your account.
              </span>
            </div>
            <div className="text-sm text-slate-600">
              <p className="mb-2">If you don't see the email:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Check your spam/junk folder</li>
                <li>Make sure you entered the correct email address</li>
                <li>Wait a few minutes as it may take some time to arrive</li>
                <li>Try signing up again if you don't receive it within 5 minutes</li>
              </ul>
            </div>
            <button
              onClick={() => {
                setVerificationSent(false);
                setEmail('');
                setPassword('');
              }}
              className="w-full text-sm text-blue-600 hover:text-blue-500"
            >
              Try a different email
            </button>
          </div>
        )}

        {!verificationSent && (
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
              disabled={loading}
              className={`w-full flex justify-center py-2 px-4 rounded-lg text-white bg-blue-600 hover:bg-blue-700 ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-slate-600">
          Already have an account?{' '}
          <button
            onClick={() => router.push('/login')}
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
