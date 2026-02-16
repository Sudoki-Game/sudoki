/**
 * Tests for Match Validation
 *
 * Tests validation of match data to prevent exploits and ensure data integrity.
 */

import type { BaseMatch } from '@/match/types';
import type { Board } from '@/game/types';
import {
  validateMatch,
  parseBoard,
  countEmptyCells,
  calculateMaxScore,
  boardsMatch,
  hasNoConflicts,
  isBoardComplete,
  validateOriginalBoardIntegrity,
  validateAutoSolves,
  validateLives,
  validateWinCondition,
  validateTimestamp,
  calculateStreakBonusForMatch,
  getLastMatchTimestamp,
  getStreakBonusForNewMatch,
} from '../validation';
import { DIFFICULTY_EMPTY_CELLS } from '@/game/util/constants';
import { getUserData } from '@/user/lib/client';
import { getUserStats } from '@/app/actions/user';
import { wouldContinueStreak } from '@/user/lib/stats';

// Mock Firebase before imports
jest.mock('@/firebase/server', () => ({
  serverAuth: {},
  serverDb: {},
}));

jest.mock('@/user/lib/client', () => ({
  getUserData: jest.fn(),
}));

jest.mock('@/app/actions/user', () => ({
  getUserStats: jest.fn(),
}));

jest.mock('@/user/lib/stats', () => ({
  wouldContinueStreak: jest.fn(),
}));

/**
 * Helper: Create a valid test board
 */
function createValidBoard(): Board {
  return [
    [5, 3, 4, 6, 7, 8, 9, 1, 2],
    [6, 7, 2, 1, 9, 5, 3, 4, 8],
    [1, 9, 8, 3, 4, 2, 5, 6, 7],
    [8, 5, 9, 7, 6, 1, 4, 2, 3],
    [4, 2, 6, 8, 5, 3, 7, 9, 1],
    [7, 1, 3, 9, 2, 4, 8, 5, 6],
    [9, 6, 1, 5, 3, 7, 2, 8, 4],
    [2, 8, 7, 4, 1, 9, 6, 3, 5],
    [3, 4, 5, 2, 8, 6, 1, 7, 9],
  ];
}

/**
 * Helper: Create a board with some empty cells
 */
function createPartialBoard(emptyCellCount: number): Board {
  const board = createValidBoard();
  let removed = 0;

  for (let row = 0; row < 9 && removed < emptyCellCount; row++) {
    for (let col = 0; col < 9 && removed < emptyCellCount; col++) {
      board[row][col] = null;
      removed++;
    }
  }

  return board;
}

/**
 * Helper: Create a valid test match
 */
function createValidMatch(overrides: Partial<BaseMatch> = {}): BaseMatch {
  const solution = createValidBoard();
  const originalBoard = createPartialBoard(45); // Medium difficulty
  const board = createValidBoard();

  return {
    id: 'test-match',
    isWon: true,
    difficulty: 'medium',
    score: 500,
    streakBonus: 200,
    autoSolvesCount: 0,
    autoSolves: '[]',
    livesRemaining: 3,
    board: JSON.stringify(board),
    originalBoard: JSON.stringify(originalBoard),
    solution: JSON.stringify(solution),
    timestamp: Date.now(),
    ...overrides,
  };
}

