'use server';

import { getSession } from './auth';
import { serverAuth, serverDb } from '@/lib/firebase/server';
import { getServerUserData } from '@/lib/firebase/firestore';
import type { Board, GameState, MatchData } from '@/types/sudoku';
import { FieldValue } from 'firebase-admin/firestore';
import { SCORE_PER_EMPTY_CELL, SCORE_CONFLICT_PENALTY } from '@/util/constants';

export interface GameCompletionResult {
  success: boolean;
  isValid: boolean;
  error?: string;
  match?: MatchData;
}

/**
 * Validates if a Sudoku board is correctly solved
 */
function validateSudokuSolution(board: Board): boolean {
  // Check if board is 9x9
  if (board.length !== 9 || board.some((row) => row.length !== 9)) {
    return false;
  }

  // Check if all cells are filled
  if (board.some((row) => row.some((cell) => cell === null))) {
    return false;
  }

  // Check rows
  for (let i = 0; i < 9; i++) {
    const seen = new Set<number>();
    for (let j = 0; j < 9; j++) {
      const value = board[i][j];
      if (value === null || value < 1 || value > 9 || seen.has(value)) {
        return false;
      }
      seen.add(value);
    }
  }

  // Check columns
  for (let j = 0; j < 9; j++) {
    const seen = new Set<number>();
    for (let i = 0; i < 9; i++) {
      const value = board[i][j];
      if (value === null || value < 1 || value > 9 || seen.has(value)) {
        return false;
      }
      seen.add(value);
    }
  }

  // Check 3x3 boxes
  for (let boxRow = 0; boxRow < 3; boxRow++) {
    for (let boxCol = 0; boxCol < 3; boxCol++) {
      const seen = new Set<number>();
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          const value = board[boxRow * 3 + i][boxCol * 3 + j];
          if (value === null || value < 1 || value > 9 || seen.has(value)) {
            return false;
          }
          seen.add(value);
        }
      }
    }
  }

  return true;
}

/**
 * Server action to handle game completion
 * Validates the score and updates user stats if logged in
 */
