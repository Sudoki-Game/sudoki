/**
 * Match Sync Module
 *
 * Handles uploading cached matches to the server.
 * Cached matches are created when a logged-in user's server save fails.
 *
 * This is a client-side module that uses server actions for server operations.
 */

import type { ClientMatch, ServerMatch } from '@/match/types';
import {
  getCachedMatches,
  clearCacheFlags,
  getMatchHistory,
  clearMatchHistory,
  getTodaysMatch,
} from './client';
import { clearUserData } from '@/user/lib/client';
import {
  hasMatchForDate,
  hasPlayedToday,
  saveMatch as saveMatchToServer,
} from '@/app/actions/match';
import { getUserStats } from '@/app/actions/user';
import { calculateStreakBonusForMatch, validateMatch } from './validation';

/**
 * Result of upload operation
 */
export interface UploadResult {
  success: boolean;
  uploaded: number;
  skipped: number;
  failed: number;
  error?: string;
}

/**
 * Upload a local match for today if it exists and is not already on the server.
 *
 * @param userId - The authenticated user's ID
 * @returns Upload result with counts
 */
export async function uploadTodaysLocalMatch(
  userId: string,
): Promise<UploadResult> {
  const result: UploadResult = {
    success: true,
    uploaded: 0,
    skipped: 0,
    failed: 0,
  };
  try {
    // Get local match for today
    const match = await getTodaysMatch();

    if (match === null || match === undefined) {
      console.log(`[MatchSync] No local match found for today to upload`);
      result.skipped++;
      return result;
    }

    // Validate match before uploading
    const validation = validateMatch(match);

    if (!validation.isValid) {
      console.error('[MatchSync] Invalid match detected:', {
        matchId: match.id,
        errors: validation.errors,
      });
      result.skipped++;
      return result;
    }

    if (validation.warnings.length > 0) {
      console.warn('[MatchSync] Match validation warnings:', {
        matchId: match.id,
        warnings: validation.warnings,
      });
    }

    // Check if server already has a match for today
    const alreadyExists = await hasPlayedToday(userId);

    if (alreadyExists) {
      console.log(
        `[MatchSync] Today's match ${match.id} skipped - server already has match for this date`,
      );
      result.skipped++;
      return result;
    }

    // Get last match timestamp for streak calculation
    const userStats = await getUserStats(userId);

    // Convert to ServerMatch (handles streak bonus calculation internally)
    const serverMatch = toServerMatch(
      match,
      userId,
      userStats.lastMatchTimestamp,
    );

    // Upload to server
    const saveResult = await saveMatchToServer(userId, serverMatch);

    if (saveResult.success) {
      console.log(`[MatchSync] Match ${match.id} uploaded successfully`);
      result.uploaded++;
    } else {
      console.warn(
        `[MatchSync] Match ${match.id} failed to upload: ${saveResult.error}`,
      );
      result.failed++;
    }

    // If all matches were uploaded successfully, clear localStorage
    // to avoid duplicate data (server is now source of truth)
    if (result.failed === 0) {
      console.log("[MatchSync] Today's match synced, clearing localStorage");
      clearMatchHistory();
      clearUserData();
    }

    result.success = result.failed === 0;
    return result;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('[MatchSync] Error during local match upload:', errorMessage);
    return {
      success: false,
      uploaded: result.uploaded,
      skipped: result.skipped,
      failed: result.failed,
      error: errorMessage,
    };
  }
}

/**
 * Upload all local matches to the server (for first-time login sync)
 * This uploads ALL matches from localStorage, not just cached ones.
 * Used when an anonymous user creates an account or logs in.
 *
 * @param userId - The authenticated user's ID
 * @returns Upload result with counts
 */
export async function uploadAllLocalMatches(
  userId: string,
): Promise<UploadResult> {
  const result: UploadResult = {
    success: true,
    uploaded: 0,
    skipped: 0,
    failed: 0,
  };

  try {
    // Get ALL local matches (not just cached ones)
    const localMatches = await getMatchHistory();

    if (localMatches.length === 0) {
      console.log('[MatchSync] No local matches to upload');
      return result;
    }

    console.log(
      `[MatchSync] Found ${localMatches.length} local matches to upload`,
    );

    // Get initial last match timestamp (efficient - just one field from user stats)
    const userStats = await getUserStats(userId);
    let lastMatchTimestamp = userStats.lastMatchTimestamp;

    for (const match of localMatches) {
      try {
        // Validate match before uploading
        const validation = validateMatch(match);

        if (!validation.isValid) {
          console.error('[MatchSync] Invalid match detected:', {
            matchId: match.id,
            errors: validation.errors,
          });
          result.skipped++;
          continue; // Skip this match, continue with others
        }

        if (validation.warnings.length > 0) {
          console.warn('[MatchSync] Match validation warnings:', {
            matchId: match.id,
            warnings: validation.warnings,
          });
        }

        // Check if server already has a match for this date
        const alreadyExists = await hasMatchForDate(userId, match.timestamp);

        if (alreadyExists) {
          console.log(
            `[MatchSync] Match ${match.id} skipped - server already has match for this date`,
          );
          result.skipped++;
          continue;
        }

        // Convert to ServerMatch (handles streak bonus calculation internally)
        const serverMatch = toServerMatch(match, userId, lastMatchTimestamp);

        // Upload to server
        const saveResult = await saveMatchToServer(userId, serverMatch);

        if (saveResult.success) {
          console.log(`[MatchSync] Match ${match.id} uploaded successfully`);
          result.uploaded++;
          // Update last match timestamp for next iteration
          lastMatchTimestamp = match.timestamp;
        } else {
          console.warn(
            `[MatchSync] Match ${match.id} failed to upload: ${saveResult.error}`,
          );
          result.failed++;
        }
      } catch (error) {
        console.error(`[MatchSync] Error uploading match ${match.id}:`, error);
        result.failed++;
      }
    }

    // If all matches were uploaded successfully, clear localStorage
    // to avoid duplicate data (server is now source of truth)
    if (result.failed === 0) {
      console.log(
        '[MatchSync] All local matches synced, clearing localStorage',
      );
      clearMatchHistory();
      clearUserData();
    }

    result.success = result.failed === 0;
    return result;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('[MatchSync] Error during local match upload:', errorMessage);
    return {
      success: false,
      uploaded: result.uploaded,
      skipped: result.skipped,
      failed: result.failed,
      error: errorMessage,
    };
  }
}

