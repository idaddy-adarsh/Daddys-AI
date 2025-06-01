import { NextResponse } from 'next/server';
import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';

// This middleware protects specific routes that require authentication
// and allows public access to other routes
export default clerkMiddleware({
  // Public routes that don't require authentication
  publicRoutes: [
    '/',
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/api(.*)',
  ],
  // Routes that will redirect to sign-in if user is not authenticated
  afterAuth(auth, req) {
    // If the user is not signed in and trying to access a protected route
    if (!auth.userId && !auth.isPublicRoute) {
      // Redirect to sign-in page with a return_to parameter
      const signInUrl = new URL('/sign-in', req.url);
      signInUrl.searchParams.set('redirect_url', req.url);
      return NextResponse.redirect(signInUrl);
    }
    
    // If the user is signed in and trying to access auth pages
    if (auth.userId && (req.nextUrl.pathname.startsWith('/sign-in') || req.nextUrl.pathname.startsWith('/sign-up'))) {
      // Redirect to dashboard
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    
    return NextResponse.next();
  },
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:jpg|jpeg|png|gif|ico)).*)',
  ],
  runtime: 'nodejs'
};