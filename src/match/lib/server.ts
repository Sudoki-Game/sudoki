/**
 * Match Server - Firestore operations
 *
 * Server-side operations for match data using Firebase Admin SDK.
 * These functions are meant to be called from server actions or API routes.
 */

import { serverDb } from '@/firebase/server';
import type { ServerMatch, SaveMatchResult } from '@/match/types';
import { isMatchFromToday } from '@/match/types';
import { FieldValue } from 'firebase-admin/firestore';
import { validateMatch } from './validation';

/** Firestore collection name for matches */
export const MATCHES_COLLECTION = 'matches';
/** Firestore collection name for per-user daily match locks */
export const DAILY_MATCH_LOCKS_COLLECTION = 'daily_match_locks';

const MATCH_ALREADY_EXISTS_FOR_DAY = 'MATCH_ALREADY_EXISTS_FOR_DAY';

interface DailyMatchLock {
  userId: string;
  dayKey: string;
  matchId: string;
  timestamp: number;
}

const getDayKeyFromTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Save a match to Firestore
 * Uses a conditional write to prevent race conditions (TOCTOU protection)
 *
 * @param userId - The user ID who played the match
 * @param match - The match data to save
 * @returns Save result indicating success or failure
 */
export async function saveMatch(
  userId: string,
  match: ServerMatch,
): Promise<SaveMatchResult> {
  try {
    // Validate match data
    const validation = validateMatch(match);
    if (!validation.isValid) {
      const errorDetails = validation.errors
        .map((e) => `${e.field}: ${e.message}`)
        .join('; ');
      console.error('[MatchServer] Match validation failed:', {
        matchId: match.id,
        errors: validation.errors,
      });
      return { success: false, error: `Invalid match data: ${errorDetails}` };
    }

    if (validation.warnings.length > 0) {
      console.warn('[MatchServer] Match validation warnings:', {
        matchId: match.id,
        warnings: validation.warnings,
      });
    }

    // Ensure userPlayed matches the authenticated user
    if (match.userPlayed !== userId) {
      return { success: false, error: 'User ID mismatch' };
    }

    const dayKey = getDayKeyFromTimestamp(match.timestamp);
    const dailyLockId = `${userId}_${dayKey}`;
    const matchRef = serverDb.collection(MATCHES_COLLECTION).doc(match.id);
    const dailyLockRef = serverDb
      .collection(DAILY_MATCH_LOCKS_COLLECTION)
      .doc(dailyLockId);

    let shouldUpdateStats = false;

    await serverDb.runTransaction(async (transaction) => {
      const existingLock = await transaction.get(dailyLockRef);

      if (existingLock.exists) {
        const existingData = existingLock.data() as DailyMatchLock | undefined;

        // Idempotent retry of the same match write (e.g. client retry after timeout).
        if (existingData?.matchId === match.id) {
          return;
        }

        throw new Error(MATCH_ALREADY_EXISTS_FOR_DAY);
      }

      transaction.set(matchRef, match);
      transaction.set(dailyLockRef, {
        userId,
        dayKey,
        matchId: match.id,
        timestamp: match.timestamp,
      } satisfies DailyMatchLock);

      shouldUpdateStats = true;
    });

    // Duplicate retries of the same match are accepted as no-ops.
    if (!shouldUpdateStats) {
      return { success: true };
    }

    // Update user stats after successful save
    try {
      await updateUserStatsFromMatch(userId, match, match.streakBonus);
    } catch (statsError) {
      console.warn('[MatchServer] Failed to update user stats:', statsError);
      // Don't fail the match save if stats update fails
    }

    return { success: true };
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === MATCH_ALREADY_EXISTS_FOR_DAY
    ) {
      return { success: false, error: 'Match already exists for today' };
    }

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('[MatchServer] Error saving match:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Get a specific match by ID
 */
export async function getMatch(matchId: string): Promise<ServerMatch | null> {
  try {
    const matchRef = serverDb.collection(MATCHES_COLLECTION).doc(matchId);
    const matchDoc = await matchRef.get();

    if (!matchDoc.exists) {
      return null;
    }

    return matchDoc.data() as ServerMatch;
  } catch (error) {
    console.error('[MatchServer] Error getting match:', error);
    return null;
  }
}

/**
 * Get today's match for a user
 */
export async function getTodaysMatch(
  userId: string,
): Promise<ServerMatch | null> {
  try {
    const userMatchesRef = serverDb
      .collection(MATCHES_COLLECTION)
      .where('userPlayed', '==', userId)
      .orderBy('timestamp', 'desc')
      .limit(10); // Get recent matches to check for today's

    const querySnapshot = await userMatchesRef.get();

    for (const doc of querySnapshot.docs) {
      const match = doc.data() as ServerMatch;
      if (isMatchFromToday(match.timestamp)) {
        return match;
      }
    }

    return null;
  } catch (error) {
    console.error("[MatchServer] Error getting today's match:", error);
    return null;
  }
}

/**
 * Check if user has played today
 */
export async function hasPlayedToday(userId: string): Promise<boolean> {
  const todaysMatch = await getTodaysMatch(userId);
  return todaysMatch !== null;
}

/**
 * Check if user has a match for a specific date
 * Used to verify cached matches before uploading
 */
export async function hasMatchForDate(
  userId: string,
  timestamp: number,
): Promise<boolean> {
  try {
    const matchDate = new Date(timestamp);
    const userMatchesRef = serverDb
      .collection(MATCHES_COLLECTION)
      .where('userPlayed', '==', userId)
      .orderBy('timestamp', 'desc')
      .limit(30); // Check recent matches

    const querySnapshot = await userMatchesRef.get();

    for (const doc of querySnapshot.docs) {
      const match = doc.data() as ServerMatch;
      const docDate = new Date(match.timestamp);
      if (
        docDate.getFullYear() === matchDate.getFullYear() &&
        docDate.getMonth() === matchDate.getMonth() &&
        docDate.getDate() === matchDate.getDate()
      ) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('[MatchServer] Error checking match for date:', error);
    return false;
  }
}

/**
 * Get match history for a user
 * Returns matches sorted by timestamp ascending
 */
export async function getMatchHistory(userId: string): Promise<ServerMatch[]> {
  try {
    const userMatchesRef = serverDb
      .collection(MATCHES_COLLECTION)
      .where('userPlayed', '==', userId);

    const querySnapshot = await userMatchesRef.get();

    // Sort in code to avoid requiring a composite index
    const matches = querySnapshot.docs.map((doc) => doc.data() as ServerMatch);
    return matches.sort((a, b) => a.timestamp - b.timestamp);
  } catch (error) {
    console.error('[MatchServer] Error getting match history:', error);
    return [];
  }
}

/**
 * Save multiple matches (used for transferring local data to server)
 * Uses a batch write for atomicity
 */
export async function saveMatchBatch(
  userId: string,
  matches: ServerMatch[],
): Promise<SaveMatchResult> {
  try {
    const batch = serverDb.batch();

    for (const match of matches) {
      // Ensure all matches belong to this user
      if (match.userPlayed !== userId) {
        return { success: false, error: 'User ID mismatch in batch' };
      }

      const matchRef = serverDb.collection(MATCHES_COLLECTION).doc(match.id);
      batch.set(matchRef, match);
    }

    await batch.commit();
    return { success: true };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('[MatchServer] Error saving match batch:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Update user stats based on a new match
 * This should be called after successfully saving a match
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
  userId: string,
  match: ServerMatch,
  streakBonus: number = 0,
): Promise<void> {
  try {
    const userRef = serverDb.collection('users').doc(userId);
    const finalScore = match.score + streakBonus;

    // Get current user data
    const userDoc = await userRef.get();
    const userData = userDoc.exists ? userDoc.data() : null;

    const currentBestStreak = userData?.bestStreak ?? 0;
    const currentPersonalBestScore = userData?.personalBestScore ?? 0;
    const lastMatchTimestamp = userData?.lastMatchTimestamp ?? null;
    const currentDailyStreak = userData?.dailyStreak ?? 0;

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

    const newBestStreak = Math.max(currentBestStreak, newDailyStreak);

    await userRef.update({
      combinedScore: FieldValue.increment(finalScore),
      matchesPlayed: FieldValue.increment(1),
      lastMatchTimestamp: match.timestamp,
      dailyStreak: newDailyStreak,
      bestStreak: newBestStreak,
      personalBestScore: Math.max(currentPersonalBestScore, match.score),
    });
  } catch (error) {
    console.error('[MatchServer] Error updating user stats:', error);
    throw error;
  }
}

/**
 * Delete all matches for a user
 * Used when deleting a user account
 */
export async function deleteUserMatches(userId: string): Promise<boolean> {
  try {
    const userMatchesRef = serverDb
      .collection(MATCHES_COLLECTION)
      .where('userPlayed', '==', userId);

    const querySnapshot = await userMatchesRef.get();

    if (querySnapshot.empty) {
      return true; // No matches to delete
    }

    // Use batch delete for efficiency
    const batch = serverDb.batch();
    querySnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    return true;
  } catch (error) {
    console.error('[MatchServer] Error deleting user matches:', error);
    return false;
  }
}