export async function completeGame(gameState: GameState): Promise<GameCompletionResult> {
  try {
    const { board, score, difficulty, autoSolves, status, originalBoard, conflicts } = gameState;
    const gameStatus = status as 'win' | 'lose';

    // Check if authenticated user already played today
    const userSession = await getSession();
    if (userSession) {
      const alreadyPlayed = await hasPlayedToday();
      if (alreadyPlayed) {
        return {
          success: false,
          isValid: false,
          error: 'You have already played today'
        };
      }
    }
    // Note: For unauthenticated users, client-side checks localStorage before calling this

    // Only validate the full Sudoku solution for wins
    let isValid = true;
    if (gameStatus === 'win') {
      isValid = validateSudokuSolution(board);

      if (!isValid) {
        console.warn('[Game] Invalid board submitted for win:', {
          score,
          difficulty,
          autoSolves: autoSolves.size
        });
        return {
          success: true,
          isValid: false,
          error: 'Invalid solution submitted'
        };
      }
    }

    // Validate score is reasonable and possible
    // Score should be non-negative and reasonable given the auto-solves used
    if (score < 0) {
      console.warn('[Game] Negative score detected:', {
        score,
        difficulty,
        autoSolves: autoSolves.size,
        status: gameStatus
      });
      return {
        success: true,
        isValid: false,
        error: 'Invalid score submitted'
      };
    }

    // Calculate maximum possible score (number of empty cells * points per cell)
    let emptyCellsCount = 0;
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        if (originalBoard[i][j] === null) {
          emptyCellsCount++;
        }
      }
    }
    let maxPossibleScore = emptyCellsCount * SCORE_PER_EMPTY_CELL;

    // Account for conflict penalties
    // Each conflict incurs a penalty, so deduct from the max score
    if (conflicts && conflicts.size > 0) {
      let totalConflictPenalty = 0;
      for (const conflictCount of conflicts.values()) {
        totalConflictPenalty += conflictCount * SCORE_CONFLICT_PENALTY;
      }
      maxPossibleScore -= totalConflictPenalty;
    }

    if (score > maxPossibleScore) {
      console.warn('[Game] Score exceeds maximum possible:', {
        score,
        maxPossibleScore,
        difficulty,
        autoSolves: autoSolves.size,
        status: gameStatus,
        conflictCount: conflicts?.size
      });
      return {
        success: true,
        isValid: false,
        error: 'Score exceeds maximum possible'
      };
    }

    // Prepare the match record for client-side storage
    const matchId = `${userSession ? 'auth' : 'anon'}_${Date.now()}`;
    const timestamp = Date.now();

    // Create match record
    const lastMatchData: MatchData = {
      id: matchId,
      score: Math.max(score, 0),
      difficulty,
      autoSolves: autoSolves.size,
      autoSolvePositions: JSON.stringify(Array.from(autoSolves)),
      gameStatus: gameStatus,
      livesRemaining: gameState.lives,
      originalBoard: JSON.stringify(gameState.originalBoard),
      board: JSON.stringify(gameState.board),
      solution: JSON.stringify(gameState.solution),
      timestamp,
      streakBonus: 0
    };

    // Only proceed with server updates if user is logged in
    if (!userSession) {
      // User is not logged in, just return success with match data for client-side storage
      return { success: true, isValid: true, match: lastMatchData };
    }

    // Verify and decode the session
    const decodedToken = await serverAuth.verifyIdToken(userSession);
    const userId = decodedToken.uid;

    // Get current user data
    const userData = await getServerUserData(userId);
    if (!userData) {
      return { success: false, isValid: true, error: 'User data not found' };
    }

    // Calculate adjusted score based on auto-solves
    // Each auto-solve reduced the score during gameplay, but we might want to apply additional penalty
    const adjustedScore = Math.max(score, 0);

    // Calculate streak updates
    let newDailyStreak = userData.dailyStreak || 0;
    let newBestStreak = userData.bestStreak || 0;
    let isKeepingStreak = false;
    let streakBonus = 0;

    if (userData.lastMatchTimestamp) {
      // Check if user played yesterday or earlier
      const lastMatchDate = new Date(userData.lastMatchTimestamp);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // Compare dates (ignore time)
      const lastMatchDateOnly = new Date(
        lastMatchDate.getFullYear(),
        lastMatchDate.getMonth(),
        lastMatchDate.getDate()
      );
      const yesterdayDateOnly = new Date(
        yesterday.getFullYear(),
        yesterday.getMonth(),
        yesterday.getDate()
      );

      if (lastMatchDateOnly.getTime() === yesterdayDateOnly.getTime()) {
        // User played yesterday, continue the streak
        newDailyStreak += 1;
        isKeepingStreak = true;
      } else if (lastMatchDateOnly.getTime() < yesterdayDateOnly.getTime()) {
        // User played more than 1 day ago, reset streak
        newDailyStreak = 1;
      }
      // If lastMatchDateOnly is today, streak stays the same
    } else {
      // First match ever
      newDailyStreak = 1;
    }

    // Update best streak if current streak is better
    if (newDailyStreak > newBestStreak) {
      newBestStreak = newDailyStreak;
    }

    // Give streak bonus on wins when keeping streak
    if (gameStatus === 'win' && isKeepingStreak) {
      streakBonus = 200;
    }

    // Update the lastMatchData with streak bonus for client-side storage
    lastMatchData.streakBonus = streakBonus;

    // Update personal best score if this score is better
    let newPersonalBestScore = userData.personalBestScore || 0;
    if (adjustedScore > newPersonalBestScore) {
      newPersonalBestScore = adjustedScore;
    }

    // Calculate final score with streak bonus
    const finalScore = adjustedScore + streakBonus;

    // Update user stats
    const userRef = serverDb.collection('users').doc(userId);
    await userRef.update({
      combinedScore: FieldValue.increment(finalScore),
      matchesPlayed: FieldValue.increment(1),
      lastMatchTimestamp: timestamp,
      dailyStreak: newDailyStreak,
      bestStreak: newBestStreak,
      personalBestScore: newPersonalBestScore
    });

    return {
      success: true,
      isValid: true,
      match: lastMatchData
    };
  } catch (error) {
    console.error('[Game] Error completing game:', error);
    return {
      success: false,
      isValid: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Fetch current user data
 */
export async function fetchUserData() {
  try {
    const session = await getSession();
    if (!session) {
      return null;
    }

    const decodedToken = await serverAuth.verifyIdToken(session);
    const userId = decodedToken.uid;

    return await getServerUserData(userId);
  } catch (error) {
    console.error('[Game] Error fetching user data:', error);
    return null;
  }
}

/**
 * Check if authenticated user has already played today based on lastMatchTimestamp
 */
export async function hasPlayedToday(): Promise<boolean> {
  try {
    const session = await getSession();
    if (!session) {
      // Unauthenticated users should check localStorage client-side
      return false;
    }

    const decodedToken = await serverAuth.verifyIdToken(session);
    const userId = decodedToken.uid;

    const userData = await getServerUserData(userId);
    if (!userData || !userData.lastMatchTimestamp) {
      return false;
    }

    // Check if lastMatchTimestamp is from today
    const lastMatchDate = new Date(userData.lastMatchTimestamp);
    const today = new Date();

    const lastMatchDateOnly = new Date(
      lastMatchDate.getFullYear(),
      lastMatchDate.getMonth(),
      lastMatchDate.getDate()
    );
    const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    return lastMatchDateOnly.getTime() === todayDateOnly.getTime();
  } catch (error) {
    console.error('[Game] Error checking if user played today:', error);
    return false;
  }
}
