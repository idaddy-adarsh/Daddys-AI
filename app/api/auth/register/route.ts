import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { User, hashPassword, generateOTP } from '@/lib/models/user';
import { sendVerificationEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { username, email, password } = await request.json();

    // Validate input
    if (!username || !email || !password) {
      return NextResponse.json(
        { error: 'Username, email, and password are required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();
    const usersCollection = db.collection('users');

    // Check if user already exists
    const existingUser = await usersCollection.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email or username already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Generate OTP for email verification
    const otp = generateOTP();
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 10); // OTP valid for 10 minutes

    // Create new user
    const newUser: User = {
      username,
      email,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
      isVerified: false, // User starts as unverified
      verificationOTP: {
        code: otp,
        expiresAt: otpExpiry,
      }
    };

    const result = await usersCollection.insertOne(newUser);

    // Send verification email
    try {
      await sendVerificationEmail(email, otp);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Continue with registration even if email fails
      // In production, you might want to handle this differently
    }

    // Return success response without sensitive data
    return NextResponse.json(
      {
        id: result.insertedId,
        username,
        email,
        isVerified: false,
        createdAt: newUser.createdAt,
        message: 'Registration successful. Please check your email for verification code.'
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 