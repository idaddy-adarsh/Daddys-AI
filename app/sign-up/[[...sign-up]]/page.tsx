'use client';

import { useSearchParams } from 'next/navigation';
import { AuthLayout, SignUpForm } from '@/components/auth';

export default function SignUpPage() {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect_url') || '/dashboard';
  
  return (
    <AuthLayout
      title="Sign up"
      subtitle="Already have an account?"
      linkText="Sign in"
      linkHref="/sign-in"
    >
      <SignUpForm redirectUrl={redirectUrl} />
    </AuthLayout>
  );
}