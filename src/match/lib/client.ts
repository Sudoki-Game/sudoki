/**
 * Match Client - localStorage operations
 *
 * Handles saving and retrieving match data from localStorage with HMAC tamper detection.
 * All data is signed before storage and verified on retrieval.
 */

import type { ClientMatch, SaveMatchResult } from '@/match/types';
import { isMatchFromToday } from '@/match/types';
import { createSignedPayload, extractVerifiedPayload, SignedPayload } from './encoding';

/** localStorage key for match history */
export const MATCH_HISTORY_KEY = 'sudoku_match_history';

/**
 * Options for saving a match
 */
export interface SaveMatchOptions {
  /** Mark match as cached (for failed server saves) */
  isCached?: boolean;
}

/**
 * Save a match to localStorage
 * Adds the match to the existing history and re-signs the entire history
 */
export async function saveMatch(
  match: ClientMatch,
  options?: SaveMatchOptions
): Promise<SaveMatchResult> {
  try {
    // Get existing history
    const history = await getMatchHistory();

    // Apply cache flag if specified
    const matchToSave: ClientMatch = options?.isCached
      ? { ...match, isCached: true }
      : match;

    // Add new match
    history.push(matchToSave);

    // Sort by timestamp ascending
    history.sort((a, b) => a.timestamp - b.timestamp);

    // Sign and save
    const signedPayload = await createSignedPayload(history);
    localStorage.setItem(MATCH_HISTORY_KEY, JSON.stringify(signedPayload));

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[MatchClient] Error saving match:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Get a specific match by ID
 */
export async function getMatch(id: string): Promise<ClientMatch | null> {
  const history = await getMatchHistory();
  return history.find((match) => match.id === id) ?? null;
}

/**
 * Get today's match if it exists
 * Returns the most recent match from today
 */
export async function getTodaysMatch(): Promise<ClientMatch | null> {
  const history = await getMatchHistory();

  // Filter to today's matches and get the most recent
  const todaysMatches = history.filter((match) => isMatchFromToday(match.timestamp));

  if (todaysMatches.length === 0) {
    return null;
  }

  // Return the most recent (last in sorted array)
  return todaysMatches[todaysMatches.length - 1];
}

/**
 * Check if the user has played today
 */
export async function hasPlayedToday(): Promise<boolean> {
  const todaysMatch = await getTodaysMatch();
  return todaysMatch !== null;
}

/**
 * Get all match history
 * Returns empty array if no matches or if tampering is detected
 */
export async function getMatchHistory(): Promise<ClientMatch[]> {
  try {
    const storedData = localStorage.getItem(MATCH_HISTORY_KEY);
    if (!storedData) {
      return [];
    }

    const signedPayload: SignedPayload = JSON.parse(storedData);
    const history = await extractVerifiedPayload<ClientMatch[]>(signedPayload);

    if (history === null) {
      // Tampering detected or invalid data - clear and return empty
      console.warn('[MatchClient] Invalid or tampered match history detected');
      return [];
    }

    return history;
  } catch (error) {
    console.error('[MatchClient] Error reading match history:', error);
    return [];
  }
}

/**
 * Clear all match history from localStorage
 */
export function clearMatchHistory(): void {
  localStorage.removeItem(MATCH_HISTORY_KEY);
}

/**
 * Get all cached matches (matches with isCached flag)
 * These are matches that failed to save to server and need to be uploaded
 */
export async function getCachedMatches(): Promise<ClientMatch[]> {
  const history = await getMatchHistory();
  return history.filter((match) => match.isCached === true);
}

/**
 * Clear the cache flag for a specific match after successful upload
 * This keeps the match in history but marks it as successfully synced
 */
export async function clearCacheFlag(matchId: string): Promise<void> {
  const history = await getMatchHistory();
  const updatedHistory = history.map((match) =>
    match.id === matchId ? { ...match, isCached: undefined } : match
  );

  // Re-sign and save
  const signedPayload = await createSignedPayload(updatedHistory);
  localStorage.setItem(MATCH_HISTORY_KEY, JSON.stringify(signedPayload));
}

/**
 * Clear cache flags for multiple matches after successful batch upload
 */
export async function clearCacheFlags(matchIds: string[]): Promise<void> {
  const history = await getMatchHistory();
  const idSet = new Set(matchIds);
  const updatedHistory = history.map((match) =>
    idSet.has(match.id) ? { ...match, isCached: undefined } : match
  );

  // Re-sign and save
  const signedPayload = await createSignedPayload(updatedHistory);
  localStorage.setItem(MATCH_HISTORY_KEY, JSON.stringify(signedPayload));
}
