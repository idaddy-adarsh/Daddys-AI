import { NextResponse } from 'next/server';
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';

// Define protected routes using createRouteMatcher
const isProtectedRoute = createRouteMatcher(['/dashboard(.*)']);

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/privacy(.*)',
  '/terms(.*)',
  '/api/((?!restricted).*)'
]);

// This middleware protects specific routes that require authentication
export default clerkMiddleware(async (auth, req) => {
  // If the route is protected, ensure the user is authenticated
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
  
  // If the user is signed in and trying to access auth pages
  const { userId } = await auth();
  if (userId && (req.nextUrl.pathname.startsWith('/sign-in') || req.nextUrl.pathname.startsWith('/sign-up'))) {
    // Redirect to dashboard
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }
  
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:jpg|jpeg|png|gif|ico)).*)',
  ],
};