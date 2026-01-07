/**
 * Match Server - Firestore operations
 *
 * Server-side operations for match data using Firebase Admin SDK.
 * These functions are meant to be called from server actions or API routes.
 */

import { serverDb } from '@/lib/firebase/server';
import type { ServerMatch, SaveMatchResult } from '@/match/types';
import { isMatchFromToday } from '@/match/types';
import { FieldValue } from 'firebase-admin/firestore';

/** Firestore collection name for matches */
export const MATCHES_COLLECTION = 'matches';

/**
 * Validate match data before saving
 * For now, returns true - will be implemented later with full validation
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function validateMatch(_match: ServerMatch): boolean {
  // TODO: Implement full validation (board validation, score validation, etc.)
  return true;
}

/**
 * Save a match to Firestore
 * Uses a conditional write to prevent race conditions (TOCTOU protection)
 *
 * @param userId - The user ID who played the match
 * @param match - The match data to save
 * @returns Save result indicating success or failure
 */
export async function saveMatch(userId: string, match: ServerMatch): Promise<SaveMatchResult> {
  try {
    // Validate match data
    if (!validateMatch(match)) {
      return { success: false, error: 'Invalid match data' };
    }

    // Ensure userPlayed matches the authenticated user
    if (match.userPlayed !== userId) {
      return { success: false, error: 'User ID mismatch' };
    }

    // Check if user already has a match for today using conditional write
    const userMatchesRef = serverDb
      .collection(MATCHES_COLLECTION)
      .where('userPlayed', '==', userId);

    const existingMatches = await userMatchesRef.get();
    const todaysMatch = existingMatches.docs.find((doc) => {
      const data = doc.data() as ServerMatch;
      return isMatchFromToday(data.timestamp);
    });

    if (todaysMatch) {
      // Check timestamp to prevent race condition
      const existingTimestamp = (todaysMatch.data() as ServerMatch).timestamp;
      if (match.timestamp <= existingTimestamp) {
        return { success: false, error: 'Match already exists for today' };
      }
    }

    // Save the match
    const matchRef = serverDb.collection(MATCHES_COLLECTION).doc(match.id);
    await matchRef.set(match);

    // Update user stats after successful save
    try {
      await updateUserStatsFromMatch(userId, match, match.streakBonus);
    } catch (statsError) {
      console.warn('[MatchServer] Failed to update user stats:', statsError);
      // Don't fail the match save if stats update fails
    }

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
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
export async function getTodaysMatch(userId: string): Promise<ServerMatch | null> {
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
    console.error('[MatchServer] Error getting today\'s match:', error);
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
export async function hasMatchForDate(userId: string, timestamp: number): Promise<boolean> {
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
  matches: ServerMatch[]
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[MatchServer] Error saving match batch:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Update user stats based on a new match
 * This should be called after successfully saving a match
 */
export async function updateUserStatsFromMatch(
  userId: string,
  match: ServerMatch,
  streakBonus: number = 0
): Promise<void> {
  try {
    const userRef = serverDb.collection('users').doc(userId);
    const finalScore = match.score + streakBonus;

    await userRef.update({
      combinedScore: FieldValue.increment(finalScore),
      matchesPlayed: FieldValue.increment(1),
      lastMatchTimestamp: match.timestamp
    });
  } catch (error) {
    console.error('[MatchServer] Error updating user stats:', error);
    throw error;
  }
}
