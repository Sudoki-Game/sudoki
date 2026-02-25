import { getDailyPuzzle as getDailyPuzzleAction } from '@/app/actions/puzzle';
import type { DailyPuzzleResponse } from '@/app/actions/puzzle';
import type { Difficulty } from '@/game/types';

/**
 * Fetch the deterministic daily puzzle for the provided difficulty.
 *
 * @param difficulty - Difficulty level for the daily puzzle
 * @returns Daily puzzle payload containing puzzle and solution boards
 */
export const getDailyPuzzle = async (
  difficulty?: Difficulty,
): Promise<DailyPuzzleResponse> => getDailyPuzzleAction(difficulty);