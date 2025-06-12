'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { AuthLayout } from '@/components/auth';

// Loading component for Suspense fallback
function CompleteProfileLoading() {
  return (
    <AuthLayout
      title="Complete Your Profile"
      subtitle=""
      linkText=""
      linkHref=""
    >
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    </AuthLayout>
  );
}

// Main component that uses useSearchParams
function CompleteProfileContent() {
  const { user, isLoading: authLoading, completeProfile } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isNewUser = searchParams.get('isNewUser') === 'true';
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Determine login provider
  const loginProvider = user?.socialLogins?.google ? 'Google' : 
                       user?.socialLogins?.microsoft ? 'Microsoft' : 'Email';

  // Pre-fill username if available
  useEffect(() => {
    if (user?.username) {
      setUsername(user.username);
    }
  }, [user]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/sign-in');
    }
  }, [authLoading, user, router]);

  // Check for stored redirect URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedRedirect = localStorage.getItem('auth_redirect');
      if (storedRedirect) {
        // Clear the stored redirect URL to prevent future redirects
        localStorage.removeItem('auth_redirect');
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    // Validate inputs
    if (!username) {
      setError('Username is required');
      return;
    }
    
    if (!password) {
      setError('Password is required');
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
      setIsLoading(true);
      
      await completeProfile(username, password);
      
      setSuccess('Profile updated successfully! Redirecting to dashboard...');
      
      // Redirect after a short delay
      setTimeout(() => {
        // Check if there's a stored redirect URL
        if (typeof window !== 'undefined') {
          const storedRedirect = localStorage.getItem('auth_redirect');
          if (storedRedirect) {
            localStorage.removeItem('auth_redirect');
            router.push(storedRedirect);
            return;
          }
        }
        // Default redirect to dashboard
        router.push('/dashboard');
      }, 1500);
    } catch (err) {
      console.error('Profile update error:', err);
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <AuthLayout
        title="Complete Your Profile"
        subtitle=""
        linkText=""
        linkHref=""
      >
        <div className="flex justify-center items-center min-h-[300px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title={isNewUser ? "Complete Your Profile" : "Add Password"}
      subtitle=""
      linkText=""
      linkHref=""
    >
      <div className="w-full">
        <div className="text-center mb-6">
          <p className="text-gray-400">
            {isNewUser 
              ? `Welcome! You've signed in with ${loginProvider}. Please set your username and create a password to complete your profile.` 
              : `Add a password to enable multiple login methods with your ${loginProvider} account.`}
          </p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col space-y-4">
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
              <p className="text-gray-500 text-xs mt-1">
                This username will be used to identify you across the platform.
              </p>
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
              <p className="text-gray-500 text-xs mt-1">
                Setting a password allows you to log in with your email/username in addition to {loginProvider}.
              </p>
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
            
            {error && (
              <div className="text-red-400 text-sm font-medium mb-4">
                {error}
              </div>
            )}
            
            {success && (
              <div className="text-green-400 text-sm font-medium mb-4">
                {success}
              </div>
            )}
            
            <button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-[#f97316] to-[#fb923c] hover:from-[#ea580c] hover:to-[#f97316] text-white font-semibold py-3.5 px-5 rounded-xl transition-all duration-300 w-full flex items-center justify-center space-x-2 relative shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Updating...' : 'Complete Profile'}
            </button>
            
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="text-gray-400 hover:text-gray-300 text-sm transition-colors duration-200 hover:underline"
              >
                Skip for now
              </button>
            </div>
          </div>
        </form>
      </div>
    </AuthLayout>
  );
}

// Main page component with Suspense
export default function CompleteProfilePage() {
  return (
    <Suspense fallback={<CompleteProfileLoading />}>
      <CompleteProfileContent />
    </Suspense>
  );
} 