'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AuthLayout, VerifyEmailForm } from '@/components/auth';

// Create a separate component that uses useSearchParams
function VerifyContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const redirectUrl = searchParams.get('redirect_url') || '/dashboard';
  
  if (!email) {
    return (
      <AuthLayout
        title="Email Verification"
        subtitle="Something went wrong"
        linkText="Go to Sign Up"
        linkHref="/sign-up"
      >
        <div className="text-center p-6">
          <p className="text-red-400 mb-4">
            No email address provided. Please try signing up again.
          </p>
        </div>
      </AuthLayout>
    );
  }
  
  return (
    <AuthLayout
      title="Email Verification"
      subtitle="Already verified?"
      linkText="Sign in"
      linkHref="/sign-in"
    >
      <VerifyEmailForm email={email} redirectUrl={redirectUrl} />
    </AuthLayout>
  );
}

// Loading component for Suspense fallback
function VerifyLoading() {
  return (
    <AuthLayout
      title="Email Verification"
      subtitle="Loading..."
      linkText="Sign in"
      linkHref="/sign-in"
    >
      <div className="flex justify-center items-center p-6">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    </AuthLayout>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<VerifyLoading />}>
      <VerifyContent />
    </Suspense>
  );
} 