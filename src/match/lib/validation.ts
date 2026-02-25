/**
 * Match Validation
 *
 * Validation logic for match data and business logic.
 * Includes streak calculation and match processing.
 */

import {
  STREAK_BONUS_AMOUNT,
  SCORE_PER_EMPTY_CELL,
  MAX_LIVES,
  DIFFICULTY_EMPTY_CELLS,
} from '@/game/util/constants';
import type { BaseMatch } from '@/match/types';
import type { Board } from '@/game/types';
import { getUserData } from '@/user/lib/client';
import { getUserStats } from '@/user/lib/actionGateway';
import { wouldContinueStreak } from '@/user/lib/stats';

/**
 * Validation error with severity level
 */
export interface ValidationError {
  field: string;
  message: string;
  severity: 'critical' | 'warning';
}

/**
 * Result of match validation
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

// ============================================================================
// Board Parsing & Structure Validation
// ============================================================================

/**
 * Parse a JSON board string into a Board array
 * @param json - JSON stringified board
 * @returns Parsed board or null if invalid
 */
export function parseBoard(json: string): Board | null {
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return null;
    if (parsed.length !== 9) return null;

    for (const row of parsed) {
      if (!Array.isArray(row) || row.length !== 9) return null;
      for (const cell of row) {
        if (
          cell !== null &&
          (typeof cell !== 'number' || cell < 1 || cell > 9)
        ) {
          return null;
        }
      }
    }

    return parsed as Board;
  } catch {
    return null;
  }
}

/**
 * Count empty cells in a board
 * @param board - The board to analyze
 * @returns Number of empty (null) cells
 */
export function countEmptyCells(board: Board): number {
  let count = 0;
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === null) count++;
    }
  }
  return count;
}

/**
 * Calculate max score for a given difficulty
 * @param difficulty - The puzzle difficulty
 * @returns Maximum achievable score, or null if difficulty is unknown
 */
export function calculateMaxScore(difficulty: string): number | null {
  const emptyCells = DIFFICULTY_EMPTY_CELLS[difficulty];
  if (!emptyCells) {
    // Unknown difficulty - reject to prevent exploits
    return null;
  }
  return emptyCells * SCORE_PER_EMPTY_CELL;
}

/**
 * Check if two boards match cell-by-cell
 * @param board1 - First board to compare
 * @param board2 - Second board to compare
 * @param onlyNonNull - If true, only compare non-null cells
 * @returns True if boards match, false otherwise
 */
export function boardsMatch(
  board1: Board,
  board2: Board,
  onlyNonNull: boolean = false,
): boolean {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const cell1 = board1[row][col];
      const cell2 = board2[row][col];

      if (onlyNonNull && cell1 === null) continue;

      if (cell1 !== cell2) return false;
    }
  }
  return true;
}

// ============================================================================
// Sudoku Rules Validation
// ============================================================================

/**
 * Check if a board has any conflicts (duplicates in rows/cols/boxes)
 * @param board - The board to check
 * @returns True if no conflicts found
 */
export function hasNoConflicts(board: Board): boolean {
  // Check rows
  for (let row = 0; row < 9; row++) {
    const seen = new Set<number>();
    for (let col = 0; col < 9; col++) {
      const val = board[row][col];
      if (val !== null) {
        if (seen.has(val)) return false;
        seen.add(val);
      }
    }
  }

  // Check columns
  for (let col = 0; col < 9; col++) {
    const seen = new Set<number>();
    for (let row = 0; row < 9; row++) {
      const val = board[row][col];
      if (val !== null) {
        if (seen.has(val)) return false;
        seen.add(val);
      }
    }
  }

  // Check 3x3 boxes
  for (let boxRow = 0; boxRow < 3; boxRow++) {
    for (let boxCol = 0; boxCol < 3; boxCol++) {
      const seen = new Set<number>();
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          const row = boxRow * 3 + i;
          const col = boxCol * 3 + j;
          const val = board[row][col];
          if (val !== null) {
            if (seen.has(val)) return false;
            seen.add(val);
          }
        }
      }
    }
  }

  return true;
}

/**
 * Check if a board is completely filled
 * @param board - The board to check
 * @returns True if all cells are non-null
 */
export function isBoardComplete(board: Board): boolean {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === null) return false;
    }
  }
  return true;
}

/**
 * Validate that original board pre-filled cells remain unchanged in final board
 * @param original - The original puzzle board
 * @param final - The final board after gameplay
 * @returns Array of validation errors
 */
