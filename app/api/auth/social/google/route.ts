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

// Start Google OAuth flow
export async function GET(request: NextRequest) {
  if (!GOOGLE_CLIENT_ID) {
    return NextResponse.json(
      { error: 'Google OAuth is not configured' },
      { status: 500 }
    );
  }

  // Generate a random state to prevent CSRF attacks
  const state = Math.random().toString(36).substring(2, 15);
  
  // Store state in a cookie for verification
  const cookieStore = await cookies();
  cookieStore.set({
    name: 'google_oauth_state',
    value: state,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 10, // 10 minutes
    path: '/',
  });

  // Build Google OAuth URL
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.append('client_id', GOOGLE_CLIENT_ID);
  authUrl.searchParams.append('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('scope', 'email profile');
  authUrl.searchParams.append('state', state);

  // Redirect to Google OAuth
  return NextResponse.redirect(authUrl.toString());
}

// Handle Google OAuth callback
export async function POST(request: NextRequest) {
  try {
    const { code, state } = await request.json();

    // Verify state to prevent CSRF attacks
    const cookieStore = await cookies();
    const storedState = cookieStore.get('google_oauth_state')?.value;

    if (!storedState || storedState !== state) {
      return NextResponse.json(
        { error: 'Invalid state parameter' },
        { status: 400 }
      );
    }

    // Clear the state cookie
    cookieStore.delete('google_oauth_state');

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      return NextResponse.json(
        { error: 'Google OAuth is not configured' },
        { status: 500 }
      );
    }

    // Exchange code for token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to exchange code for token' },
        { status: 400 }
      );
    }

    // Get user info from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const googleUser = await userInfoResponse.json();

    if (!userInfoResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to get user info from Google' },
        { status: 400 }
      );
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
          },
        }
      );
    } else {
      // Create new user
      const username = googleUser.email ? googleUser.email.split('@')[0] : `user_${Math.random().toString(36).substring(2, 10)}`;
      
      // Check if username exists
      const existingUsername = await usersCollection.findOne({ username });
      const finalUsername = existingUsername ? `${username}_${Math.random().toString(36).substring(2, 5)}` : username;

      const newUser = {
        username: finalUsername,
        email: googleUser.email,
        password: '', // No password for social login
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

    // Return user data without sensitive information
    return NextResponse.json({
      id: user._id,
      username: user.username,
      email: user.email,
      isVerified: true,
    });
  } catch (error) {
    console.error('Google OAuth error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}