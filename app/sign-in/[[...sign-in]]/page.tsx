'use client';

import { useSearchParams } from 'next/navigation';
import { AuthLayout, SignInForm } from '@/components/auth';

export default function SignInPage() {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect_url') || '/dashboard';
  
  return (
    <AuthLayout
      title="Sign in"
      subtitle="Don't have an account?"
      linkText="Sign up"
      linkHref="/sign-up"
    >
      <SignInForm redirectUrl={redirectUrl} />
    </AuthLayout>
  );
}
