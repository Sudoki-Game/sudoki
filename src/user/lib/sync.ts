/**
 * Sync Module
 *
 * Handles synchronization between local and server data.
 * Used for:
 * - Transferring local data to server on account creation
 * - Merging data on login when there's existing data on both sides
 */

import type { ClientMatch } from '@/match/types';
import type { BaseUserStats } from '@/user/types';
import { calculateStatsFromMatches, mergeMatchHistories } from './stats';
import { MATCH_HISTORY_KEY } from '@/match/lib/client';
import { USER_DATA_KEY } from '@/user/lib/client';

/**
 * Data prepared for transfer to server
 */
export interface TransferData {
  matches: ClientMatch[];
  recalculatedStats: BaseUserStats;
}

/**
 * Result of a transfer operation
 */
export interface TransferResult {
  success: boolean;
  error?: string;
  matchesTransferred: number;
}

/**
 * Result of merging local and server data
 */
export interface MergeResult {
  mergedMatches: ClientMatch[];
  recalculatedStats: BaseUserStats;
}

/**
 * Prepare local match history for transfer to server
 * Recalculates all stats from match history
 */
export function prepareTransferData(matchHistory: ClientMatch[]): TransferData {
  // Sort matches by timestamp
  const sortedMatches = [...matchHistory].sort(
    (a, b) => a.timestamp - b.timestamp,
  );

  // Recalculate stats from match history
  const recalculatedStats = calculateStatsFromMatches(sortedMatches);

  return {
    matches: sortedMatches,
    recalculatedStats,
  };
}

/**
 * Merge local and server match histories
 * Server data takes precedence on conflicts
 * Stats are recalculated from merged history
 */
export function mergeWithServerData(
  localMatches: ClientMatch[],
  serverMatches: ClientMatch[],
): MergeResult {
  // Merge histories (server takes precedence)
  const mergedMatches = mergeMatchHistories(localMatches, serverMatches);

  // Recalculate all stats from merged history
  const recalculatedStats = calculateStatsFromMatches(mergedMatches);

  return {
    mergedMatches,
    recalculatedStats,
  };
}

/**
 * Clear local data after successful transfer
 * Called after data has been successfully saved to server
 */
export function clearLocalDataAfterTransfer(): void {
  try {
    localStorage.removeItem(MATCH_HISTORY_KEY);
    localStorage.removeItem(USER_DATA_KEY);
  } catch (error) {
    // Silently fail - localStorage might not be available
    console.warn('[Sync] Failed to clear local data:', error);
  }
}

/**
 * Check if there is local data that needs to be transferred
 */
export function hasLocalDataToTransfer(): boolean {
  try {
    const matchData = localStorage.getItem(MATCH_HISTORY_KEY);
    const userData = localStorage.getItem(USER_DATA_KEY);
    return matchData !== null || userData !== null;
  } catch {
    return false;
  }
}
