import { type Board, type Difficulty } from '../types';

/**
 * Generates an empty 9x9 Sudoku board.
 * @returns 9x9 array filled with nulls
 */
export function createEmptyBoard(): Board {
  return Array.from({ length: 9 }, () => Array(9).fill(null));
}

/**
 * Checks if the Sudoku board is completely filled and has no conflicts.
 * @param board - The current Sudoku board.
 * @param conflicts - Map of cell keys to their conflicting cell keys.
 * @returns True if the board is complete and valid, false otherwise.
 */
export function isGameWon(
  board: Board,
  conflicts: Map<string, number>,
): boolean {
  // Check for any empty cells
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === null) return false;
    }
  }
  // Check for any conflicts
  return conflicts.size === 0;
}

/**
 * Computes the set of highlighted cell keys for a given selection.
 * Highlights row, column, block, and matching values.
 * @param row - Selected row index.
 * @param col - Selected column index.
 * @param grid - The current Sudoku board.
 * @returns Set of highlighted cell keys ("row,col").
 */
export function computeHighlights(
  row: number,
  col: number,
  grid: Board,
): Set<string> {
  const set: Set<string> = new Set();

  // Row and column peers
  for (let i = 0; i < 9; i++) {
    set.add(`${row},${i}`);
    set.add(`${i},${col}`);
  }

  // Block peers
  const br = Math.floor(row / 3) * 3;
  const bc = Math.floor(col / 3) * 3;
  for (let i = 0; i < 9; i++) {
    set.add(`${br + Math.floor(i / 3)},${bc + (i % 3)}`);
  }

  // Highlight matching values (single pass)
  const value = grid[row][col];
  if (value !== null) {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (grid[row][col] === value) {
          set.add(`${row},${col}`);
        }
      }
    }
  }

  return set;
}

/**
 * Returns a map of conflicting cell keys and how many times they conflict
 * for a given value placement. Checks row, column, and block for duplicate values.
 * @param board - The current Sudoku board.
 * @param row - Row index of the cell to check.
 * @param col - Column index of the cell to check.
 * @param val - Value to check for conflicts.
 * @returns Map of conflicting cell keys ("row,col") to conflict count.
 */
export function getConflicts(
  board: Board,
  row: number,
  col: number,
  val: number,
): Map<string, number> {
  const conflicts = new Map<string, number>();

  // Row and column
  for (let i = 0; i < 9; i++) {
    if (i !== col && board[row][i] === val) {
      conflicts.set(`${row},${i}`, (conflicts.get(`${row},${i}`) ?? 0) + 1);
      conflicts.set(`${row},${col}`, (conflicts.get(`${row},${col}`) ?? 0) + 1);
    }
    if (i !== row && board[i][col] === val) {
      conflicts.set(`${i},${col}`, (conflicts.get(`${i},${col}`) ?? 0) + 1);
      conflicts.set(`${row},${col}`, (conflicts.get(`${row},${col}`) ?? 0) + 1);
    }
  }

  // Block
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      const r = boxRow + i,
        c = boxCol + j;
      if ((r !== row || c !== col) && board[r][c] === val) {
        conflicts.set(`${r},${c}`, (conflicts.get(`${r},${c}`) ?? 0) + 1);
        conflicts.set(
          `${row},${col}`,
          (conflicts.get(`${row},${col}`) ?? 0) + 1,
        );
      }
    }
  }

  return conflicts;
}

/**
 * Removes all conflicts associated with a specific cell and value from the conflicts map.
 * For each cell that was in conflict with the given cell (as determined by getConflicts),
 * decrements its conflict count by the number of conflicts, or removes it entirely if the count reaches zero.
 * The cell being removed is always deleted from the map.
 *
 * @param board - The current Sudoku board.
 * @param conflicts - The current map of cell keys to their conflict counts.
 * @param row - The row index of the cell being removed.
 * @param col - The column index of the cell being removed.
 * @param value - The value being removed from the cell.
 * @returns Map with updated conflict counts.
 */
export function removeConflictsForCell(
  board: Board,
  conflicts: Map<string, number>,
  row: number,
  col: number,
  value: number,
): Map<string, number> {
  const targetConflicts = getConflicts(board, row, col, value);
  const newConflicts = new Map(conflicts);
  const cellKey = `${row},${col}`;

  for (const [key, count] of targetConflicts.entries()) {
    if (key === cellKey) continue; // We'll remove this cell entirely below
    const current = newConflicts.get(key) ?? 0;
    if (current <= count) {
      newConflicts.delete(key);
    } else {
      newConflicts.set(key, current - count);
    }
  }

  newConflicts.delete(cellKey);
  return newConflicts;
}

