export const MAX_LIVES = 5;

/**
 * Score penalties and rewards
 */
export const SCORE_CORRECT_CELL = 20; // Points awarded for placing a correct cell
export const SCORE_CONFLICT_PENALTY = 10; // Points deducted for a cell with conflicts
export const SCORE_REMOVED_VALID_CELL = 20; // Points deducted when removing a previously valid cell
export const SCORE_PER_EMPTY_CELL = 20; // Used to calculate maximum possible score
