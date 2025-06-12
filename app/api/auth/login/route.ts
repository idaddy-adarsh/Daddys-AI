import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { comparePassword, generateOTP } from '@/lib/models/user';
import { sendVerificationEmail } from '@/lib/email';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

// JWT secret should be stored in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRY = '7d'; // Token expires in 7 days

export async function POST(request: NextRequest) {
  try {
    const { identifier, password } = await request.json();

    // Validate input
    if (!identifier || !password) {
      return NextResponse.json(
        { error: 'Email/username and password are required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();
    const usersCollection = db.collection('users');

    // Find user by email or username
    const user = await usersCollection.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check if user is verified
    if (!user.isVerified) {
      // Generate a new OTP and send it
      const otp = generateOTP();
      const otpExpiry = new Date();
      otpExpiry.setMinutes(otpExpiry.getMinutes() + 10); // OTP valid for 10 minutes

      // Update user with new OTP
      await usersCollection.updateOne(
        { _id: user._id },
        { 
          $set: { 
            verificationOTP: {
              code: otp,
              expiresAt: otpExpiry
            },
            updatedAt: new Date()
          }
        }
      );

      // Send verification email
      await sendVerificationEmail(user.email, otp);

      return NextResponse.json(
        { 
          error: 'Email not verified',
          message: 'Please verify your email. A new verification code has been sent.',
          requiresVerification: true,
          email: user.email
        },
        { status: 403 }
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user._id.toString(),
        email: user.email,
        username: user.username,
        isVerified: user.isVerified,
        // Include minimal social login info if available
        hasSocialLogin: !!user.socialLogins
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
      sameSite: 'lax',
    });

    console.log('Login successful, token set');

    // Return user data without sensitive information
    return NextResponse.json({
      id: user._id,
      username: user.username,
      email: user.email,
      isVerified: user.isVerified,
      socialLogins: user.socialLogins
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 