describe('Board Parsing & Structure', () => {
  describe('parseBoard', () => {
    it('should parse valid board JSON', () => {
      const board = createValidBoard();
      const json = JSON.stringify(board);
      const parsed = parseBoard(json);

      expect(parsed).toEqual(board);
    });

    it('should reject invalid JSON', () => {
      expect(parseBoard('not json')).toBeNull();
      expect(parseBoard('{}')).toBeNull();
    });

    it('should reject wrong dimensions', () => {
      expect(parseBoard('[[1,2,3]]')).toBeNull(); // Too small
      expect(
        parseBoard(JSON.stringify(Array(10).fill(Array(9).fill(1)))),
      ).toBeNull(); // 10 rows
    });

    it('should reject invalid cell values', () => {
      const board = createValidBoard();
      board[0][0] = 10; // Invalid value
      expect(parseBoard(JSON.stringify(board))).toBeNull();
    });

    it('should accept boards with null cells', () => {
      const board = createPartialBoard(45);
      const parsed = parseBoard(JSON.stringify(board));
      expect(parsed).toEqual(board);
    });
  });

  describe('countEmptyCells', () => {
    it('should count empty cells correctly', () => {
      expect(countEmptyCells(createPartialBoard(0))).toBe(0);
      expect(countEmptyCells(createPartialBoard(2))).toBe(2);
      expect(countEmptyCells(createPartialBoard(35))).toBe(35);
      expect(countEmptyCells(createPartialBoard(45))).toBe(45);
      expect(countEmptyCells(createPartialBoard(55))).toBe(55);
    });
  });

  describe('calculateMaxScore', () => {
    it('should calculate max score for im-too-young-to-die', () => {
      const maxScore = calculateMaxScore('im-too-young-to-die');
      expect(maxScore).toBe(2 * 20);
    });

    it('should calculate max score for easy', () => {
      const maxScore = calculateMaxScore('easy');
      expect(maxScore).toBe(35 * 20);
    });

    it('should calculate max score for medium', () => {
      const maxScore = calculateMaxScore('medium');
      expect(maxScore).toBe(45 * 20);
    });

    it('should calculate max score for hard', () => {
      const maxScore = calculateMaxScore('hard');
      expect(maxScore).toBe(55 * 20);
    });

    it('should return null for unknown difficulty', () => {
      const maxScore = calculateMaxScore('unknown-difficulty');
      expect(maxScore).toBeNull();
    });
  });

  describe('boardsMatch', () => {
    it('should match identical boards', () => {
      const board1 = createValidBoard();
      const board2 = createValidBoard();

      expect(boardsMatch(board1, board2)).toBe(true);
    });

    it('should detect differences', () => {
      const board1 = createValidBoard();
      const board2 = createValidBoard();
      board2[0][0] = 9;

      expect(boardsMatch(board1, board2)).toBe(false);
    });

    it('should match only non-null cells when specified', () => {
      const board1 = createPartialBoard(10);
      const board2 = createValidBoard();

      expect(boardsMatch(board1, board2, true)).toBe(true);
    });
  });
});

describe('Sudoku Rules', () => {
  describe('hasNoConflicts', () => {
    it('should pass valid board', () => {
      expect(hasNoConflicts(createValidBoard())).toBe(true);
    });

    it('should detect row conflict', () => {
      const board = createValidBoard();
      board[0][1] = board[0][0]; // Duplicate in row

      expect(hasNoConflicts(board)).toBe(false);
    });

    it('should detect column conflict', () => {
      const board = createValidBoard();
      board[1][0] = board[0][0]; // Duplicate in column

      expect(hasNoConflicts(board)).toBe(false);
    });

    it('should detect box conflict', () => {
      const board = createValidBoard();
      board[1][1] = board[0][0]; // Duplicate in 3x3 box

      expect(hasNoConflicts(board)).toBe(false);
    });

    it('should handle partial boards', () => {
      const board = createPartialBoard(45);
      expect(hasNoConflicts(board)).toBe(true);
    });
  });

  describe('isBoardComplete', () => {
    it('should detect complete board', () => {
      expect(isBoardComplete(createValidBoard())).toBe(true);
    });

    it('should detect incomplete board', () => {
      expect(isBoardComplete(createPartialBoard(1))).toBe(false);
    });
  });

  describe('validateOriginalBoardIntegrity', () => {
    it('should pass when original cells unchanged', () => {
      const original = createPartialBoard(45);
      const final = createValidBoard();

      const errors = validateOriginalBoardIntegrity(original, final);
      expect(errors).toHaveLength(0);
    });

    it('should detect changed original cells', () => {
      const original = createValidBoard();
      const final = createValidBoard();
      final[0][0] = 9; // Change a pre-filled cell

      const errors = validateOriginalBoardIntegrity(original, final);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].severity).toBe('critical');
      expect(errors[0].field).toBe('originalBoard');
    });
  });
});

