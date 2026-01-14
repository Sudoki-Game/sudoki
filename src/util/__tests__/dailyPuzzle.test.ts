/**
 * Tests for Daily Puzzle Generation
 *
 * Tests the seeded random number generator and puzzle generation
 * to ensure deterministic behavior (same date = same puzzle).
 */

import {
  createSeededRandom,
  dateToSeed,
  getTodayDateString,
  shuffleWithRandom,
  generateSeededSolvedSudoku,
  generateSeededPuzzle,
  generateDailyPuzzle,
} from '../util';
import type { Board, Difficulty } from '@/game/types';

describe('Seeded Random Number Generator', () => {
  describe('createSeededRandom', () => {
    it('should produce deterministic sequences for the same seed', () => {
      const random1 = createSeededRandom(12345);
      const random2 = createSeededRandom(12345);

      const sequence1 = Array.from({ length: 10 }, () => random1());
      const sequence2 = Array.from({ length: 10 }, () => random2());

      expect(sequence1).toEqual(sequence2);
    });

    it('should produce different sequences for different seeds', () => {
      const random1 = createSeededRandom(12345);
      const random2 = createSeededRandom(54321);

      const sequence1 = Array.from({ length: 10 }, () => random1());
      const sequence2 = Array.from({ length: 10 }, () => random2());

      expect(sequence1).not.toEqual(sequence2);
    });

    it('should return values between 0 and 1', () => {
      const random = createSeededRandom(99999);

      for (let i = 0; i < 100; i++) {
        const value = random();
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(1);
      }
    });
  });

  describe('dateToSeed', () => {
    it('should convert date string to numeric seed', () => {
      expect(dateToSeed('2026-01-14')).toBe(20260114);
      expect(dateToSeed('2025-12-31')).toBe(20251231);
      expect(dateToSeed('2000-01-01')).toBe(20000101);
    });
  });

  describe('getTodayDateString', () => {
    it('should return date in YYYY-MM-DD format', () => {
      const dateString = getTodayDateString();
      expect(dateString).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('shuffleWithRandom', () => {
    it('should produce deterministic shuffle for same seed', () => {
      const array1 = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      const array2 = [1, 2, 3, 4, 5, 6, 7, 8, 9];

      shuffleWithRandom(array1, createSeededRandom(42));
      shuffleWithRandom(array2, createSeededRandom(42));

      expect(array1).toEqual(array2);
    });

    it('should contain all original elements after shuffle', () => {
      const array = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      shuffleWithRandom(array, createSeededRandom(123));

      expect(array.sort()).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });
  });
});

describe('Puzzle Generation', () => {
  /**
   * Helper to validate a Sudoku board is valid (no conflicts)
   */
  function isValidSudoku(board: Board): boolean {
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
            const val = board[boxRow * 3 + i][boxCol * 3 + j];
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
   * Helper to check if a board is completely filled
   */
  function isComplete(board: Board): boolean {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (board[row][col] === null) return false;
      }
    }
    return true;
  }

  /**
   * Helper to count empty cells
   */
  function countEmptyCells(board: Board): number {
    let count = 0;
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (board[row][col] === null) count++;
      }
    }
    return count;
  }

  describe('generateSeededSolvedSudoku', () => {
    it('should generate a valid complete Sudoku board', () => {
      const random = createSeededRandom(12345);
      const board = generateSeededSolvedSudoku(random);

      expect(isValidSudoku(board)).toBe(true);
      expect(isComplete(board)).toBe(true);
    });

    it('should generate the same board for the same seed', () => {
      const board1 = generateSeededSolvedSudoku(createSeededRandom(99999));
      const board2 = generateSeededSolvedSudoku(createSeededRandom(99999));

      expect(board1).toEqual(board2);
    });

    it('should generate different boards for different seeds', () => {
      const board1 = generateSeededSolvedSudoku(createSeededRandom(11111));
      const board2 = generateSeededSolvedSudoku(createSeededRandom(22222));

      expect(board1).not.toEqual(board2);
    });
  });

  describe('generateSeededPuzzle', () => {
    const difficulties: Difficulty[] = ['easy', 'medium', 'hard'];

    it.each(difficulties)(
      'should generate valid puzzle for %s difficulty',
      (difficulty) => {
        const random = createSeededRandom(42);
        const { puzzle, solution } = generateSeededPuzzle(difficulty, random);

        expect(isValidSudoku(puzzle)).toBe(true);
        expect(isValidSudoku(solution)).toBe(true);
        expect(isComplete(solution)).toBe(true);
      },
    );

    it('should remove correct number of cells based on difficulty', () => {
      const testCases: { difficulty: Difficulty; expected: number }[] = [
        { difficulty: 'im-too-young-to-die', expected: 2 },
        { difficulty: 'easy', expected: 35 },
        { difficulty: 'medium', expected: 45 },
        { difficulty: 'hard', expected: 55 },
      ];

      for (const { difficulty, expected } of testCases) {
        const random = createSeededRandom(123);
        const { puzzle } = generateSeededPuzzle(difficulty, random);
        expect(countEmptyCells(puzzle)).toBe(expected);
      }
    });

    it('should produce deterministic puzzles for same seed', () => {
      const { puzzle: puzzle1, solution: solution1 } = generateSeededPuzzle(
        'medium',
        createSeededRandom(55555),
      );
      const { puzzle: puzzle2, solution: solution2 } = generateSeededPuzzle(
        'medium',
        createSeededRandom(55555),
      );

      expect(puzzle1).toEqual(puzzle2);
      expect(solution1).toEqual(solution2);
    });

    it('should have puzzle cells match solution cells', () => {
      const { puzzle, solution } = generateSeededPuzzle(
        'medium',
        createSeededRandom(777),
      );

      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          if (puzzle[row][col] !== null) {
            expect(puzzle[row][col]).toBe(solution[row][col]);
          }
        }
      }
    });
  });

  describe('generateDailyPuzzle', () => {
    it('should generate same puzzle for same date', () => {
      const result1 = generateDailyPuzzle('2026-01-14', 'medium');
      const result2 = generateDailyPuzzle('2026-01-14', 'medium');

      expect(result1.puzzle).toEqual(result2.puzzle);
      expect(result1.solution).toEqual(result2.solution);
    });

    it('should generate different puzzles for different dates', () => {
      const result1 = generateDailyPuzzle('2026-01-14', 'medium');
      const result2 = generateDailyPuzzle('2026-01-15', 'medium');

      expect(result1.puzzle).not.toEqual(result2.puzzle);
    });

    it('should generate different puzzles for same date but different difficulty', () => {
      const result1 = generateDailyPuzzle('2026-01-14', 'easy');
      const result2 = generateDailyPuzzle('2026-01-14', 'hard');

      // Solutions might be the same (same seed for solved board generation)
      // but puzzles should have different number of cells removed
      expect(countEmptyCells(result1.puzzle)).toBe(35); // easy
      expect(countEmptyCells(result2.puzzle)).toBe(55); // hard
    });

    it('should generate valid puzzles for various dates', () => {
      const dates = [
        '2026-01-01',
        '2026-06-15',
        '2026-12-31',
        '2025-01-01',
        '2030-07-04',
      ];

      for (const date of dates) {
        const { puzzle, solution } = generateDailyPuzzle(date, 'medium');

        expect(isValidSudoku(puzzle)).toBe(true);
        expect(isValidSudoku(solution)).toBe(true);
        expect(isComplete(solution)).toBe(true);
      }
    });
  });
});
