import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// JWT secret should be stored in environment variables
const JWT_SECRET = process.env.JWT_SECRET?.trim() || 'your-secret-key';

export async function GET(request: NextRequest) {
  try {
    // Get token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      console.log('No auth token found in cookies');
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Verify token
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        id: string;
        email: string;
        username: string;
        isVerified: boolean;
      };

      // Get user from database
      const client = await clientPromise;
      const db = client.db();
      const usersCollection = db.collection('users');

      const user = await usersCollection.findOne({
        _id: new ObjectId(decoded.id),
      });

      if (!user) {
        console.log('User not found in database');
        // Clear invalid token
        cookieStore.delete('auth_token');
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      // Return user data without sensitive information
      return NextResponse.json({
        id: user._id,
        username: user.username,
        email: user.email,
        isVerified: user.isVerified,
        socialLogins: user.socialLogins
      });
    } catch (jwtError) {
      console.error('JWT verification error:', jwtError);
      // Clear invalid token
      cookieStore.delete('auth_token');
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Get current user error:', error);
    
    // If token is invalid, clear it
    try {
      const cookieStore = await cookies();
      cookieStore.delete('auth_token');
    } catch (e) {
      console.error('Error clearing cookies:', e);
    }
    
    return NextResponse.json(
      { error: 'Authentication error' },
      { status: 401 }
    );
  }
} 