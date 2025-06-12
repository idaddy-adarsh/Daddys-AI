import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { hashPassword } from '@/lib/models/user';

// JWT secret should be stored in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRY = '7d'; // Token expires in 7 days

export async function POST(request: NextRequest) {
  try {
    // Get token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      email: string;
      username: string;
      isVerified: boolean;
    };

    // Get user data from request
    const { username, password } = await request.json();

    // Validate input
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db();
    const usersCollection = db.collection('users');

    // Get user from database
    const user = await usersCollection.findOne({
      _id: new ObjectId(decoded.id),
    });

    if (!user) {
      // Clear invalid token
      cookieStore.delete('auth_token');
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if username is different and already exists
    if (username !== user.username) {
      const existingUsername = await usersCollection.findOne({ 
        username, 
        _id: { $ne: new ObjectId(decoded.id) } 
      });
      
      if (existingUsername) {
        return NextResponse.json(
          { error: 'Username already taken' },
          { status: 409 }
        );
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Update user
    await usersCollection.updateOne(
      { _id: new ObjectId(decoded.id) },
      {
        $set: {
          username,
          password: hashedPassword,
          updatedAt: new Date(),
        },
      }
    );

    // Generate new JWT token with updated username
    const newToken = jwt.sign(
      {
        id: user._id.toString(),
        email: user.email,
        username: username, // Use the new username
        isVerified: user.isVerified,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    // Set new cookie
    cookieStore.set({
      name: 'auth_token',
      value: newToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    // Return success
    return NextResponse.json({
      message: 'Profile updated successfully',
      username,
    });
  } catch (error) {
    console.error('Complete profile error:', error);
    
    // If token is invalid, clear it
    if (error instanceof jwt.JsonWebTokenError) {
      const cookieStore = await cookies();
      cookieStore.delete('auth_token');
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 