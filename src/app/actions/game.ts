'use server';

import { getSession } from './auth';
import { serverAuth, serverDb } from '@/lib/firebase/server';
import { getUserData, type MatchData } from '@/lib/firebase/firestore';
import type { Board, GameState } from '@/types/sudoku';
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

    const { hasPlayedToday } = await checkDailyMatch();

    if (hasPlayedToday) {
      return {
        success: true,
        isValid: false,
        error: 'User has already played a match today'
      };
    }

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

    // Check if user is logged in
    const session = await getSession();
    if (!session) {
      // User is not logged in, just return success
      return { success: true, isValid: true };
    }

    // Verify and decode the session
    const decodedToken = await serverAuth.verifyIdToken(session);
    const userId = decodedToken.uid;

    // Get current user data
    const userData = await getUserData(userId);
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

    if (userData.lastMatchTimestamp) {
      // Check if user played yesterday or earlier
      const lastMatchDate = new Date(userData.lastMatchTimestamp);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // Compare dates (ignore time)
      const lastMatchDateOnly = new Date(lastMatchDate.getFullYear(), lastMatchDate.getMonth(), lastMatchDate.getDate());
      const yesterdayDateOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

      if (lastMatchDateOnly.getTime() === yesterdayDateOnly.getTime()) {
        // User played yesterday, continue the streak
        newDailyStreak += 1;
        isKeepingStreak = true;
      } else if (lastMatchDateOnly.getTime() < yesterdayDateOnly.getTime()) {
        // User played more than 1 day ago, reset streak
        newDailyStreak = 1;
      }
      // If lastMatchDateOnly is today, streak stays the same (already played today check)
    } else {
      // First match ever
      newDailyStreak = 1;
    }

    // Update best streak if current streak is better
    if (newDailyStreak > newBestStreak) {
      newBestStreak = newDailyStreak;
    }

    // Give streak bonus on wins when keeping streak
    let streakBonus = 0;
    if (gameStatus === 'win' && isKeepingStreak) {
      streakBonus = 200;
    }

    // Update personal best score if this score is better
    let newPersonalBestScore = userData.personalBestScore || 0;
    if (adjustedScore > newPersonalBestScore) {
      newPersonalBestScore = adjustedScore;
    }

    // Prepare the match record
    const matchId = `${userId}_${Date.now()}`;
    const timestamp = Date.now();
    const dateStr = new Date(timestamp).toISOString().split('T')[0]; // YYYY-MM-DD

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

    // Create match record
    const matchRef = serverDb.collection('matches').doc(matchId);
    const matchDoc: MatchData = {
      id: matchId,
      userId,
      score: adjustedScore,
      streakBonus: streakBonus,
      difficulty,
      autoSolves: autoSolves.size,
      gameStatus: gameStatus,
      livesRemaining: gameState.lives,
      board: JSON.stringify(gameState.board),
      solution: JSON.stringify(gameState.solution),
      timestamp,
      date: dateStr
    };
    await matchRef.set(matchDoc);

    return {
      success: true,
      isValid: true,
      match: matchDoc
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

    return await getUserData(userId);
  } catch (error) {
    console.error('[Game] Error fetching user data:', error);
    return null;
  }
}

/**
 * Check if user has already played a match today
 */
export async function checkDailyMatch(): Promise<{
  hasPlayedToday: boolean;
  match?: MatchData;
}> {
  try {
    const session = await getSession();
    if (!session) {
      return { hasPlayedToday: false };
    }

    const decodedToken = await serverAuth.verifyIdToken(session);
    const userId = decodedToken.uid;

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];

    // Check if user has a match for today
    const matchesQuery = serverDb
      .collection('matches')
      .where('userId', '==', userId)
      .where('date', '==', today)
      .limit(1);

    const snapshot = await matchesQuery.get();

    if (snapshot.empty) {
      return { hasPlayedToday: false };
    }

    return {
      hasPlayedToday: true
    };
  } catch (error) {
    console.error('[Game] Error checking daily match:', error);
    return { hasPlayedToday: false };
  }
}

/**
 * Get today's match data (for viewing solved board)
 */
export async function getTodayMatch(): Promise<MatchData | null> {
  try {
    const session = await getSession();
    if (!session) {
      return null;
    }

    const decodedToken = await serverAuth.verifyIdToken(session);
    const userId = decodedToken.uid;

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];

    // Check if user has a match for today
    const matchesQuery = serverDb
      .collection('matches')
      .where('userId', '==', userId)
      .where('date', '==', today)
      .limit(1);

    const snapshot = await matchesQuery.get();

    if (snapshot.empty) {
      return null;
    }

    const matchDoc = snapshot.docs[0].data() as MatchData;
    return matchDoc;
  } catch (error) {
    console.error('[Game] Error getting today match:', error);
    return null;
  }
}