describe('Match Logic Validation', () => {
  describe('validateAutoSolves', () => {
    it('should pass valid autoSolves', () => {
      const match = createValidMatch({
        autoSolvesCount: 2,
        autoSolves: '["0,0","1,1"]',
      });

      const errors = validateAutoSolves(match);
      expect(errors).toHaveLength(0);
    });

    it('should detect count mismatch', () => {
      const match = createValidMatch({
        autoSolvesCount: 5,
        autoSolves: '["0,0","1,1"]', // Only 2 items
      });

      const errors = validateAutoSolves(match);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].severity).toBe('critical');
    });

    it('should reject invalid JSON', () => {
      const match = createValidMatch({
        autoSolves: 'not json',
      });

      const errors = validateAutoSolves(match);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateLives', () => {
    it('should pass valid lives count', () => {
      for (let lives = 0; lives <= 5; lives++) {
        const match = createValidMatch({ livesRemaining: lives });
        const errors = validateLives(match);
        expect(errors).toHaveLength(0);
      }
    });

    it('should reject negative lives', () => {
      const match = createValidMatch({ livesRemaining: -1 });
      const errors = validateLives(match);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].severity).toBe('critical');
    });

    it('should reject lives above maximum', () => {
      const match = createValidMatch({ livesRemaining: 10 });
      const errors = validateLives(match);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].severity).toBe('critical');
    });
  });

  describe('validateWinCondition', () => {
    it('should pass won game with complete board', () => {
      const board = createValidBoard();
      const match = createValidMatch({ isWon: true });

      const errors = validateWinCondition(board, match);
      expect(errors).toHaveLength(0);
    });

    it('should reject won game with incomplete board', () => {
      const board = createPartialBoard(5);
      const match = createValidMatch({ isWon: true });

      const errors = validateWinCondition(board, match);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].severity).toBe('critical');
    });

    it('should pass lost game with 0 lives', () => {
      const board = createPartialBoard(5);
      const match = createValidMatch({ isWon: false, livesRemaining: 0 });

      const errors = validateWinCondition(board, match);
      expect(errors).toHaveLength(0);
    });

    it('should reject lost game with lives remaining', () => {
      const board = createPartialBoard(5);
      const match = createValidMatch({ isWon: false, livesRemaining: 3 });

      const errors = validateWinCondition(board, match);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].severity).toBe('critical');
    });
  });
});

describe('Score Validation', () => {
  it('should pass valid score', () => {
    const match = createValidMatch({ score: 500 });
    const result = validateMatch(match);

    expect(result.isValid).toBe(true);
  });

  it('should reject negative score', () => {
    const match = createValidMatch({ score: -100 });
    const result = validateMatch(match);

    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.field === 'score')).toBe(true);
  });

  it('should reject score above maximum', () => {
    // Medium difficulty (45 cells) = 900 max
    const match = createValidMatch({ score: 1000 });
    const result = validateMatch(match);

    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.field === 'score')).toBe(true);
  });

  it('should accept perfect score', () => {
    // Medium difficulty (45 cells) = 900 max
    const match = createValidMatch({ score: 900 });
    const result = validateMatch(match);

    expect(result.isValid).toBe(true);
  });

  it('should validate streak bonus values', () => {
    const validBonus = createValidMatch({ streakBonus: 200 });
    expect(validateMatch(validBonus).isValid).toBe(true);

    const zeroBonus = createValidMatch({ streakBonus: 0 });
    expect(validateMatch(zeroBonus).isValid).toBe(true);

    const invalidBonus = createValidMatch({ streakBonus: 100 });
    expect(validateMatch(invalidBonus).isValid).toBe(false);
  });
});

describe('Timestamp Validation', () => {
  describe('validateTimestamp', () => {
    it('should pass current timestamp', () => {
      const errors = validateTimestamp(Date.now());
      expect(errors.filter((e) => e.severity === 'critical')).toHaveLength(0);
    });

    it('should reject future timestamp', () => {
      const future = Date.now() + 10 * 60 * 1000; // 10 minutes future
      const errors = validateTimestamp(future);

      expect(errors.some((e) => e.severity === 'critical')).toBe(true);
    });

    it('should allow small clock skew', () => {
      const slightlyFuture = Date.now() + 2 * 60 * 1000; // 2 minutes
      const errors = validateTimestamp(slightlyFuture);

      expect(errors.filter((e) => e.severity === 'critical')).toHaveLength(0);
    });

    it('should warn on very old timestamp', () => {
      const oldTimestamp = Date.now() - 400 * 24 * 60 * 60 * 1000; // Over 1 year
      const errors = validateTimestamp(oldTimestamp);

      expect(errors.some((e) => e.severity === 'warning')).toBe(true);
    });
  });
});

