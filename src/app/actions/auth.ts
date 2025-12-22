'use server';

import { cookies } from 'next/headers';
import { SessionResult } from '@/types/auth';
import { serverAuth } from '@/lib/firebase/server';

export async function createSession(idToken: string): Promise<SessionResult> {
  try {
    const decodedToken = await serverAuth.verifyIdToken(idToken);

    const cookieStore = await cookies();

    cookieStore.set('session', idToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 5, // 5 days
      path: '/'
    });

    return { success: true, uid: decodedToken.uid };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function removeSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}

export async function getSession(): Promise<string | undefined> {
  const cookieStore = await cookies();
  const session = cookieStore.get('session');
  return session?.value;
}
