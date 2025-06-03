'use client';

import * as Clerk from '@clerk/elements/common';
import * as SignUp from '@clerk/elements/sign-up';
import { clerkAppearance } from './ClerkAppearance';
import Link from 'next/link';

interface SignUpFormProps {
  redirectUrl: string;
}

export default function SignUpForm({ redirectUrl }: SignUpFormProps) {
  return (
    <div className="w-full">
      <SignUp.Root redirectUrl={redirectUrl} appearance={clerkAppearance}>
        <SignUp.Step name="start">
          <Clerk.Connection name="google" className="bg-[#2a2a2a] hover:bg-[#333333] border-2 border-gray-700 hover:border-gray-600 text-white rounded-xl py-3 transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center space-x-3 w-full mb-4">
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign up with Google
          </Clerk.Connection>
          
          <Clerk.Connection name="microsoft" className="bg-[#2a2a2a] hover:bg-[#333333] border-2 border-gray-700 hover:border-gray-600 text-white rounded-xl py-3 transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center space-x-3 w-full mb-6">
            <svg className="w-5 h-5 mr-3 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 23 23">
              <path fill="#f3f3f3" d="M0 0h23v23H0z" />
              <path fill="#f35325" d="M1 1h10v10H1z" />
              <path fill="#81bc06" d="M12 1h10v10H12z" />
              <path fill="#05a6f0" d="M1 12h10v10H1z" />
              <path fill="#ffba08" d="M12 12h10v10H12z" />
            </svg>
            Sign up with Microsoft
          </Clerk.Connection>
          
          <div className="relative flex items-center justify-center w-full mb-6">
            <div className="border-t border-gray-700 w-full"></div>
            <div className="text-gray-500 text-sm px-4 bg-[#1e1e1e]">OR</div>
            <div className="border-t border-gray-700 w-full"></div>
          </div>
          
          <Clerk.Field name="emailAddress" className="mb-4">
            <Clerk.Label className="text-gray-300 font-medium block mb-2">Email</Clerk.Label>
            <Clerk.Input className="bg-[#2a2a2a] border-2 border-gray-700 text-white rounded-xl px-4 py-3.5 w-full focus:ring-2 focus:ring-[#f97316] focus:border-transparent transition-all duration-300 placeholder-gray-500 shadow-inner hover:border-gray-600" />
            <Clerk.FieldError className="text-red-400 text-sm font-medium mt-1" />
          </Clerk.Field>
          
          <Clerk.Field name="username" className="mb-4">
            <Clerk.Label className="text-gray-300 font-medium block mb-2">Username</Clerk.Label>
            <Clerk.Input className="bg-[#2a2a2a] border-2 border-gray-700 text-white rounded-xl px-4 py-3.5 w-full focus:ring-2 focus:ring-[#f97316] focus:border-transparent transition-all duration-300 placeholder-gray-500 shadow-inner hover:border-gray-600" />
            <Clerk.FieldError className="text-red-400 text-sm font-medium mt-1" />
          </Clerk.Field>
          
          <Clerk.Field name="password" className="mb-4">
            <Clerk.Label className="text-gray-300 font-medium block mb-2">Password</Clerk.Label>
            <Clerk.Input type="password" className="bg-[#2a2a2a] border-2 border-gray-700 text-white rounded-xl px-4 py-3.5 w-full focus:ring-2 focus:ring-[#f97316] focus:border-transparent transition-all duration-300 placeholder-gray-500 shadow-inner hover:border-gray-600" />
            <Clerk.FieldError className="text-red-400 text-sm font-medium mt-1" />
          </Clerk.Field>
          
          <Clerk.Field name="confirmPassword" className="mb-4">
            <Clerk.Label className="text-gray-300 font-medium block mb-2">Confirm Password</Clerk.Label>
            <Clerk.Input type="password" className="bg-[#2a2a2a] border-2 border-gray-700 text-white rounded-xl px-4 py-3.5 w-full focus:ring-2 focus:ring-[#f97316] focus:border-transparent transition-all duration-300 placeholder-gray-500 shadow-inner hover:border-gray-600" />
            <Clerk.FieldError className="text-red-400 text-sm font-medium mt-1" />
          </Clerk.Field>
          <div id="clerk-captcha" />
          
          <SignUp.Action submit className="bg-gradient-to-r from-[#f97316] to-[#fb923c] hover:from-[#ea580c] hover:to-[#f97316] text-white font-semibold py-3.5 px-5 rounded-xl transition-all duration-300 w-full flex items-center justify-center space-x-2 relative shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]">
            Continue
          </SignUp.Action>
          
          <div className="mt-6 text-center md:hidden">
            <p className="text-gray-400">
              Already have an account?{' '}
              <Link href="/sign-in" className="text-[#f97316] hover:text-[#fb923c] font-medium transition-colors duration-200 hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </SignUp.Step>
        
        <SignUp.Step name="continue">
          <h2 className="text-2xl font-bold text-white mb-6">Complete your profile</h2>
          
          <Clerk.Field name="username" className="mb-4">
            <Clerk.Label className="text-gray-300 font-medium block mb-2">Username</Clerk.Label>
            <Clerk.Input className="bg-[#2a2a2a] border-2 border-gray-700 text-white rounded-xl px-4 py-3.5 w-full focus:ring-2 focus:ring-[#f97316] focus:border-transparent transition-all duration-300 placeholder-gray-500 shadow-inner hover:border-gray-600" />
            <Clerk.FieldError className="text-red-400 text-sm font-medium mt-1" />
          </Clerk.Field>
          
          <SignUp.Action submit className="bg-gradient-to-r from-[#f97316] to-[#fb923c] hover:from-[#ea580c] hover:to-[#f97316] text-white font-semibold py-3.5 px-5 rounded-xl transition-all duration-300 w-full flex items-center justify-center space-x-2 relative shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] mt-4">
            Continue
          </SignUp.Action>
        </SignUp.Step>
        
        <SignUp.Step name="verifications">
          <SignUp.Strategy name="email_code">
            <Clerk.Field name="code" className="mb-4">
              <Clerk.Label className="text-gray-300 font-medium block mb-2">Code</Clerk.Label>
              <Clerk.Input className="bg-[#2a2a2a] border-2 border-gray-700 text-white rounded-xl px-4 py-3.5 w-full focus:ring-2 focus:ring-[#f97316] focus:border-transparent transition-all duration-300 placeholder-gray-500 shadow-inner hover:border-gray-600" />
              <Clerk.FieldError className="text-red-400 text-sm font-medium mt-1" />
            </Clerk.Field>
            
            <SignUp.Action submit className="bg-gradient-to-r from-[#f97316] to-[#fb923c] hover:from-[#ea580c] hover:to-[#f97316] text-white font-semibold py-3.5 px-5 rounded-xl transition-all duration-300 w-full flex items-center justify-center space-x-2 relative shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]">
              Verify
            </SignUp.Action>
          </SignUp.Strategy>
        </SignUp.Step>
      </SignUp.Root>
    </div>
  );
}
