'use server';

/**
 * Puzzle Server Actions
 *
 * Server actions for generating and fetching daily puzzles.
 * Puzzles are generated deterministically from the date - everyone
 * gets the same puzzle on the same day.
 *
 * Uses tiered caching:
 * 1. In-memory cache (fastest, survives within serverless instance)
 * 2. Firestore cache (persists across instances)
 * 3. Generate fresh (fallback)
 */

import { serverDb } from '@/firebase/server';
import type { Difficulty, Board } from '@/game/types';
import { generateDailyPuzzle, getTodayDateString } from '@/game/util';

/**
 * In-memory cache for puzzles (survives within same serverless instance)
 * Key format: "YYYY-MM-DD-difficulty"
 */
const puzzleCache = new Map<string, { puzzle: Board; solution: Board }>();

/**
 * Response type for daily puzzle requests
 */
export type DailyPuzzleResponse = {
  /** The puzzle board with cells removed */
  puzzle: Board;
  /** The complete solution */
  solution: Board;
  /** The date string this puzzle is for (YYYY-MM-DD) */
  dateString: string;
  /** The difficulty level */
  difficulty: Difficulty;
};

/**
 * Firestore document structure for cached puzzles
 */
type CachedPuzzleDoc = {
  puzzle: string; // JSON stringified Board
  solution: string; // JSON stringified Board
  difficulty: Difficulty;
  createdAt: number;
};

/**
 * Get puzzle from Firestore cache
 */
async function getFromFirestore(
  dateString: string,
  difficulty: Difficulty,
): Promise<{ puzzle: Board; solution: Board } | null> {
  try {
    const docRef = serverDb
      .collection('dailyPuzzles')
      .doc(`${dateString}-${difficulty}`);
    const doc = await docRef.get();

    if (!doc.exists) return null;

    const data = doc.data() as CachedPuzzleDoc;
    return {
      puzzle: JSON.parse(data.puzzle),
      solution: JSON.parse(data.solution),
    };
  } catch (error) {
    console.error('[getDailyPuzzle] Firestore read error:', error);
    return null;
  }
}

/**
 * Save puzzle to Firestore cache
 */
async function saveToFirestore(
  dateString: string,
  difficulty: Difficulty,
  puzzle: Board,
  solution: Board,
): Promise<void> {
  try {
    const docRef = serverDb
      .collection('dailyPuzzles')
      .doc(`${dateString}-${difficulty}`);

    const data: CachedPuzzleDoc = {
      puzzle: JSON.stringify(puzzle),
      solution: JSON.stringify(solution),
      difficulty,
      createdAt: Date.now(),
    };

    await docRef.set(data);
  } catch (error) {
    console.error('[getDailyPuzzle] Firestore write error:', error);
    // Non-fatal - puzzle still works, just not cached
  }
}

/**
 * Get today's daily puzzle.
 * Uses tiered caching: memory → Firestore → generate.
 *
 * @param difficulty - The difficulty level (defaults to 'medium')
 * @returns The puzzle, solution, and metadata
 */
export async function getDailyPuzzle(
  difficulty: Difficulty = 'medium',
): Promise<DailyPuzzleResponse> {
  const dateString = getTodayDateString();
  const cacheKey = `${dateString}-${difficulty}`;

  // 1. Check in-memory cache (fastest)
  if (puzzleCache.has(cacheKey)) {
    console.log('[getDailyPuzzle] Memory cache hit');
    const cached = puzzleCache.get(cacheKey)!;
    return { ...cached, dateString, difficulty };
  }

  // 2. Check Firestore cache
  const firestoreCached = await getFromFirestore(dateString, difficulty);
  if (firestoreCached) {
    console.log('[getDailyPuzzle] Firestore cache hit');
    puzzleCache.set(cacheKey, firestoreCached);
    return { ...firestoreCached, dateString, difficulty };
  }

  // 3. Generate fresh puzzle
  console.log('[getDailyPuzzle] Generating new puzzle');
  const { puzzle, solution } = generateDailyPuzzle(dateString, difficulty);

  // Cache in memory
  puzzleCache.set(cacheKey, { puzzle, solution });

  // Cache in Firestore (async, non-blocking)
  saveToFirestore(dateString, difficulty, puzzle, solution);

  return {
    puzzle,
    solution,
    dateString,
    difficulty,
  };
}

/**
 * Get a puzzle for a specific date.
 * Useful for replaying historical puzzles.
 * Uses the same tiered caching as getDailyPuzzle.
 *
 * @param dateString - The date in YYYY-MM-DD format
 * @param difficulty - The difficulty level (defaults to 'medium')
 * @returns The puzzle, solution, and metadata
 */
export async function getPuzzleForDate(
  dateString: string,
  difficulty: Difficulty = 'medium',
): Promise<DailyPuzzleResponse> {
  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    throw new Error('Invalid date format. Use YYYY-MM-DD.');
  }

  const cacheKey = `${dateString}-${difficulty}`;

  // 1. Check in-memory cache
  if (puzzleCache.has(cacheKey)) {
    const cached = puzzleCache.get(cacheKey)!;
    return { ...cached, dateString, difficulty };
  }

  // 2. Check Firestore cache
  const firestoreCached = await getFromFirestore(dateString, difficulty);
  if (firestoreCached) {
    puzzleCache.set(cacheKey, firestoreCached);
    return { ...firestoreCached, dateString, difficulty };
  }

  // 3. Generate fresh puzzle
  const { puzzle, solution } = generateDailyPuzzle(dateString, difficulty);

  // Cache in memory
  puzzleCache.set(cacheKey, { puzzle, solution });

  // Cache in Firestore (async, non-blocking)
  saveToFirestore(dateString, difficulty, puzzle, solution);

  return {
    puzzle,
    solution,
    dateString,
    difficulty,
  };
}
