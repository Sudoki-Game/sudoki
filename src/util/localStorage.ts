/**
 * Local storage utilities for managing last match data and user stats
 */

import type { MatchData } from '@/game/types';
import type { LocalUserData } from '@/types/auth';

const LAST_MATCH_KEY = 'sudoku_last_match';
const LOCAL_USER_STATS_KEY = 'sudoku_user_stats';

/**
 * Save the last match to local storage
 */
export function saveLastMatch(matchData: MatchData): void {
  try {
    localStorage.setItem(LAST_MATCH_KEY, JSON.stringify(matchData));
  } catch (error) {
    console.error('[LocalStorage] Error saving last match:', error);
  }
}

/**
 * Get the last match from local storage
 */
export function getLastMatch(): MatchData | null {
  try {
    const data = localStorage.getItem(LAST_MATCH_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('[LocalStorage] Error getting last match:', error);
    return null;
  }
}

/**
 * Clear the last match from local storage
 */
export function clearLastMatch(): void {
  try {
    localStorage.removeItem(LAST_MATCH_KEY);
  } catch (error) {
    console.error('[LocalStorage] Error clearing last match:', error);
  }
}

/**
 * Check if the last match is from today
 */
export function isLastMatchFromToday(timestamp: number): boolean {
  const lastMatchDate = new Date(timestamp);
  const today = new Date();

  const lastMatchDateOnly = new Date(
    lastMatchDate.getFullYear(),
    lastMatchDate.getMonth(),
    lastMatchDate.getDate()
  );
  const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  return lastMatchDateOnly.getTime() === todayDateOnly.getTime();
}

/**
 * Get local user stats for unauthenticated users
 */
export function getLocalUserData(): LocalUserData {
  try {
    const data = localStorage.getItem(LOCAL_USER_STATS_KEY);
    if (data) {
      return JSON.parse(data);
    }
    // Return default stats if none exist
    return {
      combinedScore: 0,
      dailyStreak: 0,
      bestStreak: 0,
      matchesPlayed: 0,
      personalBestScore: 0,
      lastMatchTimestamp: null
    };
  } catch (error) {
    console.error('[LocalStorage] Error getting local user stats:', error);
    return {
      combinedScore: 0,
      dailyStreak: 0,
      bestStreak: 0,
      matchesPlayed: 0,
      personalBestScore: 0,
      lastMatchTimestamp: null
    };
  }
}

/**
 * Save local user stats for unauthenticated users
 */
export function saveLocalUserData(stats: LocalUserData): void {
  try {
    localStorage.setItem(LOCAL_USER_STATS_KEY, JSON.stringify(stats));
  } catch (error) {
    console.error('[LocalStorage] Error saving local user stats:', error);
  }
}

/**
 * Clear local user stats
 */
export function clearLocalUserData(): void {
  try {
    localStorage.removeItem(LOCAL_USER_STATS_KEY);
  } catch (error) {
    console.error('[LocalStorage] Error clearing local user stats:', error);
  }
}

/**
 * Unified function to get the current match data
 * Always returns from localStorage (both authenticated and unauthenticated store there)
 */
export function getCurrentMatch(): MatchData | null {
  return getLastMatch();
}
