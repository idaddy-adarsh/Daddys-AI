import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';

export interface User {
  _id?: ObjectId;
  username: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
  isVerified: boolean;
  verificationOTP?: {
    code: string;
    expiresAt: Date;
  };
  socialLogins?: {
    google?: {
      id: string;
      email: string;
      name?: string;
      picture?: string;
    };
    facebook?: {
      id: string;
      email: string;
      name?: string;
      picture?: string;
    };
  };
}

export interface UserSession {
  id: string;
  username: string;
  email: string;
  isVerified: boolean;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateOTP(): string {
  // Generate a 6-digit OTP
  return Math.floor(100000 + Math.random() * 900000).toString();
} 