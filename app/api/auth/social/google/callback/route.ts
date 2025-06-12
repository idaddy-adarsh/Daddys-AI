import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { ObjectId } from 'mongodb';

// JWT secret should be stored in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRY = '7d'; // Token expires in 7 days

// Google OAuth credentials
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.NEXTAUTH_URL ? `${process.env.NEXTAUTH_URL}/api/auth/social/google/callback` : 'http://localhost:3000/api/auth/social/google/callback';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(new URL('/sign-in?error=oauth_error', request.url));
    }

    if (!code || !state) {
      return NextResponse.redirect(new URL('/sign-in?error=missing_params', request.url));
    }

    // Verify state to prevent CSRF attacks
    const cookieStore = await cookies();
    const storedState = cookieStore.get('google_oauth_state')?.value;

    if (!storedState || storedState !== state) {
      return NextResponse.redirect(new URL('/sign-in?error=invalid_state', request.url));
    }

    // Clear the state cookie
    cookieStore.delete('google_oauth_state');

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      return NextResponse.redirect(new URL('/sign-in?error=configuration_error', request.url));
    }

    // Exchange code for token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error('Token exchange error:', tokenData);
      return NextResponse.redirect(new URL('/sign-in?error=token_exchange', request.url));
    }

    // Get user info from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const googleUser = await userInfoResponse.json();

    if (!userInfoResponse.ok) {
      console.error('User info error:', googleUser);
      return NextResponse.redirect(new URL('/sign-in?error=user_info', request.url));
    }

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db();
    const usersCollection = db.collection('users');

    // Check if user exists with this Google ID
    let user = await usersCollection.findOne({
      'socialLogins.google.id': googleUser.id,
    });

    // If not found by Google ID, try to find by email
    if (!user && googleUser.email) {
      user = await usersCollection.findOne({ email: googleUser.email });
    }

    let needsProfileCompletion = false;
    let isNewUser = false;

    // If user exists, update Google login info
    if (user) {
      await usersCollection.updateOne(
        { _id: user._id },
        {
          $set: {
            'socialLogins.google': {
              id: googleUser.id,
              email: googleUser.email,
              name: googleUser.name,
              picture: googleUser.picture,
            },
            updatedAt: new Date(),
            isVerified: true, // Mark as verified since Google accounts are pre-verified
          },
        }
      );
      
      // Check if password is set (for multiple login methods)
      if (!user.password || user.password === '') {
        needsProfileCompletion = true;
      }
    } else {
      // Create new user
      isNewUser = true;
      needsProfileCompletion = true;
      
      const username = googleUser.email ? googleUser.email.split('@')[0] : `user_${Math.random().toString(36).substring(2, 10)}`;
      
      // Check if username exists
      const existingUsername = await usersCollection.findOne({ username });
      const finalUsername = existingUsername ? `${username}_${Math.random().toString(36).substring(2, 5)}` : username;

      const newUser = {
        username: finalUsername,
        email: googleUser.email,
        password: '', // No password for social login initially
        isVerified: true, // Google accounts are pre-verified
        createdAt: new Date(),
        updatedAt: new Date(),
        socialLogins: {
          google: {
            id: googleUser.id,
            email: googleUser.email,
            name: googleUser.name,
            picture: googleUser.picture,
          },
        },
      };

      const result = await usersCollection.insertOne(newUser);
      user = { ...newUser, _id: result.insertedId };
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user._id.toString(),
        email: user.email,
        username: user.username,
        isVerified: true,
        hasSocialLogin: true
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    // Set cookie
    cookieStore.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    // Redirect to profile completion if needed
    if (needsProfileCompletion) {
      return NextResponse.redirect(new URL(`/complete-profile?isNewUser=${isNewUser}`, request.url));
    }

    // Redirect to dashboard
    return NextResponse.redirect(new URL('/dashboard', request.url));
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return NextResponse.redirect(new URL('/sign-in?error=server_error', request.url));
  }
} 