/**
 * Upload all cached matches to the server
 * Called automatically on page load for logged-in users
 *
 * @param userId - The authenticated user's ID
 * @returns Upload result with counts
 */
export async function uploadCachedMatches(
  userId: string,
): Promise<UploadResult> {
  const result: UploadResult = {
    success: true,
    uploaded: 0,
    skipped: 0,
    failed: 0,
  };

  try {
    // Get all cached matches
    const cachedMatches = await getCachedMatches();

    if (cachedMatches.length === 0) {
      return result;
    }

    console.log(
      `[MatchSync] Found ${cachedMatches.length} cached matches to upload`,
    );

    const successfullyUploaded: string[] = [];
    // Get initial last match timestamp (efficient - just one field from user stats)
    const userStats = await getUserStats(userId);
    let lastMatchTimestamp = userStats.lastMatchTimestamp;

    for (const match of cachedMatches) {
      try {
        // Validate match before uploading
        const validation = validateMatch(match);

        if (!validation.isValid) {
          console.error('[MatchSync] Invalid cached match detected:', {
            matchId: match.id,
            errors: validation.errors,
          });
          result.skipped++;
          // Still clear the cache flag since we don't want to keep retrying invalid matches
          successfullyUploaded.push(match.id);
          continue; // Skip this match, continue with others
        }

        if (validation.warnings.length > 0) {
          console.warn('[MatchSync] Cached match validation warnings:', {
            matchId: match.id,
            warnings: validation.warnings,
          });
        }

        // Check if server already has a match for this date
        const alreadyExists = await hasMatchForDate(userId, match.timestamp);

        if (alreadyExists) {
          console.log(
            `[MatchSync] Match ${match.id} skipped - server already has match for this date`,
          );
          result.skipped++;
          // Still clear the cache flag since we don't need to retry
          successfullyUploaded.push(match.id);
          continue;
        }

        // Convert to ServerMatch (handles streak bonus calculation and isCached removal internally)
        const serverMatch = toServerMatch(match, userId, lastMatchTimestamp);

        // Upload to server
        const saveResult = await saveMatchToServer(userId, serverMatch);

        if (saveResult.success) {
          console.log(`[MatchSync] Match ${match.id} uploaded successfully`);
          result.uploaded++;
          successfullyUploaded.push(match.id);
          // Update last match timestamp for next iteration
          lastMatchTimestamp = match.timestamp;
        } else {
          console.warn(
            `[MatchSync] Match ${match.id} failed to upload: ${saveResult.error}`,
          );
          result.failed++;
        }
      } catch (error) {
        console.error(`[MatchSync] Error uploading match ${match.id}:`, error);
        result.failed++;
      }
    }

    // Clear cache flags for successfully processed matches
    if (successfullyUploaded.length > 0) {
      await clearCacheFlags(successfullyUploaded);
    }

    result.success = result.failed === 0;
    return result;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('[MatchSync] Error during cache upload:', errorMessage);
    return {
      success: false,
      uploaded: result.uploaded,
      skipped: result.skipped,
      failed: result.failed,
      error: errorMessage,
    };
  }
}

/**
 * Convert a ClientMatch to ServerMatch for upload
 * Handles streak bonus calculation and validation
 *
 * @param match - The client match to convert
 * @param userId - The user ID
 * @param lastMatchTimestamp - Timestamp of the last match before this one (for streak calculation)
 * @returns ServerMatch ready for upload
 */
export function toServerMatch(
  match: ClientMatch,
  userId: string,
  lastMatchTimestamp: number | null,
): ServerMatch {
  // Calculate correct streak bonus based on last match timestamp
  const correctStreakBonus = calculateStreakBonusForMatch(lastMatchTimestamp);

  // Remove client-only fields and add server fields
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { isCached: _isCached, ...baseMatch } = match;

  return {
    ...baseMatch,
    userPlayed: userId,
    streakBonus: correctStreakBonus,
  };
}
