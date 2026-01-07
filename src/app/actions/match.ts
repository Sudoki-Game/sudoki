'use server';

/**
 * Match Server Actions
 *
 * Server actions for match operations that need firebase-admin.
 * These are called from client components via RPC.
 */

import { 
  hasMatchForDate as hasMatchForDateServer, 
  saveMatch as saveMatchServer,
  getTodaysMatch as getTodaysMatchServer,
  hasPlayedToday as hasPlayedTodayServer,
  getMatchHistory as getMatchHistoryServer
} from '@/match/lib/server';
import type { ServerMatch } from '@/match/types';

/**
 * Check if user has a match for a specific date
 */
export async function hasMatchForDate(userId: string, timestamp: number): Promise<boolean> {
  return hasMatchForDateServer(userId, timestamp);
}

/**
 * Save a match to the server
 */
export async function saveMatch(userId: string, match: ServerMatch): Promise<{ success: boolean; error?: string }> {
  return saveMatchServer(userId, match);
}

/**
 * Get today's match for a user from the server
 */
export async function getTodaysMatch(userId: string): Promise<ServerMatch | null> {
  return getTodaysMatchServer(userId);
}

/**
 * Check if user has played today (server-side)
 */
export async function hasPlayedToday(userId: string): Promise<boolean> {
  return hasPlayedTodayServer(userId);
}

/**
 * Get match history for a user
 */
export async function getMatchHistory(userId: string): Promise<ServerMatch[]> {
  return getMatchHistoryServer(userId);
}
