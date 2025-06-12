import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { UserSession } from './models/user';
import { redirect } from 'next/navigation';

// JWT secret should be stored in environment variables
const JWT_SECRET = process.env.JWT_SECRET || '49537e10b8e856c44ebc831351ab686da84b4a6fb325d7590bc8676f7bd6f06efe726d7820790c86bae56ee2eb7d77732b8e180fee75859303ee0e47c0058663ded4b62e46092b2bcee5e57cf7d63a265824f0a09c3b49ffb5e18153caf1126ea263e6b1a11e3ddb15150c7dbbd600dc64779b1786772bd8eb4695018444a33e45b81df500a0e25df75d5584537a3da52117b93f81e246dee58f92023abb24c558338e3516aac248d66914b2ec2871252411d56ec0a4b4278bba7fd7e0d305e272aeb5e2c0c0b1bfc9253f2de1082eca2609f4853db2a09c63b818284fc5a7b87fe9714fc5f0ab8d5bad663a435122090db6be583567c0eeb974da63b56d7e55';

/**
 * Get the current user session from the auth token cookie
 * This function can be used in server components
 */
export async function getCurrentUser(): Promise<UserSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as UserSession;
    return {
      id: decoded.id,
      username: decoded.username,
      email: decoded.email,
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Check if the user is authenticated, if not redirect to sign in
 * This function can be used in server components
 */
export async function requireAuth(redirectTo = '/sign-in') {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect(redirectTo);
  }
  
  return user;
}

/**
 * Check if the user is authenticated and redirect to dashboard if they are
 * This function can be used in server components
 */
export async function redirectIfAuthenticated(redirectTo = '/dashboard') {
  const user = await getCurrentUser();
  
  if (user) {
    redirect(redirectTo);
  }
  
  return null;
} 