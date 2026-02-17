interface BotStateWeights {
  active: number;
  steady: number;
  drifting: number;
}

type BotState = 'active' | 'steady' | 'drifting';
type BotPersona = 'casual' | 'regular' | 'committed-light';

interface BotProfileData {
  uid: string;
  displayName: string;
  persona: BotPersona;
  difficultyPct: number;
  budgetMin: number;
  budgetMax: number;
  streakCap: number;
  weekdayWeights: number[];
  playMultipliers: BotStateWeights;
  difficultyShiftByState: BotStateWeights;
  stateTransitions: Record<BotState, BotStateWeights>;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}
/**
 * User Types
 *
 * Defines the structure for user data stored locally and on the server.
 * Follows the same pattern as match types with base/client/server variants.
 */

/**
 * Base user statistics shared between client and server
 */
export interface BaseUserStats {
  /** Total accumulated score across all matches */
  combinedScore: number;

  /** Current consecutive days played streak */
  dailyStreak: number;

  /** Best consecutive days streak ever achieved */
  bestStreak: number;

  /** Total number of matches played */
  matchesPlayed: number;

  /** Highest single-match score achieved */
  personalBestScore: number;

  /** Timestamp of the most recent match played */
  lastMatchTimestamp: number | null;
}

/**
 * User data stored in localStorage (client-side)
 * For unauthenticated users
 */
export type LocalUserData = BaseUserStats;

/**
 * User data stored in Firestore (server-side)
 * For authenticated users
 */
export interface ServerUserData extends BaseUserStats {
  /** Firebase Auth UID */
  uid: string;

  /** User's email address */
  email: string | null;

  /** User's display name (required after onboarding) */
  displayName: string;

  /** Whether the user is active */
  isActive: boolean;

  /** Timestamp when user account was created */
  createdAt: number;

  /** Timestamp when user was last active */
  lastActive: number;

  /** Optional admin gate */
  isAdmin?: boolean;

  /** Marks this user as a bot user entry */
  isBot?: boolean;

  /** Bot state-machine configuration/state */
  botProfile?: Partial<BotProfileData>;
}

/**
 * Signed user data structure for localStorage
 */
export interface SignedUserData {
  /** Base64 encoded JSON user data */
  data: string;
  /** HMAC-SHA256 signature */
  sig: string;
}

/**
 * Default local user stats for new/unauthenticated users
 */
export function createDefaultLocalUserData(): LocalUserData {
  return {
    combinedScore: 0,
    dailyStreak: 0,
    bestStreak: 0,
    matchesPlayed: 0,
    personalBestScore: 0,
    lastMatchTimestamp: null,
  };
}

/**
 * Create initial server user data for a new authenticated user
 */
export function createInitialServerUserData(
  uid: string,
  email: string | null,
  displayName: string,
): ServerUserData {
  const now = Date.now();
  return {
    uid,
    email,
    displayName,
    isActive: true,
    createdAt: now,
    lastActive: now,
    combinedScore: 0,
    dailyStreak: 0,
    bestStreak: 0,
    matchesPlayed: 0,
    personalBestScore: 0,
    lastMatchTimestamp: null,
  };
}

/**
 * Check if user has completed onboarding
 * Currently just checks for display name
 */
export function hasCompletedOnboarding(user: ServerUserData | null): boolean {
  if (!user) return false;
  return Boolean(user.displayName && user.displayName.trim().length > 0);
}

/**
 * Default base user stats
 */
export function createDefaultBaseUserStats(): BaseUserStats {
  return {
    combinedScore: 0,
    dailyStreak: 0,
    bestStreak: 0,
    matchesPlayed: 0,
    personalBestScore: 0,
    lastMatchTimestamp: null,
  };
}
