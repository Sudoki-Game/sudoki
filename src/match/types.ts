/**
 * Match Types
 *
 * Defines the structure for match data stored locally and on the server.
 * Client and server types extend a base type with their respective fields.
 */

import { type DIFFICULTY_EMPTY_CELLS } from '@/game/util/constants';

/**
 * Base match data shared between client and server
 */
export interface BaseMatch {
  /** Unique match identifier */
  id: string;

  /** Whether the player won the match */
  isWon: boolean;

  /** Base score achieved */
  score: number;

  /** Bonus points from streak continuation */
  streakBonus: number;

  /** Number of auto-solve hints used */
  autoSolvesCount: number;

  /** JSON stringified array of "row,col" positions that were auto-solved */
  autoSolves: string;

  /** Lives remaining at end of match */
  livesRemaining: number;

  /** JSON stringified 9x9 board at end of match */
  board: string;

  /** JSON stringified original puzzle board */
  originalBoard: string;

  /** JSON stringified solution board */
  solution: string;

  /** Difficulty level of the puzzle */
  difficulty: keyof typeof DIFFICULTY_EMPTY_CELLS;

  /** Unix timestamp when match was completed */
  timestamp: number;
}

/**
 * Match data stored in localStorage (client-side)
 * Does not include user reference as it's implicit for local storage
 */
export interface ClientMatch extends BaseMatch {
  /**
   * Whether this match is cached locally due to failed server save.
   * Only set when logged-in user's server save fails.
   * Should be cleared after successful upload.
   */
  isCached?: boolean;
}

/**
 * Match data stored in Firestore (server-side)
 * Includes user reference for multi-user database
 */
export interface ServerMatch extends BaseMatch {
  /** Reference to the user who played this match */
  userPlayed: string;
}

/**
 * Signed match data structure for localStorage
 * Wraps the match data with HMAC signature for tamper detection
 */
export interface SignedMatchData {
  /** Base64 encoded JSON match data */
  data: string;
  /** HMAC-SHA256 signature */
  sig: string;
}

/**
 * Signed match history structure for localStorage
 */
export interface SignedMatchHistory {
  /** Base64 encoded JSON match array */
  data: string;
  /** HMAC-SHA256 signature */
  sig: string;
}

/**
 * Result of match validation
 */
export interface MatchValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Result of saving a match
 */
export interface SaveMatchResult {
  success: boolean;
  error?: string;
}

/**
 * Helper to check if a match is from a specific date
 */
export function isMatchFromDate(timestamp: number, date: Date): boolean {
  const matchDate = new Date(timestamp);
  return (
    matchDate.getFullYear() === date.getFullYear() &&
    matchDate.getMonth() === date.getMonth() &&
    matchDate.getDate() === date.getDate()
  );
}

/**
 * Helper to check if a match is from today
 */
export function isMatchFromToday(timestamp: number): boolean {
  return isMatchFromDate(timestamp, new Date());
}

/**
 * Generate a unique match ID
 */
export function generateMatchId(isAuthenticated: boolean = false): string {
  const prefix = isAuthenticated ? 'auth' : 'anon';
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
