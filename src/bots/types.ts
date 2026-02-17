import type { DifficultyLevel } from '@/game/util/constants';

/**
 * Lifecycle state for day-to-day bot participation behavior
 */
export type BotState = 'active' | 'steady' | 'drifting';

/**
 * High-level persona preset used to initialize bot behavior defaults
 */
export type BotPersona = 'casual' | 'regular' | 'committed-light';

/**
 * Weighted probabilities keyed by bot state
 */
export interface BotStateWeights {
  active: number;
  steady: number;
  drifting: number;
}

/**
 * Persistent bot configuration stored on the bot user document
 *
 * `difficultyPct` represents the target percentile relative to recent
 * human scores for the medium grid
 */
export interface BotProfile {
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
 * Monthly mutable state used by the bot runner to enforce budgets and streaks
 */
export interface BotMonthlyState {
  botId: string;
  monthKey: string;
  budgetAllocated: number;
  gamesPlayed: number;
  currentStreak: number;
  maxStreakObserved: number;
  lastPlayedDate: string | null;
  currentState: BotState;
  updatedAt: number;
}

/**
 * Per-day marker and outcome for a bot run attempt
 */
export interface BotDailyRecord {
  botId: string;
  dateKey: string;
  monthKey: string;
  played: boolean;
  matchId: string | null;
  score: number | null;
  difficulty: DifficultyLevel | null;
  error: string | null;
  createdAt: number;
}

/**
 * Aggregated counters describing one invocation of the daily bot runner
 */
export interface BotRunSummary {
  dateKey: string;
  considered: number;
  played: number;
  skippedNoBudget: number;
  skippedProbability: number;
  skippedExistingDailyRecord: number;
  failedSaves: number;
}

/**
 * Top-level result returned by the daily bot runner
 */
export interface BotRunResult {
  ran: boolean;
  lockAcquired: boolean;
  summary: BotRunSummary;
}

/**
 * Global on/off switch for the bot system
 */
export interface BotSystemConfig {
  enabled: boolean;
  updatedAt: number;
}
