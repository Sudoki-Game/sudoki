import { getDailyPuzzle as getDailyPuzzleAction } from '@/app/actions/puzzle';
import {
  reportBug as reportBugAction,
  type BugReportState,
} from '@/app/actions/reportBug';
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

/**
 * Submit a bug report via server action.
 *
 * @param prevState - Previous bug report action state
 * @param formData - Form payload with bug details
 * @returns Updated bug report action state
 */
export const reportBug = async (
  prevState: BugReportState,
  formData: FormData,
): Promise<BugReportState> => reportBugAction(prevState, formData);