export function validateOriginalBoardIntegrity(
  original: Board,
  final: Board,
): ValidationError[] {
  const errors: ValidationError[] = [];

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const originalCell = original[row][col];
      const finalCell = final[row][col];

      // If original had a value, it must match in final
      if (originalCell !== null && originalCell !== finalCell) {
        errors.push({
          field: 'originalBoard',
          message: `Pre-filled cell at [${row},${col}] was modified (${originalCell} → ${finalCell})`,
          severity: 'critical',
        });
      }
    }
  }

  return errors;
}

// ============================================================================
// Match Validation Functions
// ============================================================================

/**
 * Validate board structures and relationships
 */
function validateBoardStructures(
  board: Board,
  originalBoard: Board,
  solution: Board,
  isWon: boolean,
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Only validate board matches solution for won games
  // Lost games can have incorrect values (that's why they lost)
  if (isWon && !boardsMatch(board, solution, true)) {
    errors.push({
      field: 'board',
      message: 'Won game has board cells that do not match solution',
      severity: 'critical',
    });
  }

  // Validate original board integrity
  errors.push(...validateOriginalBoardIntegrity(originalBoard, board));

  return errors;
}

/**
 * Validate sudoku rules for the solution and final board
 */
function validateSudokuRules(
  board: Board,
  solution: Board,
  isWon: boolean,
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Solution must be valid
  if (!hasNoConflicts(solution)) {
    errors.push({
      field: 'solution',
      message: 'Solution has conflicts',
      severity: 'critical',
    });
  }

  // Solution must be complete
  if (!isBoardComplete(solution)) {
    errors.push({
      field: 'solution',
      message: 'Solution is incomplete',
      severity: 'critical',
    });
  }

  // If won, board must have no conflicts
  if (isWon && !hasNoConflicts(board)) {
    errors.push({
      field: 'board',
      message: 'Won game has conflicts on board',
      severity: 'critical',
    });
  }

  return errors;
}

/**
 * Validate score is within reasonable bounds
 */
function validateScoreField(
  match: BaseMatch,
  maxScore: number,
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (match.score < 0) {
    errors.push({
      field: 'score',
      message: `Score is negative: ${match.score}`,
      severity: 'critical',
    });
  }

  if (match.score > maxScore) {
    errors.push({
      field: 'score',
      message: `Score ${match.score} exceeds maximum ${maxScore}`,
      severity: 'critical',
    });
  }

  // Validate streak bonus
  if (match.streakBonus !== 0 && match.streakBonus !== STREAK_BONUS_AMOUNT) {
    errors.push({
      field: 'streakBonus',
      message: `Invalid streak bonus: ${match.streakBonus} (expected 0 or ${STREAK_BONUS_AMOUNT})`,
      severity: 'critical',
    });
  }

  return errors;
}

/**
 * Validate autoSolves data consistency
 */
export function validateAutoSolves(match: BaseMatch): ValidationError[] {
  const errors: ValidationError[] = [];

  try {
    const autoSolves = JSON.parse(match.autoSolves);
    if (!Array.isArray(autoSolves)) {
      errors.push({
        field: 'autoSolves',
        message: 'autoSolves is not an array',
        severity: 'critical',
      });
      return errors;
    }

    if (autoSolves.length !== match.autoSolvesCount) {
      errors.push({
        field: 'autoSolvesCount',
        message: `autoSolvesCount ${match.autoSolvesCount} does not match autoSolves array length ${autoSolves.length}`,
        severity: 'critical',
      });
    }
  } catch {
    errors.push({
      field: 'autoSolves',
      message: 'Failed to parse autoSolves JSON',
      severity: 'critical',
    });
  }

  return errors;
}

/**
 * Validate lives remaining is within valid range
 */
export function validateLives(match: BaseMatch): ValidationError[] {
  const errors: ValidationError[] = [];

  if (match.livesRemaining < 0 || match.livesRemaining > MAX_LIVES) {
    errors.push({
      field: 'livesRemaining',
      message: `Lives ${match.livesRemaining} out of range (0-${MAX_LIVES})`,
      severity: 'critical',
    });
  }

  return errors;
}

/**
 * Validate win/loss conditions are consistent
 */
export function validateWinCondition(
  board: Board,
  match: BaseMatch,
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (match.isWon) {
    // Won game must have complete board
    if (!isBoardComplete(board)) {
      errors.push({
        field: 'isWon',
        message: 'Won game has incomplete board',
        severity: 'critical',
      });
    }
  } else {
    // Lost game must have 0 lives
    if (match.livesRemaining !== 0) {
      errors.push({
        field: 'isWon',
        message: `Lost game has ${match.livesRemaining} lives remaining`,
        severity: 'critical',
      });
    }
  }

  return errors;
}

/**
 * Validate timestamp is reasonable
 */
