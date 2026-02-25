import {
  getMatchHistory as getMatchHistoryAction,
  getTodaysMatch as getTodaysMatchAction,
  hasMatchForDate as hasMatchForDateAction,
  hasPlayedToday as hasPlayedTodayAction,
  saveMatch as saveMatchAction,
} from '@/app/actions/match';
import type { ServerMatch } from '@/match/types';

/**
 * Check whether a user has a match for the provided timestamp date.
 *
 * @param userId - Authenticated user's uid
 * @param timestamp - Match timestamp to check date membership
 * @returns Whether a match exists for that date
 */
export const hasMatchForDate = async (
  userId: string,
  timestamp: number,
): Promise<boolean> => hasMatchForDateAction(userId, timestamp);

/**
 * Check whether a user has already played today.
 *
 * @param userId - Authenticated user's uid
 * @returns Whether today's match exists on the server
 */
export const hasPlayedToday = async (userId: string): Promise<boolean> =>
  hasPlayedTodayAction(userId);

/**
 * Save a completed match to the server.
 *
 * @param userId - Authenticated user's uid
 * @param match - Server-ready match payload
 * @returns Save status and optional error
 */
export const saveMatch = async (
  userId: string,
  match: ServerMatch,
): Promise<{ success: boolean; error?: string }> =>
  saveMatchAction(userId, match);

/**
 * Fetch today's match for a user.
 *
 * @param userId - Authenticated user's uid
 * @returns Server match for today, or null if none exists
 */
export const getTodaysMatch = async (
  userId: string,
): Promise<ServerMatch | null> => getTodaysMatchAction(userId);

/**
 * Fetch match history for a user.
 *
 * @param userId - Authenticated user's uid
 * @returns Full server match history for the user
 */
export const getMatchHistory = async (
  userId: string,
): Promise<ServerMatch[]> => getMatchHistoryAction(userId);
