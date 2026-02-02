/**
 * Match Validation
 *
 * Validation logic for match data and business logic.
 * Includes streak calculation and match processing.
 */

import { getUserStats } from '@/app/actions/user';
import { STREAK_BONUS_AMOUNT } from '@/game/util/constants';
import type { BaseMatch } from '@/match/types';
import { getUserData } from '@/user/lib/client';
import { wouldContinueStreak } from '@/user/lib/stats';

/**
 * Result of match validation
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate a Sudoku board is correctly solved
 * TODO: Implement full validation
 */
export function validateSudokuSolution(_board: string): boolean {
  // For now, return true - will be implemented later
  return true;
}

/**
 * Validate the score is reasonable for the given match
 * TODO: Implement score validation
 */
export function validateScore(_match: BaseMatch): boolean {
  // For now, return true - will be implemented later
  return true;
}

/**
 * Full match validation
 * Combines all validation checks
 */
export function validateMatch(_match: BaseMatch): ValidationResult {
  // For now, always return valid
  return {
    isValid: true,
    errors: [],
  };
}

/**
 * Calculate the streak bonus for a new match based on last match timestamp
 *
 * Rules:
 * - No previous match: 0 bonus (first day)
 * - Last match was yesterday: 200 bonus (continuing streak)
 * - Last match was before yesterday: 0 bonus (streak broken, starting fresh)
 *
 * @param lastMatchTimestamp - Timestamp of the last completed match (null if no previous match)
 * @returns The streak bonus to award for this match
 */
export function calculateStreakBonusForMatch(
  lastMatchTimestamp: number | null,
): number {
  // If no previous match, this is day 1 - no bonus
  if (!lastMatchTimestamp) {
    return 0;
  }

  // Check if this continues a streak (played yesterday)
  if (wouldContinueStreak(lastMatchTimestamp)) {
    return STREAK_BONUS_AMOUNT;
  }

  // Streak was broken - starting fresh
  return 0;
}

/**
 * Get the last match timestamp from the appropriate source
 * @param userId - User ID if logged in, null for anonymous users
 * @returns Promise resolving to the last match timestamp or null
 */
export async function getLastMatchTimestamp(
  userId: string | null,
): Promise<number | null> {
  if (userId) {
    // Logged-in user: get from server
    const stats = await getUserStats(userId);
    return stats?.lastMatchTimestamp ?? null;
  } else {
    // Anonymous user: get from localStorage
    const userData = await getUserData();
    return userData.lastMatchTimestamp;
  }
}

/**
 * Calculate streak bonus for a new match using the appropriate data source
 * This is the main entry point for calculating streak bonuses.
 *
 * @param userId - User ID if logged in, null for anonymous users
 * @returns Promise resolving to the streak bonus amount
 */
export async function getStreakBonusForNewMatch(
  userId: string | null,
): Promise<number> {
  const lastMatchTimestamp = await getLastMatchTimestamp(userId);
  return calculateStreakBonusForMatch(lastMatchTimestamp);
}
