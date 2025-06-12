'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/contexts/AuthContext';
import VerifyEmailForm from './VerifyEmailForm';

interface SignUpFormProps {
  redirectUrl: string;
}

export default function SignUpForm({ redirectUrl }: SignUpFormProps) {
  const { register, error: authError, isLoading } = useAuth();
  
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showVerification, setShowVerification] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validate inputs
    if (!email || !username || !password) {
      setError('All fields are required');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    
    try {
      const result = await register(username, email, password);
      if (result.requiresVerification) {
        setShowVerification(true);
      }
    } catch (err) {
      // Error is handled by the auth context
    }
  };

  const handleGoogleSignUp = () => {
    window.location.href = '/api/auth/social/google';
  };

  const handleMicrosoftSignUp = () => {
    window.location.href = '/api/auth/social/microsoft';
  };

  // Show verification form if registration was successful
  if (showVerification) {
    return <VerifyEmailForm email={email} redirectUrl={redirectUrl} />;
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col space-y-4">
          <button 
            type="button"
            onClick={handleGoogleSignUp}
            className="bg-[#2a2a2a] hover:bg-[#333333] border-2 border-gray-700 hover:border-gray-600 text-white rounded-xl py-3 transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center space-x-3 w-full mb-4"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign up with Google
          </button>
          
          <button 
            type="button"
            onClick={handleMicrosoftSignUp}
            className="bg-[#2a2a2a] hover:bg-[#333333] border-2 border-gray-700 hover:border-gray-600 text-white rounded-xl py-3 transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center space-x-3 w-full mb-6"
          >
            <svg className="w-5 h-5 mr-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 23 23">
              <path fill="#f25022" d="M1 1h10v10H1z"/>
              <path fill="#00a4ef" d="M1 12h10v10H1z"/>
              <path fill="#7fba00" d="M12 1h10v10H12z"/>
              <path fill="#ffb900" d="M12 12h10v10H12z"/>
            </svg>
            Sign up with Microsoft
          </button>
          
          <div className="relative flex items-center justify-center w-full mb-6">
            <div className="border-t border-gray-700 w-full"></div>
            <div className="text-gray-500 text-sm px-4 bg-[#1e1e1e]">OR</div>
            <div className="border-t border-gray-700 w-full"></div>
          </div>
          
          <div className="mb-4">
            <label htmlFor="email" className="text-gray-300 font-medium block mb-2">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-[#2a2a2a] border-2 border-gray-700 text-white rounded-xl px-4 py-3.5 w-full focus:ring-2 focus:ring-[#f97316] focus:border-transparent transition-all duration-300 placeholder-gray-500 shadow-inner hover:border-gray-600"
              placeholder="Enter your email"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="username" className="text-gray-300 font-medium block mb-2">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-[#2a2a2a] border-2 border-gray-700 text-white rounded-xl px-4 py-3.5 w-full focus:ring-2 focus:ring-[#f97316] focus:border-transparent transition-all duration-300 placeholder-gray-500 shadow-inner hover:border-gray-600"
              placeholder="Choose a username"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="password" className="text-gray-300 font-medium block mb-2">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-[#2a2a2a] border-2 border-gray-700 text-white rounded-xl px-4 py-3.5 w-full focus:ring-2 focus:ring-[#f97316] focus:border-transparent transition-all duration-300 placeholder-gray-500 shadow-inner hover:border-gray-600"
              placeholder="Create a password"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="confirmPassword" className="text-gray-300 font-medium block mb-2">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="bg-[#2a2a2a] border-2 border-gray-700 text-white rounded-xl px-4 py-3.5 w-full focus:ring-2 focus:ring-[#f97316] focus:border-transparent transition-all duration-300 placeholder-gray-500 shadow-inner hover:border-gray-600"
              placeholder="Confirm your password"
            />
          </div>
          
          {(error || authError) && (
            <div className="text-red-400 text-sm font-medium mb-4">
              {error || authError}
            </div>
          )}
          
          <button
            type="submit"
            disabled={isLoading}
            className="bg-gradient-to-r from-[#f97316] to-[#fb923c] hover:from-[#ea580c] hover:to-[#f97316] text-white font-semibold py-3.5 px-5 rounded-xl transition-all duration-300 w-full flex items-center justify-center space-x-2 relative shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Signing up...' : 'Continue'}
          </button>
          
          <div className="mt-6 text-center md:hidden">
            <p className="text-gray-400">
              Already have an account?{' '}
              <Link href="/sign-in" className="text-[#f97316] hover:text-[#fb923c] font-medium transition-colors duration-200 hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
