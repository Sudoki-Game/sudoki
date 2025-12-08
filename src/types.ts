/**
 * Sudoku Game — Copyright (c) 2025 Dylan Almond
 * @license GNU General Public License v3.0
 */

export type Difficulty = 'easy' | 'medium' | 'hard' | 'im-too-young-to-die';
export type GameStatus = 'win' | 'lose' | 'playing' | 'idle';
export type Board = (number | null)[][];

export type Selection = { row: number | null; col: number | null };

export type GameState = {
  /**
   * The active Sudoku board
   */
  board: Board;

  /**
   * The pre-generated unfinished Sudoku board
   */
  originalBoard: Board;

  /**
   * The solved Sudoku board
   */
  solution: Board;

  /**
   * Game score
   */
  score: number;

  /**
   * Lives remaining
   */
  lives: number;

  /**
   * The game status
   */
  status: GameStatus;

  /**
   * The selected cell coords
   */
  selected: Selection;

  /**
   * Map of all conflicting cells and their occurrences.
   * Key is "row,col" string, value is the conflict count.
   */
  conflicts: Map<string, number>;

  /**
   * Set of all hint cells added to the board.
   * Each key is a "row,col" string.
   */
  hints: Set<string>;

  /**
   * The number currently being dragged
   */
  dragValue: number | null;

  /**
   * Whether to show the solved grid
   */
  showSolution: boolean;
};

export type GameAction =
  | { type: 'NEW_GAME'; payload: { board: Board; solution: Board } }
  | { type: 'SELECT_CELL'; row: number; col: number }
  | { type: 'SET_CONFLICTS'; conflicts: Map<string, number> }
  | { type: 'ADD_HINT'; row: number; col: number }
  | { type: 'SET_DRAG_VALUE'; value: number | null }
  | { type: 'UPDATE_BOARD'; board: Board }
  | { type: 'SET_SCORE'; score: number }
  | { type: 'SET_LIVES'; lives: number }
  | { type: 'SET_STATUS'; status: GameStatus }
  | { type: 'SHOW_SOLUTION'; show: boolean }
  | { type: 'RESET_SELECTION' };
