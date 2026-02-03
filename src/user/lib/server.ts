/**
 * User Server - Firestore operations
 *
 * Server-side operations for user data using Firebase Admin SDK.
 */

import { serverDb } from '@/firebase/server';
import type { ServerUserData } from '@/user/types';
import {
  createInitialServerUserData,
  hasCompletedOnboarding,
} from '@/user/types';

/** Firestore collection name for users */
export const USERS_COLLECTION = 'users';

/**
 * Get user data from Firestore
 */
export async function getUserData(
  userId: string,
): Promise<ServerUserData | null> {
  try {
    const userRef = serverDb.collection(USERS_COLLECTION).doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return null;
    }

    return userDoc.data() as ServerUserData;
  } catch (error) {
    console.error('[UserServer] Error getting user data:', error);
    return null;
  }
}

/**
 * Check if user exists
 */
export async function userExists(userId: string): Promise<boolean> {
  try {
    const userRef = serverDb.collection(USERS_COLLECTION).doc(userId);
    const userDoc = await userRef.get();
    return userDoc.exists;
  } catch (error) {
    console.error('[UserServer] Error checking user existence:', error);
    return false;
  }
}

/**
 * Create a new user
 */
export async function createUser(
  userId: string,
  email: string | null,
  displayName: string = '',
): Promise<ServerUserData> {
  const userData = createInitialServerUserData(userId, email, displayName);

  const userRef = serverDb.collection(USERS_COLLECTION).doc(userId);
  await userRef.set(userData);

  return userData;
}

/**
 * Update user data
 */
export async function updateUser(
  userId: string,
  updates: Partial<ServerUserData>,
): Promise<boolean> {
  try {
    const userRef = serverDb.collection(USERS_COLLECTION).doc(userId);
    await userRef.update({
      ...updates,
      lastActive: Date.now(),
    });
    return true;
  } catch (error) {
    console.error('[UserServer] Error updating user:', error);
    return false;
  }
}

/**
 * Update user display name
 */
export async function updateDisplayName(
  userId: string,
  displayName: string,
): Promise<boolean> {
  return updateUser(userId, { displayName: displayName.trim() });
}

/**
 * Check if user has completed onboarding (server version)
 */
export async function checkOnboardingComplete(
  userId: string,
): Promise<boolean> {
  const userData = await getUserData(userId);
  return hasCompletedOnboarding(userData);
}

/**
 * Check if display name is taken by another user
 */
export async function isDisplayNameTaken(
  displayName: string,
  excludeUserId?: string,
): Promise<boolean> {
  try {
    const usersRef = serverDb
      .collection(USERS_COLLECTION)
      .where('displayName', '==', displayName.trim());

    const querySnapshot = await usersRef.get();

    if (querySnapshot.empty) {
      return false;
    }

    // If excluding a user, check if it's only their document
    if (excludeUserId) {
      return querySnapshot.docs.some((doc) => doc.id !== excludeUserId);
    }

    return true;
  } catch (error) {
    console.error('[UserServer] Error checking display name:', error);
    return false;
  }
}

/**
 * Get or create user
 * Returns existing user data or creates a new user if not exists
 */
export async function getOrCreateUser(
  userId: string,
  email: string | null,
): Promise<ServerUserData> {
  const existingUser = await getUserData(userId);

  if (existingUser) {
    // Update last active timestamp
    await updateUser(userId, {});
    return existingUser;
  }

  return createUser(userId, email);
}