describe('Full Match Validation', () => {
  it('should pass completely valid match', () => {
    const match = createValidMatch();
    const result = validateMatch(match);

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should pass lost game with incorrect board values', () => {
    const solution = createValidBoard();
    const board = createValidBoard();
    board[0][0] = 9; // Wrong value
    const originalBoard = createPartialBoard(45);

    const match = createValidMatch({
      isWon: false,
      livesRemaining: 0,
      board: JSON.stringify(board),
      solution: JSON.stringify(solution),
      originalBoard: JSON.stringify(originalBoard),
    });

    const result = validateMatch(match);

    expect(result.isValid).toBe(true); // Lost games can have wrong values
  });

  it('should reject won game with incorrect board values', () => {
    const solution = createValidBoard();
    const board = createValidBoard();
    board[0][0] = 9; // Wrong value
    const originalBoard = createPartialBoard(45);

    const match = createValidMatch({
      isWon: true,
      board: JSON.stringify(board),
      solution: JSON.stringify(solution),
      originalBoard: JSON.stringify(originalBoard),
    });

    const result = validateMatch(match);

    expect(result.isValid).toBe(false);
    expect(
      result.errors.some((e) => e.message.includes('do not match solution')),
    ).toBe(true);
  });

  it('should reject match with invalid board JSON', () => {
    const match = createValidMatch({ board: 'invalid json' });
    const result = validateMatch(match);

    expect(result.isValid).toBe(false);
    expect(result.errors[0].field).toBe('boards');
  });

  it('should detect multiple errors', () => {
    const match = createValidMatch({
      score: -100, // Invalid
      livesRemaining: 10, // Invalid
      autoSolvesCount: 5, // Invalid (doesn't match array)
    });

    const result = validateMatch(match);

    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(2);
  });

  it('should separate errors and warnings', () => {
    const oldTimestamp = Date.now() - 400 * 24 * 60 * 60 * 1000;
    const match = createValidMatch({ timestamp: oldTimestamp });

    const result = validateMatch(match);

    expect(result.isValid).toBe(true); // Warnings don't fail validation
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('should reject match with unknown difficulty', () => {
    const match = createValidMatch({
      difficulty: 'invalid-difficulty' as keyof typeof DIFFICULTY_EMPTY_CELLS,
    });
    const result = validateMatch(match);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'difficulty',
      message: 'Unknown difficulty: invalid-difficulty',
      severity: 'critical',
    });
  });
});

describe('Streak Helper Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateStreakBonusForMatch', () => {
    it('returns 0 when there is no previous match', () => {
      expect(calculateStreakBonusForMatch(null)).toBe(0);
    });

    it('returns bonus when streak would continue', () => {
      (wouldContinueStreak as jest.Mock).mockReturnValue(true);

      expect(calculateStreakBonusForMatch(Date.now() - 24 * 60 * 60 * 1000)).toBe(
        200,
      );
    });

    it('returns 0 when streak is broken', () => {
      (wouldContinueStreak as jest.Mock).mockReturnValue(false);

      expect(calculateStreakBonusForMatch(Date.now() - 3 * 24 * 60 * 60 * 1000)).toBe(
        0,
      );
    });
  });

  describe('getLastMatchTimestamp', () => {
    it('gets timestamp from server stats for authenticated users', async () => {
      (getUserStats as jest.Mock).mockResolvedValue({ lastMatchTimestamp: 12345 });

      await expect(getLastMatchTimestamp('user-1')).resolves.toBe(12345);
      expect(getUserStats).toHaveBeenCalledWith('user-1');
    });

    it('returns null when server stats are missing timestamp', async () => {
      (getUserStats as jest.Mock).mockResolvedValue(undefined);

      await expect(getLastMatchTimestamp('user-2')).resolves.toBeNull();
    });

    it('gets timestamp from local user data for anonymous users', async () => {
      (getUserData as jest.Mock).mockResolvedValue({ lastMatchTimestamp: 54321 });

      await expect(getLastMatchTimestamp(null)).resolves.toBe(54321);
      expect(getUserData).toHaveBeenCalledTimes(1);
    });
  });

  describe('getStreakBonusForNewMatch', () => {
    it('calculates bonus based on resolved last match timestamp', async () => {
      (getUserStats as jest.Mock).mockResolvedValue({
        lastMatchTimestamp: 1700000000000,
      });
      (wouldContinueStreak as jest.Mock).mockReturnValue(true);

      await expect(getStreakBonusForNewMatch('user-3')).resolves.toBe(200);
    });
  });
});
