import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// List of public paths that don't require authentication
const publicPaths = [
  '/',
  '/sign-in',
  '/sign-up',
  '/forgot-password',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/verify',
  '/api/auth/social/google',
  '/api/auth/social/google/callback',
  '/api/auth/social/microsoft',
  '/api/auth/social/microsoft/callback',
  '/complete-profile',
];

// Function to check if a path is public
const isPublicPath = (path: string): boolean => {
  return publicPaths.some(publicPath => 
    path === publicPath || 
    path.startsWith(`${publicPath}/`) ||
    path.startsWith('/api/auth/') ||
    path.startsWith('/api/chat') ||
    path.includes('_next') ||
    path.includes('favicon.ico')
  );
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Allow public paths
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }
  
  // Check for auth token
  const token = request.cookies.get('auth_token')?.value;

  // If no token and trying to access protected route, redirect to sign-in
  if (!token) {
    console.log(`Middleware: No auth token, redirecting from ${pathname} to sign-in`);
    const signInUrl = new URL('/sign-in', request.url);
    // Only add redirect_url for non-API routes
    if (!pathname.startsWith('/api/')) {
      signInUrl.searchParams.set('redirect_url', pathname);
    }
    return NextResponse.redirect(signInUrl);
  }

  try {
    // Verify JWT token (basic check, detailed verification happens in API routes)
    const JWT_SECRET = process.env.JWT_SECRET?.trim() || 'your-secret-key';
    await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
    
    // Token is valid, allow access
  return NextResponse.next();
  } catch (error) {
    console.error('Middleware: Invalid token:', error);
    // Invalid token, redirect to sign-in
    const signInUrl = new URL('/sign-in', request.url);
    // Only add redirect_url for non-API routes
    if (!pathname.startsWith('/api/')) {
      signInUrl.searchParams.set('redirect_url', pathname);
    }
    return NextResponse.redirect(signInUrl);
  }
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    // Apply to all routes except _next, static, and favicon
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)',
  ],
};