import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { sendWelcomeEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { email, otp } = await request.json();

    // Validate input
    if (!email || !otp) {
      return NextResponse.json(
        { error: 'Email and OTP are required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();
    const usersCollection = db.collection('users');

    // Find user by email
    const user = await usersCollection.findOne({ email });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is already verified
    if (user.isVerified) {
      return NextResponse.json(
        { message: 'Email already verified' },
        { status: 200 }
      );
    }

    // Check if OTP exists and is valid
    if (!user.verificationOTP || 
        user.verificationOTP.code !== otp || 
        new Date() > new Date(user.verificationOTP.expiresAt)) {
      
      return NextResponse.json(
        { error: 'Invalid or expired OTP' },
        { status: 400 }
      );
    }

    // Mark user as verified and remove OTP
    await usersCollection.updateOne(
      { _id: user._id },
      { 
        $set: { 
          isVerified: true,
          updatedAt: new Date()
        },
        $unset: { verificationOTP: "" }
      }
    );

    // Send welcome email
    try {
      await sendWelcomeEmail(user.email, user.username);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Continue even if welcome email fails
    }

    return NextResponse.json(
      { 
        message: 'Email verification successful',
        isVerified: true
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Endpoint to resend OTP
export async function PUT(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();
    const usersCollection = db.collection('users');

    // Find user by email
    const user = await usersCollection.findOne({ email });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is already verified
    if (user.isVerified) {
      return NextResponse.json(
        { message: 'Email already verified' },
        { status: 200 }
      );
    }

    // Import functions here to avoid circular dependencies
    const { generateOTP } = await import('@/lib/models/user');
    const { sendVerificationEmail } = await import('@/lib/email');

    // Generate new OTP
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
    await sendVerificationEmail(email, otp);

    return NextResponse.json(
      { 
        message: 'Verification code resent. Please check your email.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Resend OTP error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 