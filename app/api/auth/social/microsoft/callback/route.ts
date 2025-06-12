import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { ObjectId } from 'mongodb';

// JWT secret should be stored in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRY = '7d'; // Token expires in 7 days

// Microsoft OAuth credentials
const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CLIENT_ID;
const MICROSOFT_CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET;
const REDIRECT_URI = process.env.NEXTAUTH_URL ? `${process.env.NEXTAUTH_URL}/api/auth/social/microsoft/callback` : 'http://localhost:3000/api/auth/social/microsoft/callback';

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
    const storedState = cookieStore.get('microsoft_oauth_state')?.value;

    if (!storedState || storedState !== state) {
      return NextResponse.redirect(new URL('/sign-in?error=invalid_state', request.url));
    }

    // Clear the state cookie
    cookieStore.delete('microsoft_oauth_state');

    if (!MICROSOFT_CLIENT_ID || !MICROSOFT_CLIENT_SECRET) {
      return NextResponse.redirect(new URL('/sign-in?error=configuration_error', request.url));
    }

    // Exchange code for token
    const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: MICROSOFT_CLIENT_ID,
        client_secret: MICROSOFT_CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error('Token exchange error:', tokenData);
      return NextResponse.redirect(new URL('/sign-in?error=token_exchange', request.url));
    }

    // Get user info from Microsoft Graph API
    const userInfoResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const microsoftUser = await userInfoResponse.json();

    if (!userInfoResponse.ok) {
      console.error('User info error:', microsoftUser);
      return NextResponse.redirect(new URL('/sign-in?error=user_info', request.url));
    }

    // Try to get user's profile photo
    let profilePicture = null;
    try {
      const photoResponse = await fetch('https://graph.microsoft.com/v1.0/me/photo/$value', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      
      if (photoResponse.ok) {
        // If photo exists, create a data URL
        const photoBlob = await photoResponse.blob();
        const photoArrayBuffer = await photoBlob.arrayBuffer();
        const photoBase64 = Buffer.from(photoArrayBuffer).toString('base64');
        const photoMimeType = photoResponse.headers.get('content-type') || 'image/jpeg';
        profilePicture = `data:${photoMimeType};base64,${photoBase64}`;
      }
    } catch (photoError) {
      console.error('Error fetching Microsoft profile photo:', photoError);
      // Continue without profile picture
    }

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db();
    const usersCollection = db.collection('users');

    // Check if user exists with this Microsoft ID
    let user = await usersCollection.findOne({
      'socialLogins.microsoft.id': microsoftUser.id,
    });

    // If not found by Microsoft ID, try to find by email
    const email = microsoftUser.mail || microsoftUser.userPrincipalName;
    if (!user && email) {
      user = await usersCollection.findOne({ email: email });
    }

    let needsProfileCompletion = false;
    let isNewUser = false;

    // If user exists, update Microsoft login info
    if (user) {
      await usersCollection.updateOne(
        { _id: user._id },
        {
          $set: {
            'socialLogins.microsoft': {
              id: microsoftUser.id,
              email: email,
              name: microsoftUser.displayName,
              picture: profilePicture,
            },
            updatedAt: new Date(),
            isVerified: true, // Microsoft accounts are pre-verified
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
      
      const username = email ? email.split('@')[0] : `user_${Math.random().toString(36).substring(2, 10)}`;
      
      // Check if username exists
      const existingUsername = await usersCollection.findOne({ username });
      const finalUsername = existingUsername ? `${username}_${Math.random().toString(36).substring(2, 5)}` : username;

      const newUser = {
        username: finalUsername,
        email: email,
        password: '', // No password for social login initially
        isVerified: true, // Microsoft accounts are pre-verified
        createdAt: new Date(),
        updatedAt: new Date(),
        socialLogins: {
          microsoft: {
            id: microsoftUser.id,
            email: email,
            name: microsoftUser.displayName,
            picture: profilePicture,
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
    console.error('Microsoft OAuth callback error:', error);
    return NextResponse.redirect(new URL('/sign-in?error=server_error', request.url));
  }
} 