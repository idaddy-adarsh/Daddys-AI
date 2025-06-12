'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  username: string;
  email: string;
  isVerified: boolean;
  socialLogins?: {
    google?: {
      id: string;
      email: string;
      name: string;
      picture: string;
    };
    microsoft?: {
      id: string;
      email: string;
      name: string;
      picture: string | null;
    };
  };
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (identifier: string, password: string, redirectUrl?: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<{ requiresVerification: boolean; email: string }>;
  verifyEmail: (email: string, otp: string) => Promise<void>;
  resendVerificationCode: (email: string) => Promise<void>;
  completeProfile: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          // Handle authentication errors
          console.error('Authentication check failed:', response.status);
          setUser(null);
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
        setUser(null);
      } finally {
        // Always set loading to false regardless of outcome
        setIsLoading(false);
      }
    };

    // Add a timeout to ensure loading state doesn't get stuck
    const timeoutId = setTimeout(() => {
      setIsLoading(false);
    }, 5000);

    checkAuth();

    return () => clearTimeout(timeoutId);
  }, []);

  const login = async (identifier: string, password: string, redirectUrl?: string) => {
    try {
      setError(null);
      setIsLoading(true);
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Special case for unverified email
        if (response.status === 403 && data.requiresVerification) {
          throw new Error('Email not verified. Please check your email for a verification code.');
        }
        throw new Error(data.error || 'Failed to login');
      }

      setUser(data);
      
      // Ensure we have the user data before redirecting
      setTimeout(() => {
        // Use the provided redirectUrl or default to dashboard
        router.push(redirectUrl || '/dashboard');
      }, 100);
    } catch (error) {
      console.error('Login error:', error);
      setError(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      setError(null);
      setIsLoading(true);
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to register');
      }

      // Return verification status instead of auto-login
      return { requiresVerification: true, email };
    } catch (error) {
      console.error('Registration error:', error);
      setError(error instanceof Error ? error.message : 'Registration failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyEmail = async (email: string, otp: string) => {
    try {
      setError(null);
      setIsLoading(true);
      
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify email');
      }

      return data;
    } catch (error) {
      console.error('Verification error:', error);
      setError(error instanceof Error ? error.message : 'Verification failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const resendVerificationCode = async (email: string) => {
    try {
      setError(null);
      setIsLoading(true);
      
      const response = await fetch('/api/auth/verify', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend verification code');
      }

      return data;
    } catch (error) {
      console.error('Resend verification error:', error);
      setError(error instanceof Error ? error.message : 'Failed to resend verification code');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const completeProfile = async (username: string, password: string) => {
    try {
      setError(null);
      setIsLoading(true);
      
      const response = await fetch('/api/auth/complete-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      // Update user state with new username
      if (user) {
        setUser({
          ...user,
          username: data.username
        });
      }

      return data;
    } catch (error) {
      console.error('Complete profile error:', error);
      setError(error instanceof Error ? error.message : 'Failed to update profile');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to logout');
      }

      setUser(null);
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        verifyEmail,
        resendVerificationCode,
        completeProfile,
        logout,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}