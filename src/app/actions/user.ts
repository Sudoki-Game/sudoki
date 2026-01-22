'use server';

/**
 * User Server Actions
 *
 * Server actions for user operations that need firebase-admin.
 * These are called from client components via RPC.
 */

import { serverDb } from '@/firebase/server';
import type { BaseUserStats } from '@/user/types';
import { createDefaultBaseUserStats } from '@/user/types';

/**
 * Leaderboard player entry
 */
export interface LeaderboardPlayer {
  rank: number;
  displayName: string;
  combinedScore: number;
  matchesPlayed: number;
  dailyStreak: number;
}

/**
 * Result for top players query
 */
export interface TopPlayersResult {
  players: LeaderboardPlayer[];
  totalPlayers: number;
}

/**
 * Result for players around the current user
 */
export interface NearbyPlayersResult {
  above: LeaderboardPlayer[];
  current: LeaderboardPlayer | null;
  below: LeaderboardPlayer[];
  totalPlayers: number;
}

/**
 * Get user stats from the server
 * Returns the stats portion of user data (without PII like email)
 */
export async function getUserStats(userId: string): Promise<BaseUserStats> {
  try {
    const userRef = serverDb.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return createDefaultBaseUserStats();
    }

    const data = userDoc.data() as BaseUserStats;

    return {
      combinedScore: data.combinedScore,
      dailyStreak: data.dailyStreak,
      bestStreak: data.bestStreak,
      matchesPlayed: data.matchesPlayed,
      personalBestScore: data.personalBestScore,
      lastMatchTimestamp: data.lastMatchTimestamp,
    };
  } catch (error) {
    console.error('[UserActions] Error getting user stats:', error);
    return createDefaultBaseUserStats();
  }
}

/**
 * Get the top 3 players by combined score
 */
export async function getTopPlayers(): Promise<TopPlayersResult> {
  try {
    const usersRef = serverDb
      .collection('users')
      .orderBy('combinedScore', 'desc')
      .limit(3);

    const [snapshot, totalSnapshot] = await Promise.all([
      usersRef.get(),
      serverDb.collection('users').count().get(),
    ]);

    const players = snapshot.docs.map((doc, index) => {
      const data = doc.data();
      return {
        rank: index + 1,
        displayName: data.displayName,
        combinedScore: data.combinedScore,
        matchesPlayed: data.matchesPlayed,
        dailyStreak: data.dailyStreak,
      };
    });

    return {
      players,
      totalPlayers: totalSnapshot.data().count,
    };
  } catch (error) {
    console.error('[UserActions] Error getting top players:', error);
    return { players: [], totalPlayers: 0 };
  }
}

/**
 * Get players around the current user (3 above and 3 below)
 */
export async function getNearbyPlayers(
  userId: string,
): Promise<NearbyPlayersResult> {
  try {
    // First, get the current user's score
    const userRef = serverDb.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return { above: [], current: null, below: [], totalPlayers: 0 };
    }

    const userData = userDoc.data()!;
    const userScore = userData.combinedScore;

    // Get players with higher scores (above the user)
    const aboveSnapshot = await serverDb
      .collection('users')
      .orderBy('combinedScore', 'asc')
      .where('combinedScore', '>', userScore)
      .limit(3)
      .get();

    // Get players with lower scores (below the user)
    const belowSnapshot = await serverDb
      .collection('users')
      .orderBy('combinedScore', 'desc')
      .where('combinedScore', '<', userScore)
      .limit(3)
      .get();

    // Count how many players are above the current user for rank calculation
    const [rankSnapshot, totalSnapshot] = await Promise.all([
      serverDb
        .collection('users')
        .where('combinedScore', '>', userScore)
        .count()
        .get(),
      serverDb.collection('users').count().get(),
    ]);

    const currentRank = rankSnapshot.data().count + 1;
    const totalPlayers = totalSnapshot.data().count;

    // Build above list
    // Query returns ascending by score, so first doc has lowest score (closest to user)
    // We want to display highest rank first (lowest number), so reverse for display
    // Ranks: if currentRank is 3 and we have 2 players above, they are rank 2 and rank 1
    const above: LeaderboardPlayer[] = aboveSnapshot.docs
      .map((doc, index) => {
        const data = doc.data();
        // index 0 = closest to user = rank (currentRank - 1)
        // index 1 = next up = rank (currentRank - 2)
        return {
          rank: currentRank - (index + 1),
          displayName: data.displayName,
          combinedScore: data.combinedScore,
          matchesPlayed: data.matchesPlayed,
          dailyStreak: data.dailyStreak,
        };
      })
      .sort((a, b) => a.rank - b.rank); // Sort by rank ascending (1, 2, 3...)

    // Current user
    const current: LeaderboardPlayer = {
      rank: currentRank,
      displayName: userData.displayName,
      combinedScore: userData.combinedScore,
      matchesPlayed: userData.matchesPlayed,
      dailyStreak: userData.dailyStreak,
    };

    // Build below list
    const below: LeaderboardPlayer[] = belowSnapshot.docs.map((doc, index) => {
      const data = doc.data();
      return {
        rank: currentRank + index + 1,
        displayName: data.displayName,
        combinedScore: data.combinedScore,
        matchesPlayed: data.matchesPlayed,
        dailyStreak: data.dailyStreak,
      };
    });

    return { above, current, below, totalPlayers };
  } catch (error) {
    console.error('[UserActions] Error getting nearby players:', error);
    return { above: [], current: null, below: [], totalPlayers: 0 };
  }
}
