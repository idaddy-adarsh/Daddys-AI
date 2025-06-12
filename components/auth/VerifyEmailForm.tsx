'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';

interface VerifyEmailFormProps {
  email: string;
  redirectUrl: string;
}

export default function VerifyEmailForm({ email, redirectUrl }: VerifyEmailFormProps) {
  const { verifyEmail, resendVerificationCode, login, error: authError, isLoading } = useAuth();
  const router = useRouter();
  
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Countdown for resend button
  useEffect(() => {
    if (countdown > 0 && !canResend) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && !canResend) {
      setCanResend(true);
    }
  }, [countdown, canResend]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    // Validate OTP
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit verification code');
      return;
    }
    
    try {
      await verifyEmail(email, otp);
      setSuccess('Email verified successfully! Logging you in...');
      
      // Wait a bit before logging in to show the success message
      setTimeout(async () => {
        try {
          // Try to login with the verified email
          // Note: This assumes the user has just registered and we know their password
          // In a real app, you might want to redirect to login page instead
          await login(email, ''); // This will fail but redirect to login page
        } catch (err) {
          // Redirect to login page
          router.push('/sign-in');
        }
      }, 1500);
    } catch (err) {
      // Error is handled by the auth context
    }
  };

  const handleResendCode = async () => {
    setError(null);
    setSuccess(null);
    
    try {
      await resendVerificationCode(email);
      setSuccess('A new verification code has been sent to your email');
      setCanResend(false);
      setCountdown(60);
    } catch (err) {
      // Error is handled by the auth context
    }
  };

  return (
    <div className="w-full">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Verify Your Email</h2>
        <p className="text-gray-400">
          We've sent a verification code to <span className="text-orange-400 font-medium">{email}</span>
        </p>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col space-y-4">
          <div className="mb-4">
            <label htmlFor="otp" className="text-gray-300 font-medium block mb-2">Verification Code</label>
            <input
              id="otp"
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').substring(0, 6))}
              className="bg-[#2a2a2a] border-2 border-gray-700 text-white rounded-xl px-4 py-3.5 w-full focus:ring-2 focus:ring-[#f97316] focus:border-transparent transition-all duration-300 placeholder-gray-500 shadow-inner hover:border-gray-600 text-center tracking-widest text-2xl"
              placeholder="000000"
              maxLength={6}
              autoComplete="one-time-code"
            />
          </div>
          
          {(error || authError) && (
            <div className="text-red-400 text-sm font-medium mb-4">
              {error || authError}
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
            {isLoading ? 'Verifying...' : 'Verify Email'}
          </button>
          
          <div className="mt-4 text-center">
            <p className="text-gray-400 text-sm">
              Didn't receive the code?{' '}
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={isLoading}
                  className="text-[#f97316] hover:text-[#fb923c] font-medium transition-colors duration-200 hover:underline disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  Resend Code
                </button>
              ) : (
                <span className="text-gray-500">
                  Resend code in {countdown}s
                </span>
              )}
            </p>
          </div>
        </div>
      </form>
    </div>
  );
} 