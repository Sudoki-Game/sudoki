/**
 * Stats Calculation
 *
 * Utilities for calculating user stats from match history.
 * Used for recalculating stats during sync/merge operations.
 */

import type { BaseMatch } from '@/match/types';
import type { BaseUserStats } from '@/user/types';

/**
 * Streak bonus amount for continuing a streak
 */
const STREAK_BONUS_AMOUNT = 200;

/**
 * Get the date-only portion of a timestamp for comparison
 */
function getDateOnly(timestamp: number): string {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

/**
 * Check if two timestamps are on consecutive days
 */
function areConsecutiveDays(timestamp1: number, timestamp2: number): boolean {
  const date1 = new Date(timestamp1);
  const date2 = new Date(timestamp2);

  // Normalize to start of day
  date1.setHours(0, 0, 0, 0);
  date2.setHours(0, 0, 0, 0);

  const diffMs = Math.abs(date1.getTime() - date2.getTime());
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  return diffDays === 1;
}

/**
 * Check if a timestamp is from today
 */
function isToday(timestamp: number): boolean {
  const today = new Date();
  return getDateOnly(timestamp) === getDateOnly(today.getTime());
}

/**
 * Check if a timestamp is from yesterday
 */
function isYesterday(timestamp: number): boolean {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return getDateOnly(timestamp) === getDateOnly(yesterday.getTime());
}

/**
 * Calculate the effective score for a match, including any applied bonuses.
 *
 * @param match - Match to evaluate
 * @returns Score used for cumulative and personal-best comparisons
 */
export function calculateEffectiveMatchScore(match: BaseMatch): number {
  return match.score + (match.streakBonus ?? 0);
}

/**
 * Calculate streak information from match history
 *
 * @param matches - Array of matches sorted by timestamp ascending
 * @returns Current streak and best streak values
 */
export function calculateStreakFromMatches(matches: BaseMatch[]): {
  currentStreak: number;
  bestStreak: number;
} {
  if (matches.length === 0) {
    return { currentStreak: 0, bestStreak: 0 };
  }

  // Sort by timestamp ascending (oldest first)
  const sorted = [...matches].sort((a, b) => a.timestamp - b.timestamp);

  // Group matches by date (in case of multiple matches per day)
  const matchesByDate = new Map<string, BaseMatch>();
  for (const match of sorted) {
    const dateKey = getDateOnly(match.timestamp);
    // Keep the first match per day (or could keep highest score)
    if (!matchesByDate.has(dateKey)) {
      matchesByDate.set(dateKey, match);
    }
  }

  // Convert to array sorted by date
  const uniqueDayMatches = Array.from(matchesByDate.values()).sort(
    (a, b) => a.timestamp - b.timestamp,
  );

  if (uniqueDayMatches.length === 0) {
    return { currentStreak: 0, bestStreak: 0 };
  }

  let bestStreak = 1;
  let tempStreak = 1;

  // Calculate best streak
  for (let i = 1; i < uniqueDayMatches.length; i++) {
    if (
      areConsecutiveDays(
        uniqueDayMatches[i - 1].timestamp,
        uniqueDayMatches[i].timestamp,
      )
    ) {
      tempStreak++;
      bestStreak = Math.max(bestStreak, tempStreak);
    } else {
      tempStreak = 1;
    }
  }

  // Calculate current streak
  // Current streak is valid if the most recent match was today or yesterday
  const mostRecentMatch = uniqueDayMatches[uniqueDayMatches.length - 1];
  const mostRecentIsRecent =
    isToday(mostRecentMatch.timestamp) ||
    isYesterday(mostRecentMatch.timestamp);

  if (!mostRecentIsRecent) {
    return { currentStreak: 0, bestStreak };
  }

  // Count backwards from the most recent match
  let currentStreak = 1;
  for (let i = uniqueDayMatches.length - 2; i >= 0; i--) {
    if (
      areConsecutiveDays(
        uniqueDayMatches[i].timestamp,
        uniqueDayMatches[i + 1].timestamp,
      )
    ) {
      currentStreak++;
    } else {
      break;
    }
  }

  return { currentStreak, bestStreak: Math.max(bestStreak, currentStreak) };
}

/**
 * Calculate all user stats from match history
 */
export function calculateStatsFromMatches(matches: BaseMatch[]): BaseUserStats {
  if (matches.length === 0) {
    return {
      combinedScore: 0,
      dailyStreak: 0,
      bestStreak: 0,
      matchesPlayed: 0,
      personalBestScore: 0,
      lastMatchTimestamp: null,
    };
  }

  const matchScores = matches.map(calculateEffectiveMatchScore);

  // Calculate combined score (score + streak bonus for each match)
  const combinedScore = matchScores.reduce((sum, score) => sum + score, 0);

  // Calculate personal best score using the same effective score used in-game.
  const personalBestScore = Math.max(...matchScores);

  // Find the most recent match
  const sortedByTime = [...matches].sort((a, b) => b.timestamp - a.timestamp);
  const lastMatchTimestamp = sortedByTime[0].timestamp;

  // Calculate streaks
  const { currentStreak, bestStreak } = calculateStreakFromMatches(matches);

  return {
    combinedScore,
    dailyStreak: currentStreak,
    bestStreak,
    matchesPlayed: matches.length,
    personalBestScore,
    lastMatchTimestamp,
  };
}

/**
 * Merge local and server match histories
 * Server data takes precedence when there's a conflict for the same day
 *
 * @param localMatches - Matches from localStorage
 * @param serverMatches - Matches from Firestore
 * @returns Merged match array sorted by timestamp
 */
export function mergeMatchHistories<T extends BaseMatch>(
  localMatches: T[],
  serverMatches: T[],
): T[] {
  if (localMatches.length === 0) return [...serverMatches];
  if (serverMatches.length === 0) return [...localMatches];

  // Create a map of server matches by date
  const serverByDate = new Map<string, T>();
  for (const match of serverMatches) {
    const dateKey = getDateOnly(match.timestamp);
    serverByDate.set(dateKey, match);
  }

  // Merge: include all server matches, plus local matches that don't conflict
  const merged: T[] = [...serverMatches];

  for (const localMatch of localMatches) {
    const dateKey = getDateOnly(localMatch.timestamp);
    if (!serverByDate.has(dateKey)) {
      // No conflict, include local match
      merged.push(localMatch);
    }
    // If server has a match for this day, skip local (server takes precedence)
  }

  // Sort by timestamp ascending
  merged.sort((a, b) => a.timestamp - b.timestamp);

  return merged;
}

/**
 * Calculate streak bonus for a given streak length
 */
export function calculateStreakBonus(streakLength: number): number {
  // Bonus is given when continuing a streak (day 2+)
  if (streakLength >= 2) {
    return STREAK_BONUS_AMOUNT;
  }
  return 0;
}

/**
 * Determine if a new match would continue a streak
 */
export function wouldContinueStreak(
  lastMatchTimestamp: number | null,
): boolean {
  if (!lastMatchTimestamp) return false;
  return isYesterday(lastMatchTimestamp);
}