export function validateTimestamp(timestamp: number): ValidationError[] {
  const errors: ValidationError[] = [];
  const now = Date.now();
  const FIVE_MINUTES = 5 * 60 * 1000;
  const ONE_YEAR = 365 * 24 * 60 * 60 * 1000;

  // Reject future timestamps (allow 5min clock skew)
  if (timestamp > now + FIVE_MINUTES) {
    errors.push({
      field: 'timestamp',
      message: `Timestamp is in the future: ${new Date(timestamp).toISOString()}`,
      severity: 'critical',
    });
  }

  // Warn on very old timestamps
  if (timestamp < now - ONE_YEAR) {
    errors.push({
      field: 'timestamp',
      message: `Timestamp is over 1 year old: ${new Date(timestamp).toISOString()}`,
      severity: 'warning',
    });
  }

  return errors;
}

/**
 * Full match validation
 * Validates all aspects of a match to prevent exploits
 *
 * @param match - The match to validate
 * @returns Validation result with errors and warnings
 */
export function validateMatch(match: BaseMatch): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // 1. Parse boards
  const board = parseBoard(match.board);
  const originalBoard = parseBoard(match.originalBoard);
  const solution = parseBoard(match.solution);

  if (!board || !originalBoard || !solution) {
    return {
      isValid: false,
      errors: [
        {
          field: 'boards',
          message: 'Failed to parse board JSON',
          severity: 'critical',
        },
      ],
      warnings: [],
    };
  }

  // 2. Validate board structures
  errors.push(
    ...validateBoardStructures(board, originalBoard, solution, match.isWon),
  );

  // 3. Validate difficulty and score
  const maxScore = calculateMaxScore(match.difficulty);
  if (maxScore === null) {
    errors.push({
      field: 'difficulty',
      message: `Unknown difficulty: ${match.difficulty}`,
      severity: 'critical',
    });
  } else {
    errors.push(...validateScoreField(match, maxScore));
  }

  // 4. Validate sudoku rules
  errors.push(...validateSudokuRules(board, solution, match.isWon));

  // 5. Validate match logic
  errors.push(...validateAutoSolves(match));
  errors.push(...validateLives(match));
  errors.push(...validateWinCondition(board, match));

  // 6. Validate timestamp
  const timestampErrors = validateTimestamp(match.timestamp);
  errors.push(...timestampErrors.filter((e) => e.severity === 'critical'));
  warnings.push(...timestampErrors.filter((e) => e.severity === 'warning'));

  const isValid = errors.length === 0;

  // Log validation result
  if (isValid) {
    console.log('[Validation] Match validation passed:', {
      matchId: match.id,
      difficulty: match.difficulty,
      score: match.score,
      warningCount: warnings.length,
    });
  }

  return {
    isValid,
    errors,
    warnings,
  };
}

/**
 * Calculate the streak bonus for a new match based on last match timestamp
 *
 * Rules:
 * - No previous match: 0 bonus (first day)
 * - Last match was yesterday: 200 bonus (continuing streak)
 * - Last match was before yesterday: 0 bonus (streak broken, starting fresh)
 *
 * @param lastMatchTimestamp - Timestamp of the last completed match (null if no previous match)
 * @returns The streak bonus to award for this match
 */
export function calculateStreakBonusForMatch(
  lastMatchTimestamp: number | null,
): number {
  // If no previous match, this is day 1 - no bonus
  if (!lastMatchTimestamp) {
    return 0;
  }

  // Check if this continues a streak (played yesterday)
  if (wouldContinueStreak(lastMatchTimestamp)) {
    return STREAK_BONUS_AMOUNT;
  }

  // Streak was broken - starting fresh
  return 0;
}

/**
 * Get the last match timestamp from the appropriate source
 * @param userId - User ID if logged in, null for anonymous users
 * @returns Promise resolving to the last match timestamp or null
 */
export async function getLastMatchTimestamp(
  userId: string | null,
): Promise<number | null> {
  if (userId) {
    // Logged-in user: get from server
    const stats = await getUserStats(userId);
    return stats?.lastMatchTimestamp ?? null;
  } else {
    // Anonymous user: get from localStorage
    const userData = await getUserData();
    return userData.lastMatchTimestamp;
  }
}

/**
 * Calculate streak bonus for a new match using the appropriate data source
 * This is the main entry point for calculating streak bonuses.
 *
 * @param userId - User ID if logged in, null for anonymous users
 * @returns Promise resolving to the streak bonus amount
 */
export async function getStreakBonusForNewMatch(
  userId: string | null,
): Promise<number> {
  const lastMatchTimestamp = await getLastMatchTimestamp(userId);
  return calculateStreakBonusForMatch(lastMatchTimestamp);
}
