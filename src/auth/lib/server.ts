'use server';
import { cookies } from 'next/headers';
import { serverAuth } from '../../firebase/server';
import { AuthUser } from '../types';

export async function getServerUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get('session');

  if (!session?.value) return null;

  try {
    const decodedToken = await serverAuth.verifyIdToken(session.value);

    const authUser: AuthUser = {
      uid: decodedToken.uid,
      email: decodedToken.email || null,
      emailVerified: decodedToken.email_verified || false,
      displayName: decodedToken.name || null,
    };

    return authUser;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}
