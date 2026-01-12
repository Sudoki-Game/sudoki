/**
 * Match Validation
 *
 * Validation logic for match data.
 * Currently stubbed - will be implemented later with full board/score validation.
 */

import type { BaseMatch } from '@/match/types';

/**
 * Result of match validation
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate a Sudoku board is correctly solved
 * TODO: Implement full validation
 */
export function validateSudokuSolution(_board: string): boolean {
  // For now, return true - will be implemented later
  return true;
}

/**
 * Validate the score is reasonable for the given match
 * TODO: Implement score validation
 */
export function validateScore(_match: BaseMatch): boolean {
  // For now, return true - will be implemented later
  return true;
}

/**
 * Full match validation
 * Combines all validation checks
 */
export function validateMatch(_match: BaseMatch): ValidationResult {
  // For now, always return valid
  return {
    isValid: true,
    errors: [],
  };
}
