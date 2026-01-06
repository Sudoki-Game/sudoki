/**
 * Sudoku Game — Copyright (c) 2025 Dylan Almond
 * @license GNU General Public License v3.0
 */

'use client';

import { createContext, useContext, useEffect, useReducer, useState } from 'react';
import type { GameAction, GameState } from '../types';
import { type DragStartEvent, type DragEndEvent } from '@dnd-kit/core';
import {
  generatePuzzledifficulty,
  removeConflictsForCell,
  getConflicts,
  isGameWon,
  createEmptyBoard,
  computeHighlights
} from '../../util/util';
import {
  MAX_LIVES,
  SCORE_CORRECT_CELL,
  SCORE_CONFLICT_PENALTY,
  SCORE_REMOVED_VALID_CELL
} from '@/util/constants';
import { playSound } from '@/util/sound';
import { completeGame, hasPlayedToday } from '@/app/actions/game';
import {
  saveLastMatch,
  getCurrentMatch,
  isLastMatchFromToday,
  getLocalUserData,
  saveLocalUserData
} from '@/util/localStorage';
import { useAuth } from '../../context/AuthContext';

type SudokuGameProviderProps = {
  children: React.ReactNode;
};

export type SudokuGameProviderState = {
  /**
   * Core game state
   */
  game: GameState;

  /**
   * Game ready check
   */
  isReady: boolean;

  /**
   * Game paused check
   */
  isPaused: boolean;

  /**
   * Game state dispatcher
   */
  dispatch: React.ActionDispatch<[action: GameAction]>;

  /**
   * Update Cell
   */
  updateCell: (row: number, col: number, value: number | null) => void;

  /**
   * Drag start handler (DnD Kit)
   */
  handleDragStart: (e: DragStartEvent) => void;

  /**
   * Drop handler (DnD Kit)
   */
  handleDrop: (e: DragEndEvent) => void;

  /**
   * Cell click handler
   */
  handleClick: (row: number, col: number) => void;

  /**
   * Start a new Sudoku game
   */
  newGame: () => void;

  /**
   * Fill in a random cell on the game board
   */
  autoSolve: () => void;

  /**
   * Toggle game pause
   */
  togglePause: (override?: boolean) => void;
};

const initialState: GameState = {
  board: createEmptyBoard(),
  originalBoard: createEmptyBoard(),
  solution: createEmptyBoard(),
  score: 0,
  lives: 0,
  status: 'idle',
  selected: { row: null, col: null },
  highlights: new Set(),
  conflicts: new Map(),
  autoSolves: new Set(),
  dragValue: null,
  showSolution: false,
  difficulty: 'medium'
};

/**
 * Game state modifiers
 * @returns
 */
function reducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'NEW_GAME':
      return {
        ...state,
        board: action.payload.board,
        originalBoard: action.payload.board,
        solution: action.payload.solution,
        difficulty: action.payload.difficulty,
        score: 0,
        lives: MAX_LIVES,
        status: 'playing',
        selected: { row: null, col: null },
        highlights: new Set(),
        conflicts: new Map(),
        autoSolves: new Set(),
        dragValue: null,
        showSolution: false
      };
    case 'SELECT_CELL': {
      const highlights: Set<string> =
        action.row != null && action.col != null
          ? computeHighlights(action.row, action.col, state.board)
          : new Set();

      return { ...state, selected: { row: action.row, col: action.col }, highlights: highlights };
    }
    case 'RESET_SELECTION':
      return { ...state, selected: { row: null, col: null }, highlights: new Set() };
    case 'SET_CONFLICTS':
      return { ...state, conflicts: action.conflicts };
    case 'SET_DRAG_VALUE':
      return { ...state, dragValue: action.value };
    case 'UPDATE_BOARD':
      return { ...state, board: action.board };
    case 'SET_SCORE':
      return { ...state, score: action.score };
    case 'SET_LIVES':
      return { ...state, lives: action.lives };
    case 'SET_STATUS':
      return { ...state, status: action.status };
    case 'SHOW_SOLUTION':
      return { ...state, showSolution: action.show };
    case 'AUTO_SOLVE': {
      const autoSolves = new Set(state.autoSolves);
      autoSolves.add(`${action.row},${action.col}`);
      // Auto-Solves cost a life
      const lives = state.lives - 1;
      return { ...state, autoSolves, lives };
    }
    case 'LOAD_MATCH_DATA': {
      const {
        originalBoard,
        board,
        solution,
        score,
        autoSolvePositions,
        gameStatus: status,
        livesRemaining: lives
      } = action.match;
      return {
        ...state,
        originalBoard: JSON.parse(originalBoard),
        board: JSON.parse(board),
        solution: JSON.parse(solution),
        autoSolves: new Set(JSON.parse(autoSolvePositions)),
        score,
        status,
        lives
      };
    }
    default:
      return state;
  }
}

