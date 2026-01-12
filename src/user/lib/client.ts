/**
 * User Client - localStorage operations
 *
 * Handles saving and retrieving user data from localStorage with HMAC tamper detection.
 */

import type { LocalUserData } from '@/user/types';
import { createDefaultLocalUserData } from '@/user/types';
import {
  createSignedPayload,
  extractVerifiedPayload,
  SignedPayload,
} from '@/match/lib/encoding';
import type { ClientMatch } from '@/match/types';

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
export async function saveUserData(
  userData: LocalUserData,
): Promise<SaveResult> {
  try {
    const signedPayload = await createSignedPayload(userData);
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(signedPayload));
    return { success: true };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
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

/**
 * Update user stats based on a new match (client-side)
 * This should be called after successfully saving a match to localStorage
 *
 * Updates incrementally (does not recalculate from match history):
 * - combinedScore: incremented by score + streakBonus
 * - matchesPlayed: incremented by 1
 * - lastMatchTimestamp: set to match timestamp
 * - dailyStreak: incremented if consecutive day, reset to 1 otherwise
 * - bestStreak: max of current bestStreak and new dailyStreak
 * - personalBestScore: max of current and new match score
 */
export async function updateUserStatsFromMatch(
  match: ClientMatch,
): Promise<SaveResult> {
  try {
    // Get current user data
    const userData = await getUserData();

    const finalScore = match.score + (match.streakBonus ?? 0);
    const lastMatchTimestamp = userData.lastMatchTimestamp;
    const currentDailyStreak = userData.dailyStreak;

    // Calculate new streak based on last match timestamp
    let newDailyStreak: number;
    if (lastMatchTimestamp === null) {
      // First match ever
      newDailyStreak = 1;
    } else {
      const lastMatchDate = new Date(lastMatchTimestamp);
      const todayDate = new Date(match.timestamp);

      // Normalize to start of day for comparison
      lastMatchDate.setHours(0, 0, 0, 0);
      todayDate.setHours(0, 0, 0, 0);

      const diffMs = todayDate.getTime() - lastMatchDate.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      if (diffDays === 0) {
        // Same day - keep current streak
        newDailyStreak = currentDailyStreak;
      } else if (diffDays === 1) {
        // Consecutive day - increment streak
        newDailyStreak = currentDailyStreak + 1;
      } else {
        // Streak broken - reset to 1
        newDailyStreak = 1;
      }
    }

    // Update stats
    const updatedData: LocalUserData = {
      combinedScore: userData.combinedScore + finalScore,
      matchesPlayed: userData.matchesPlayed + 1,
      lastMatchTimestamp: match.timestamp,
      dailyStreak: newDailyStreak,
      bestStreak: Math.max(userData.bestStreak, newDailyStreak),
      personalBestScore: Math.max(userData.personalBestScore, match.score),
    };

    return await saveUserData(updatedData);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('[UserClient] Error updating user stats:', errorMessage);
    return { success: false, error: errorMessage };
  }
}
