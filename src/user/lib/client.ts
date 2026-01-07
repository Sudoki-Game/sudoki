/**
 * User Client - localStorage operations
 *
 * Handles saving and retrieving user data from localStorage with HMAC tamper detection.
 */

import type { LocalUserData } from '@/user/types';
import { createDefaultLocalUserData } from '@/user/types';
import { createSignedPayload, extractVerifiedPayload, SignedPayload } from '@/match/lib/encoding';

/** localStorage key for user data */
export const USER_DATA_KEY = 'sudoku_user_data';

/**
 * Result of save operation
 */
export interface SaveResult {
  success: boolean;
  error?: string;
}

/**
 * Save user data to localStorage
 */
export async function saveUserData(userData: LocalUserData): Promise<SaveResult> {
  try {
    const signedPayload = await createSignedPayload(userData);
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(signedPayload));
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[UserClient] Error saving user data:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Get user data from localStorage
 * Returns default data if nothing saved or if tampering is detected
 */
export async function getUserData(): Promise<LocalUserData> {
  try {
    const storedData = localStorage.getItem(USER_DATA_KEY);
    if (!storedData) {
      return createDefaultLocalUserData();
    }

    const signedPayload: SignedPayload = JSON.parse(storedData);
    const userData = await extractVerifiedPayload<LocalUserData>(signedPayload);

    if (userData === null) {
      console.warn('[UserClient] Invalid or tampered user data detected');
      return createDefaultLocalUserData();
    }

    return userData;
  } catch (error) {
    console.error('[UserClient] Error reading user data:', error);
    return createDefaultLocalUserData();
  }
}

/**
 * Clear user data from localStorage
 */
export function clearUserData(): void {
  localStorage.removeItem(USER_DATA_KEY);
}