const SudokuGameContext = createContext<SudokuGameProviderState | undefined>(undefined);

/**
 * Provides Sudoku game state and logic.
 * @returns
 */
export function SudokuGameProvider({ children }: SudokuGameProviderProps) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const { user } = useAuth();

  /**
   * Grid of all fixed cells
   */
  const fixedCells = state.originalBoard.map((row) => row.map((val) => val !== null));

  /**
   * Toggle pause state - only works during active gameplay
   */
  const togglePause = (override?: boolean) => {
    if (state.status !== 'playing') return;

    const shouldPause = override ?? !isReady;

    setIsPaused((prev) => override ?? !prev);

    if (shouldPause) {
      dispatch({ type: 'RESET_SELECTION' });
    }
  };

  /**
   * Starts a new game.
   * Generates board and resets state.
   */
  const newGame = () => {
    const difficulty = 'medium';
    const { puzzle, solution } = generatePuzzledifficulty(difficulty);
    dispatch({ type: 'NEW_GAME', payload: { board: puzzle, solution, difficulty } });
    setIsReady(true);
    setIsPaused(false);
  };

  /**
   * Handle cell selection.
   */
  const handleClick = (row: number, col: number) => {
    if (isPaused || state.status !== 'playing') return;

    // Select sound
    playSound('/game/audio/metronome.mp3', { pitch: 1.8 });

    dispatch({ type: 'SELECT_CELL', row, col });
  };

  /**
   * Handle dragging start.
   * Capture value and select source cell.
   */
  const handleDragStart = (e: DragStartEvent) => {
    if (isPaused || state.status !== 'playing') return;
    const cell = e.active.data.current?.cell;

    if (!cell) return;

    const isBoardCell = cell.row != null && cell.col != null;

    dispatch({ type: 'SET_DRAG_VALUE', value: cell.value });

    // Play pickup sound
    playSound('/game/audio/metronome.mp3', { pitch: 2 });

    if (isBoardCell) {
      dispatch({ type: 'SELECT_CELL', row: cell.row, col: cell.col });
    }
  };

  /**
   * Determines if a drop is invalid (no move or fixed cell.)
   */
  const isInvalidDrop = (
    sourceRow: number | undefined,
    sourceCol: number | undefined,
    targetRow: number,
    targetCol: number
  ) =>
    !state.dragValue ||
    fixedCells[targetRow][targetCol] ||
    (sourceRow === targetRow && sourceCol === targetCol);

  /**
   * Extracted score deduction logic
   */
  const deductScoreForValidCell = (
    conflicts: Map<string, number>,
    row: number,
    col: number
  ): number => {
    return conflicts.has(`${row},${col}`) ? 0 : -SCORE_REMOVED_VALID_CELL;
  };

  /**
   * Clears a source cell when dropped out of bounds.
   */
  const handleOutOfBounds = (sourceRow: number, sourceCol: number) => {
    if (isPaused || state.status !== 'playing') return;

    let deltaScore = 0;

    const sourceValue = state.board[sourceRow][sourceCol];

    // Remove the cell from the board
    const newBoard = state.board.map((r) => [...r]);
    newBoard[sourceRow][sourceCol] = null;
    dispatch({ type: 'UPDATE_BOARD', board: newBoard });

    // Update conflicts map
    let newConflicts = new Map(state.conflicts);

    // Remove source conflcits
    if (sourceValue !== null) {
      // Deduct previously granted score if source is a valid cell
      deltaScore = deductScoreForValidCell(newConflicts, sourceRow, sourceCol);
      newConflicts = removeConflictsForCell(
        state.board,
        newConflicts,
        sourceRow,
        sourceCol,
        sourceValue
      );
    }

    // Delete the source cell
    newConflicts.delete(`${sourceRow},${sourceCol}`);

    // Play delete sound
    playSound('/game/audio/metronome.mp3', { pitch: 0.9 });

    dispatch({ type: 'SET_CONFLICTS', conflicts: newConflicts });
    dispatch({ type: 'SET_SCORE', score: Math.max(state.score + deltaScore, 0) });
    dispatch({ type: 'SET_DRAG_VALUE', value: null });
    dispatch({ type: 'RESET_SELECTION' });
  };

  /**
   * Handles in-bounds drop.
   * Moves value, computes conflicts and updates state.
   */
  const handleInBounds = (
    sourceRow: number | undefined,
    sourceCol: number | undefined,
    targetRow: number,
    targetCol: number
  ) => {
    if (isPaused || state.status !== 'playing') return;

    let deltaScore = 0;
    let newLives = state.lives;

    const newBoard = state.board.map((r) => [...r]);
    let newConflicts = new Map(state.conflicts);
    const value = state.dragValue!;

    // If we have no source to check, check the value at the target
    if (sourceRow == null || sourceCol == null) {
      sourceRow = targetRow;
      sourceCol = targetCol;
    }

    // Remove the source cell and deduct any points given
    const sourceValue = state.board[sourceRow][sourceCol];
    newBoard[sourceRow][sourceCol] = null;

    // Remove source conflcits
    if (sourceValue !== null) {
      // Deduct previously granted score if source is a valid cell
      if (!newConflicts.has(`${sourceRow},${sourceCol}`)) {
        deltaScore -= SCORE_REMOVED_VALID_CELL;
      }

      newConflicts = removeConflictsForCell(
        state.board,
        newConflicts,
        sourceRow,
        sourceCol,
        sourceValue
      );
    }

    // Remove the current target cell
    const currentTargetValue = state.board[targetRow][targetCol];
    newBoard[targetRow][targetCol] = null;

    // Remove current target conflcits
    if (currentTargetValue !== null) {
      console.log(currentTargetValue);

      newConflicts = removeConflictsForCell(
        state.board,
        newConflicts,
        targetRow,
        targetCol,
        currentTargetValue
      );
    }

    // Add our new value to the board
    newBoard[targetRow][targetCol] = value;

    // Check for conflicts
    const targetConflicts = getConflicts(newBoard, targetRow, targetCol, value);

    // Score + lives handling
    if (targetConflicts.size) {
      // Increment conflict count for each cell in conflict
      for (const [conflictKey, countToAdd] of targetConflicts.entries()) {
        const current = newConflicts.get(conflictKey) ?? 0;
        newConflicts.set(conflictKey, current + countToAdd);
      }
      newLives -= 1;
      deltaScore -= SCORE_CONFLICT_PENALTY;
    } else if (!state.board[targetRow][targetCol]) {
      deltaScore += SCORE_CORRECT_CELL;
    }

    dispatch({ type: 'UPDATE_BOARD', board: newBoard });
    dispatch({ type: 'SET_CONFLICTS', conflicts: newConflicts });
    dispatch({ type: 'SET_LIVES', lives: newLives });
    dispatch({ type: 'SET_SCORE', score: Math.max(state.score + deltaScore, 0) });
    dispatch({ type: 'SELECT_CELL', row: targetRow, col: targetCol });
    dispatch({ type: 'SET_DRAG_VALUE', value: null });

    // Check for game completion
    if (newLives < 1) {
      handleGameCompletion('lose', {
        ...state,
        board: newBoard,
        conflicts: newConflicts,
        lives: newLives,
        score: Math.max(state.score + deltaScore, 0)
      });
    } else if (isGameWon(newBoard, newConflicts)) {
      handleGameCompletion('win', {
        ...state,
        board: newBoard,
        conflicts: newConflicts,
        lives: newLives,
        score: Math.max(state.score + deltaScore, 0)
      });
    }
  };

  /**
   * Main drop handler.
   * Delegates to out-of-bounds or in-bounds handlers.
   */
  const handleDrop = (e: DragEndEvent) => {
    if (isPaused || state.status !== 'playing') return;

    const { over, active } = e;
    if (!active) return;

    const { row: sourceRow, col: sourceCol } = active.data.current?.cell ?? {};
    const sourceIsCell = sourceRow != null && sourceCol != null;

    // Handle missing target
    if (!over) {
      if (sourceIsCell) handleOutOfBounds(sourceRow!, sourceCol!);

      dispatch({ type: 'SET_DRAG_VALUE', value: null });
      return;
    }

    const { row: targetRow, col: targetCol } = over.data.current!.cell;
    if (isInvalidDrop(sourceRow, sourceCol, targetRow, targetCol)) return;

    // We've dropped onto a valid cell
    handleInBounds(sourceRow, sourceCol, targetRow, targetCol);

    // Play drop sound
    playSound('/game/audio/metronome.mp3', { pitch: 1.4 });
  };

  /**
   * Update a cell.
   */
  const updateCell = (row: number, col: number, value: number | null) => {
    if (isPaused || state.status !== 'playing') return;

    // Make sure cell is editable
    if (state.originalBoard[row][col]) return;

    // Ignore if the target cell is auto-solved
    if (state.autoSolves.has(`${row},${col}`)) return;

    // Ignore if the target cell contains the same value
    if (state.board[row][col] === value) return;

    // We're updating a valid cell
    let deltaScore = 0;
    let newLives = state.lives;
    const newBoard = state.board.map((r) => [...r]);
    let newConflicts = new Map(state.conflicts);

    const currentTargetValue = state.board[row][col];

    // Remove the current target cell
    newBoard[row][col] = null;

    // Remove current target conflcits
    if (currentTargetValue !== null) {
      console.log(currentTargetValue);

      newConflicts = removeConflictsForCell(
        state.board,
        newConflicts,
        row,
        col,
        currentTargetValue
      );
    }

    // Add our new value to the board
    newBoard[row][col] = value;

    // Handle numerical (non-null) value
    if (value !== null) {
      // Check for conflicts
      const targetConflicts = getConflicts(newBoard, row, col, value);

      // Score + lives handling
      if (targetConflicts.size) {
        // Increment conflict count for each cell in conflict
        for (const [conflictKey, countToAdd] of targetConflicts.entries()) {
          const current = newConflicts.get(conflictKey) ?? 0;
          newConflicts.set(conflictKey, current + countToAdd);
        }
        newLives -= 1;
        deltaScore -= SCORE_CONFLICT_PENALTY;
      } else if (!state.board[row][col]) {
        deltaScore += SCORE_CORRECT_CELL;
      }
    }

    dispatch({ type: 'UPDATE_BOARD', board: newBoard });
    dispatch({ type: 'SET_CONFLICTS', conflicts: newConflicts });
    dispatch({ type: 'SET_LIVES', lives: newLives });
    dispatch({ type: 'SET_SCORE', score: Math.max(state.score + deltaScore, 0) });
    // dispatch({ type: 'SELECT_CELL', row: row, col: col });
    dispatch({ type: 'SET_DRAG_VALUE', value: null });

    // Check for game completion
    if (newLives < 1) {
      handleGameCompletion('lose', {
        ...state,
        board: newBoard,
        conflicts: newConflicts,
        lives: newLives,
        score: Math.max(state.score + deltaScore, 0)
      });
    } else if (isGameWon(newBoard, newConflicts)) {
      handleGameCompletion('win', {
        ...state,
        board: newBoard,
        conflicts: newConflicts,
        lives: newLives,
        score: Math.max(state.score + deltaScore, 0)
      });
    }
  };

  /**
   * Fill in a random cell on the game board
   */
  const autoSolve = () => {
    if (isPaused || state.status !== 'playing' || state.lives < 1) return;

    // Collect all empty, non-fixed cells
    const emptyCells: Array<{ r: number; c: number }> = [];
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (!fixedCells[r][c] && state.board[r][c] === null) {
          emptyCells.push({ r, c });
        }
      }
    }
    if (emptyCells.length === 0) return;

    // Pick a random cell
    const randomIndex = Math.floor(
      crypto.getRandomValues(new Uint32Array(1))[0] % emptyCells.length
    );
    const { r, c } = emptyCells[randomIndex];

    const newBoard = state.board.map((row) => [...row]);
    newBoard[r][c] = state.solution[r][c];

    const newConflicts = new Map(state.conflicts);
    newConflicts.delete(`${r},${c}`);

    // Auto-solve costs a life
    const newLives = state.lives - 1;

    dispatch({ type: 'UPDATE_BOARD', board: newBoard });
    dispatch({ type: 'SET_CONFLICTS', conflicts: newConflicts });
    dispatch({ type: 'SELECT_CELL', row: r, col: c });
    dispatch({ type: 'AUTO_SOLVE', row: r, col: c });

    // Check for game completion
    if (newLives < 1) {
      handleGameCompletion('lose', {
        ...state,
        board: newBoard,
        conflicts: newConflicts,
        lives: newLives
      });
    } else if (isGameWon(newBoard, newConflicts)) {
      handleGameCompletion('win', {
        ...state,
        board: newBoard,
        conflicts: newConflicts,
        lives: newLives
      });
    }
  };

  /**
   * Handle game completion (win/lose) and submit to server
   */
  const handleGameCompletion = async (newStatus: 'win' | 'lose', completedState: GameState) => {
    // For unauthenticated users, check localStorage to prevent multiple plays per day
    if (!user?.uid) {
      const lastMatch = getCurrentMatch();
      if (lastMatch && isLastMatchFromToday(lastMatch.timestamp)) {
        console.warn('[SudokuContext] User already played today');
        return;
      }

      // Calculate and update local stats for unauthenticated users
      const localStats = getLocalUserData();
      const timestamp = Date.now();
      const gameStatus = newStatus;
      const score = completedState.score;

      // Calculate streak updates
      let newDailyStreak = localStats.dailyStreak || 0;
      let newBestStreak = localStats.bestStreak || 0;
      let isKeepingStreak = false;
      let streakBonus = 0;

      if (localStats.lastMatchTimestamp) {
        const lastMatchDate = new Date(localStats.lastMatchTimestamp);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const lastMatchDateOnly = new Date(
          lastMatchDate.getFullYear(),
          lastMatchDate.getMonth(),
          lastMatchDate.getDate()
        );
        const yesterdayDateOnly = new Date(
          yesterday.getFullYear(),
          yesterday.getMonth(),
          yesterday.getDate()
        );

        if (lastMatchDateOnly.getTime() === yesterdayDateOnly.getTime()) {
          // User played yesterday, continue the streak
          newDailyStreak += 1;
          isKeepingStreak = true;
        } else if (lastMatchDateOnly.getTime() < yesterdayDateOnly.getTime()) {
          // User played more than 1 day ago, reset streak
          newDailyStreak = 1;
        }
      } else {
        // First match ever
        newDailyStreak = 1;
      }

      // Update best streak if current streak is better
      if (newDailyStreak > newBestStreak) {
        newBestStreak = newDailyStreak;
      }

      // Give streak bonus on wins when keeping streak
      if (gameStatus === 'win' && isKeepingStreak) {
        streakBonus = 200;
      }

      // Update personal best score
      let newPersonalBestScore = localStats.personalBestScore || 0;
      if (score > newPersonalBestScore) {
        newPersonalBestScore = score;
      }

      // Calculate final score with streak bonus
      const finalScore = score + streakBonus;

      // Update and save local stats
      const updatedStats = {
        combinedScore: localStats.combinedScore + finalScore,
        dailyStreak: newDailyStreak,
        bestStreak: newBestStreak,
        matchesPlayed: localStats.matchesPlayed + 1,
        personalBestScore: newPersonalBestScore,
        lastMatchTimestamp: timestamp
      };
      saveLocalUserData(updatedStats);

      // Save match with streak bonus
      saveLastMatch({
        id: `anon_${timestamp}`,
        score,
        streakBonus,
        difficulty: completedState.difficulty,
        autoSolves: completedState.autoSolves.size,
        autoSolvePositions: JSON.stringify(Array.from(completedState.autoSolves)),
        gameStatus,
        livesRemaining: completedState.lives,
        originalBoard: JSON.stringify(completedState.originalBoard),
        board: JSON.stringify(completedState.board),
        solution: JSON.stringify(completedState.solution),
        timestamp
      });

      dispatch({ type: 'SET_STATUS', status: newStatus });
      return;
    }

    // For authenticated users, submit to server
    const stateToSubmit = { ...completedState, status: newStatus };
    try {
      const result = await completeGame(stateToSubmit);

      if (!result.success) {
        console.error('[SudokuContext] Game completion rejected:', result.error);
        return;
      }

      // Save last match to localStorage for authenticated users too
      if (result.match) {
        saveLastMatch(result.match);
      }
    } catch (error) {
      console.error('[SudokuContext] Failed to submit game completion:', error);
    }

    dispatch({ type: 'SET_STATUS', status: newStatus });
  };

  /**
   * Initialize on mount - check if user already played today
   * For unauthenticated: check localStorage
   * For authenticated: check both localStorage and server
   */
  useEffect(() => {
    const initializeGame = async () => {
      const lastMatch = getCurrentMatch();
      const hasLocalMatch = lastMatch && isLastMatchFromToday(lastMatch.timestamp);

      // For authenticated users, also check server
      if (user?.uid) {
        const hasServerMatch = await hasPlayedToday();

        if (hasServerMatch || hasLocalMatch) {
          // User already played today - load the match data
          if (lastMatch) {
            dispatch({ type: 'LOAD_MATCH_DATA', match: lastMatch });
          }
          queueMicrotask(() => setIsReady(true));
          return;
        }
      } else if (hasLocalMatch) {
        // Unauthenticated user already played today
        dispatch({ type: 'LOAD_MATCH_DATA', match: lastMatch });
        queueMicrotask(() => setIsReady(true));
        return;
      }

      // No match today - create fresh game
      queueMicrotask(() => newGame());
    };

    initializeGame();
  }, [user?.uid]);

  return (
    <SudokuGameContext.Provider
      value={{
        game: state,
        isReady,
        isPaused,
        updateCell,
        handleDragStart,
        handleDrop,
        autoSolve,
        handleClick,
        newGame,
        dispatch,
        togglePause
      }}
    >
      {children}
    </SudokuGameContext.Provider>
  );
}

export const useSudokuGame = () => {
  const context = useContext(SudokuGameContext);
  if (context === undefined) throw new Error('useSudokuGame must be used within a SudokuGameProvider');
  return context;
};
