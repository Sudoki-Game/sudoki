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
export async function uploadTodaysLocalMatch(userId: string): Promise<UploadResult> {
  const result: UploadResult = {
    success: true,
    uploaded: 0,
    skipped: 0,
    failed: 0,
  };
  try {
    // Get local match for today
    const match = await getTodaysMatch();

    if (match == null) {
      console.log(`[MatchSync] No local match found for today to upload`);
      result.failed++;
      return result;
    }

    // Check if server already has a match for today
    const alreadyExists = await hasPlayedToday(userId);

    if (alreadyExists) {
      console.log(
        `[MatchSync] Todays match ${match.id} skipped - server already has match for this date`,
      );
      result.skipped++;
      return result;
    }

    // Convert to ServerMatch
    const serverMatch = toServerMatch(match, userId);

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
      console.log(
        '[MatchSync] Todays match synced, clearing localStorage',
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

    for (const match of localMatches) {
      try {
        // Check if server already has a match for this date
        const alreadyExists = await hasMatchForDate(userId, match.timestamp);

        if (alreadyExists) {
          console.log(
            `[MatchSync] Match ${match.id} skipped - server already has match for this date`,
          );
          result.skipped++;
          continue;
        }

        // Convert to ServerMatch
        const serverMatch = toServerMatch(match, userId);

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

    for (const match of cachedMatches) {
      try {
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

        // Convert to ServerMatch
        const serverMatch: ServerMatch = {
          ...match,
          userPlayed: userId,
        };
        // Remove client-only isCached property
        delete (serverMatch as ClientMatch).isCached;

        // Upload to server
        const saveResult = await saveMatchToServer(userId, serverMatch);

        if (saveResult.success) {
          console.log(`[MatchSync] Match ${match.id} uploaded successfully`);
          result.uploaded++;
          successfullyUploaded.push(match.id);
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
 */
export function toServerMatch(match: ClientMatch, userId: string): ServerMatch {
  // Remove client-only fields and add server fields
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { isCached: _isCached, ...baseMatch } = match;
  return {
    ...baseMatch,
    userPlayed: userId,
  };
}
