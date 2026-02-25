import {
  getNearbyPlayers as getNearbyPlayersAction,
  getTopPlayers as getTopPlayersAction,
  getUserStats as getUserStatsAction,
} from '@/app/actions/user';
import type { BaseUserStats } from '@/user/types';
import type {
  LeaderboardPlayer,
  NearbyPlayersResult,
  TopPlayersResult,
} from '@/app/actions/user';

export type { LeaderboardPlayer, NearbyPlayersResult, TopPlayersResult };

/**
 * Fetch user statistics from the server.
 *
 * @param userId - Authenticated user's uid
 * @returns User stats with defaults applied server-side
 */
export const getUserStats = async (userId: string): Promise<BaseUserStats> =>
  getUserStatsAction(userId);

/**
 * Fetch top leaderboard players.
 *
 * @returns Top players and total player count
 */
export const getTopPlayers = async (): Promise<TopPlayersResult> =>
  getTopPlayersAction();

/**
 * Fetch players surrounding the given user on the leaderboard.
 *
 * @param userId - Authenticated user's uid
 * @returns Nearby leaderboard slice around the current user
 */
export const getNearbyPlayers = async (
  userId: string,
): Promise<NearbyPlayersResult> => getNearbyPlayersAction(userId);