/**
 * Shuffles an array in place using the provided random function.
 * Uses Fisher-Yates shuffle algorithm.
 *
 * @param array - The array to shuffle
 * @param random - A function returning a random number between 0 and 1
 * @returns The shuffled array (same reference)
 */
export function shuffleWithRandom<T>(array: T[], random: () => number): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * Checks if placing a value at the given position causes conflicts.
 * Lighter weight than getConflicts() - just returns boolean.
 */
function hasConflict(
  board: Board,
  row: number,
  col: number,
  val: number,
): boolean {
  // Check row and column
  for (let i = 0; i < 9; i++) {
    if (i !== col && board[row][i] === val) return true;
    if (i !== row && board[i][col] === val) return true;
  }

  // Check 3x3 box
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      const r = boxRow + i;
      const c = boxCol + j;
      if ((r !== row || c !== col) && board[r][c] === val) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Generates a fully solved Sudoku board using backtracking with a custom random function.
 * @param random - A function returning a random number between 0 and 1
 * @returns A valid, completely filled Sudoku board.
 */
export function generateSeededSolvedSudoku(random: () => number): Board {
  const board = createEmptyBoard();

  function solve(): boolean {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (board[row][col] === null) {
          // Create and shuffle numbers 1-9 with provided random
          const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
          shuffleWithRandom(nums, random);

          for (const num of nums) {
            if (!hasConflict(board, row, col, num)) {
              board[row][col] = num;

              if (solve()) {
                return true;
              }

              board[row][col] = null;
            }
          }

          return false;
        }
      }
    }
    return true;
  }

  solve();
  return board;
}

/**
 * Generates a Sudoku puzzle and its solution for a given difficulty using a seeded random.
 * @param difficulty - The desired puzzle difficulty.
 * @param random - A function returning a random number between 0 and 1
 * @returns The puzzle (with cells removed) and its solution.
 */
export function generateSeededPuzzle(
  difficulty: Difficulty,
  random: () => number,
): {
  puzzle: Board;
  solution: Board;
} {
  const solution = generateSeededSolvedSudoku(random);
  const puzzle: Board = solution.map((row) => [...row]);

  // Number of cells to remove based on difficulty
  let cellsToRemove: number;
  switch (difficulty) {
    case 'im-too-young-to-die':
      cellsToRemove = 2;
      break;
    case 'easy':
      cellsToRemove = 35;
      break;
    case 'medium':
      cellsToRemove = 45;
      break;
    case 'hard':
      cellsToRemove = 55;
      break;
    default:
      cellsToRemove = 45;
  }

  // Create array of all positions and shuffle with seeded random
  const positions: [number, number][] = [];
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      positions.push([i, j]);
    }
  }
  shuffleWithRandom(positions, random);

  // Remove cells
  for (let i = 0; i < cellsToRemove && i < positions.length; i++) {
    const [row, col] = positions[i];
    puzzle[row][col] = null;
  }

  return { puzzle, solution };
}

/**
 * Creates a seeded pseudo-random number generator using Mulberry32 algorithm.
 * Same seed always produces the same sequence of numbers.
 *
 * @param seed - The seed value to initialize the generator
 * @returns A function that returns a random number between 0 and 1
 */
export function createSeededRandom(seed: number): () => number {
  let state = seed;

  return function (): number {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Converts a date string to a numeric seed.
 * e.g., "2026-01-14" → 20260114
 *
 * @param dateString - ISO date string (YYYY-MM-DD)
 * @returns Numeric seed value
 */
export function dateToSeed(dateString: string): number {
  return parseInt(dateString.replace(/-/g, ''), 10);
}

/**
 * Gets today's date string in UTC.
 * @returns Date string in YYYY-MM-DD format
 */
export function getTodayDateString(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

/**
 * Generates a puzzle deterministically based on a date string.
 * Everyone gets the same puzzle on the same day.
 *
 * @param dateString - The date in YYYY-MM-DD format
 * @param difficulty - The puzzle difficulty level
 * @returns The puzzle and its solution
 */
export function generateDailyPuzzle(
  dateString: string,
  difficulty: Difficulty = 'medium',
): { puzzle: Board; solution: Board } {
  const seed = dateToSeed(dateString);
  const random = createSeededRandom(seed);

  return generateSeededPuzzle(difficulty, random);
}
