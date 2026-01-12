'use server';

/**
 * User Server Actions
 *
 * Server actions for user operations that need firebase-admin.
 * These are called from client components via RPC.
 */

import { serverDb } from '@/lib/firebase/server';
import type { BaseUserStats } from '@/user/types';
import { createDefaultBaseUserStats } from '@/user/types';

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
      lastMatchTimestamp: data.lastMatchTimestamp
    };
  } catch (error) {
    console.error('[UserActions] Error getting user stats:', error);
    return createDefaultBaseUserStats();
  }
}
