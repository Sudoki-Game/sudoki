'use server';

import { cookies } from 'next/headers';
import { SessionResult } from '@/types/auth';
import { serverAuth } from '@/lib/firebase/server';
import {
  userExists,
  createUser,
  updateDisplayName,
  isDisplayNameTaken,
  checkOnboardingComplete,
} from '@/user/lib/server';

export async function createSession(idToken: string): Promise<SessionResult> {
  try {
    const decodedToken = await serverAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Check if user exists in Firestore
    const exists = await userExists(uid);
    const isNewUser = !exists;

    if (isNewUser) {
      await createUser(uid, decodedToken.email || null);
    }

    const cookieStore = await cookies();

    cookieStore.set('session', idToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 5, // 5 days
      path: '/',
    });

    return { success: true, uid, isNewUser };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
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

export interface OnboardingResult {
  success: boolean;
  error?: string;
}

export async function completeOnboarding(
  _prevState: OnboardingResult,
  formData: FormData,
): Promise<OnboardingResult> {
  try {
    const displayName = formData.get('displayName');

    if (typeof displayName !== 'string') {
      return { success: false, error: 'Invalid form submission' };
    }

    const trimmedName = displayName.trim();

    if (!trimmedName) {
      return { success: false, error: 'Display name cannot be empty' };
    }

    if (trimmedName.length < 2) {
      return {
        success: false,
        error: 'Display name must be at least 2 characters',
      };
    }

    if (trimmedName.length > 30) {
      return {
        success: false,
        error: 'Display name cannot exceed 30 characters',
      };
    }

    // Check if display name is already taken
    const isTaken = await isDisplayNameTaken(trimmedName);
    if (isTaken) {
      return { success: false, error: 'This display name is already taken' };
    }

    const session = await getSession();
    if (!session) {
      return { success: false, error: 'User not authenticated' };
    }

    const decodedToken = await serverAuth.verifyIdToken(session);
    await updateDisplayName(decodedToken.uid, trimmedName);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to save display name',
    };
  }
}

/**
 * checkUserOnboarding: Server-side check for middleware to determine if user has completed onboarding.
 * Used by middleware to route authenticated users appropriately.
 */
export async function checkUserOnboarding(): Promise<{
  hasCompleted: boolean;
  uid?: string;
}> {
  try {
    const session = await getSession();
    if (!session) {
      return { hasCompleted: false };
    }

    const decodedToken = await serverAuth.verifyIdToken(session);
    const completed = await checkOnboardingComplete(decodedToken.uid);

    return { hasCompleted: completed, uid: decodedToken.uid };
  } catch (error) {
    console.error('Error checking user onboarding:', error);
    return { hasCompleted: false };
  }
}
