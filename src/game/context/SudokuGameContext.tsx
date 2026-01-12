/**
 * Sudoku Game — Copyright (c) 2025 Dylan Almond
 * @license GNU General Public License v3.0
 */

'use client';

import { createContext, useContext, useReducer, useState, useEffect } from 'react';
import type { GameAction, GameState, ClientMatch } from '../types';
import { generateMatchId } from '../types';
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
import {
  saveMatch,
  hasPlayedToday as hasPlayedTodayLocal,
  getTodaysMatch as getTodaysMatchLocal,
  getMatchHistory
} from '@/match/lib/client';
import { calculateStreakFromMatches, calculateStreakBonus } from '@/user/lib/stats';
import { updateUserStatsFromMatch as updateUserStatsLocal } from '@/user/lib/client';
import { auth } from '@/lib/firebase/client';
import { onAuthStateChanged } from 'firebase/auth';
import {
  saveMatch as saveMatchToServer,
  getTodaysMatch as getTodaysMatchServer,
  getMatchHistory as getMatchHistoryServer
} from '@/app/actions/match';
import { uploadAllLocalMatches } from '@/match/lib/sync';

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
   * Whether the user has already played today's daily challenge
   */
  hasPlayedToday: boolean;

  /**
   * Today's match result if already played
   */
  todaysMatch: ClientMatch | null;

  /**
   * Current elapsed time in seconds
   */
  elapsedTime: number;

  /**
   * Set elapsed time (used by timer component)
   */
  setElapsedTime: (time: number) => void;

  /**
   * Last completed match (for modals)
   */
  lastMatch: ClientMatch | null;

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

  /**
   * Flag indicating game over modal is ready to be shown (save completed)
   */
  gameOverReady: boolean;

  /**
   * Clear the gameOverReady flag (called when modal opens)
   */
  clearGameOverReady: () => void;
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
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [playedToday, setPlayedToday] = useState<boolean>(false);
  const [todaysMatch, setTodaysMatch] = useState<ClientMatch | null>(null);
  const [gameOverReady, setGameOverReady] = useState(false);
  const [lastMatch, setLastMatch] = useState<ClientMatch | null>(null);

  /**
   * Check if user has already played today and sync cached matches on mount
   * Follows different paths for logged-in vs anonymous users (see Game Load diagram)
   * Auto-starts a new game if the user hasn't played today
   * 
   * Uses onAuthStateChanged to wait for Firebase Auth to initialize before checking
   */
  useEffect(() => {
    const initializeGameState = async (user: import('firebase/auth').User | null) => {
      let hasPlayed = false;

      if (user) {
        console.log('[SudokuGame] Logged-in user:', user.uid);
        // Logged-in user flow:
        // 1. Upload any local matches first (handles both fresh login sync and cached matches)
        const localMatches = await getMatchHistory();
        if (localMatches.length > 0) {
          console.log('[SudokuGame] Uploading local matches to server...');
          await uploadAllLocalMatches(user.uid);
        }

        // 2. Check server for today's match
        console.log('[SudokuGame] Checking server for today\'s match...');
        const serverTodaysMatch = await getTodaysMatchServer(user.uid);
        console.log('[SudokuGame] Server result:', serverTodaysMatch?.id ?? 'no match');
        if (serverTodaysMatch) {
          hasPlayed = true;
          setPlayedToday(true);
          // Convert ServerMatch to ClientMatch for state
          const clientMatch: ClientMatch = {
            id: serverTodaysMatch.id,
            isWon: serverTodaysMatch.isWon,
            score: serverTodaysMatch.score,
            streakBonus: serverTodaysMatch.streakBonus,
            autoSolvesCount: serverTodaysMatch.autoSolvesCount,
            autoSolves: serverTodaysMatch.autoSolves,
            livesRemaining: serverTodaysMatch.livesRemaining,
            board: serverTodaysMatch.board,
            originalBoard: serverTodaysMatch.originalBoard,
            solution: serverTodaysMatch.solution,
            timestamp: serverTodaysMatch.timestamp
          };
          setTodaysMatch(clientMatch);
          setLastMatch(clientMatch);
        } else {
          // 3. Check localStorage cache (might have cached match for today)
          const localPlayed = await hasPlayedTodayLocal();
          if (localPlayed) {
            hasPlayed = true;
            const localMatch = await getTodaysMatchLocal();
            setPlayedToday(true);
            setTodaysMatch(localMatch);
            setLastMatch(localMatch);
          }
        }
      } else {
        // Anonymous user flow: check localStorage only
        console.log('[SudokuGame] Anonymous user, checking localStorage...');
        const played = await hasPlayedTodayLocal();
        console.log('[SudokuGame] hasPlayedTodayLocal result:', played);
        if (played) {
          hasPlayed = true;
          const match = await getTodaysMatchLocal();
          console.log('[SudokuGame] Found today match:', match?.id, 'isWon:', match?.isWon);
          setPlayedToday(true);
          setTodaysMatch(match);
          setLastMatch(match);
        }
      }

      // Auto-start new game if user hasn't played today
      if (!hasPlayed) {
        console.log('[SudokuGame] User has not played today, starting new game...');
        const difficulty = 'medium';
        const { puzzle, solution } = generatePuzzledifficulty(difficulty);
        dispatch({ type: 'NEW_GAME', payload: { board: puzzle, solution, difficulty } });
        setElapsedTime(0);
        setIsPaused(false);
      }

      // Mark context as ready after initialization completes
      setIsReady(true);
    };

    // Wait for Firebase Auth to initialize before checking game state
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      initializeGameState(user);
    });

    return () => unsubscribe();
  }, []);

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
    setElapsedTime(0);
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
   * Handle game completion (win/lose)
   * For logged-in users: saves to server first, caches locally only on failure
   * For anonymous users: saves to localStorage only
   */
  const handleGameCompletion = async (newStatus: 'win' | 'lose', completedState: GameState) => {
    dispatch({ type: 'SET_STATUS', status: newStatus });

    // Only count as a completed match if the game was won
    const isWon = newStatus === 'win';

    // Get match history for streak calculation from the correct source:
    // - Server for logged-in users (localStorage may be empty after sync)
    // - localStorage for anonymous users
    const isLoggedIn = !!auth.currentUser;
    const matchHistory = isLoggedIn && auth.currentUser
      ? await getMatchHistoryServer(auth.currentUser.uid)
      : await getMatchHistory();
    const { currentStreak } = calculateStreakFromMatches(matchHistory);

    // Calculate streak bonus for playing on consecutive days (awarded regardless of win/loss)
    const streakBonus = calculateStreakBonus(currentStreak + 1);

    // Create match data matching the BaseMatch interface
    const match: ClientMatch = {
      id: generateMatchId(!!auth.currentUser),
      isWon,
      score: completedState.score,
      streakBonus,
      autoSolvesCount: completedState.autoSolves.size,
      autoSolves: JSON.stringify(Array.from(completedState.autoSolves)),
      livesRemaining: completedState.lives,
      board: JSON.stringify(completedState.board),
      originalBoard: JSON.stringify(completedState.originalBoard),
      solution: JSON.stringify(completedState.solution),
      timestamp: Date.now()
    };

    // Update local state regardless of save method
    const updateLocalState = () => {
      setPlayedToday(true);
      setTodaysMatch(match);
      setLastMatch(match);
      setGameOverReady(true); // Signal that modal can now be shown
    };

    if (auth.currentUser) {
      // Logged-in user: save to server first
      try {
        const serverMatch = {
          ...match,
          userPlayed: auth.currentUser.uid
        };
        await saveMatchToServer(auth.currentUser.uid, serverMatch);
        // Server save succeeded - update local state (no localStorage save needed)
        updateLocalState();
      } catch (error) {
        console.warn('[SudokuGame] Server save failed, caching locally:', error);
        // Server save failed - cache to localStorage for later sync
        const result = await saveMatch(match, { isCached: true });
        if (result.success) {
          // Update local user stats
          await updateUserStatsLocal(match);
          updateLocalState();
        }
      }
    } else {
      // Anonymous user: save to localStorage only
      const result = await saveMatch(match);
      if (result.success) {
        // Update local user stats
        await updateUserStatsLocal(match);
        updateLocalState();
      }
    }
  };

  const clearGameOverReady = () => {
    setGameOverReady(false);
  };

  return (
    <SudokuGameContext.Provider
      value={{
        game: state,
        isReady,
        isPaused,
        hasPlayedToday: playedToday,
        todaysMatch,
        elapsedTime,
        setElapsedTime,
        lastMatch,
        updateCell,
        handleDragStart,
        handleDrop,
        autoSolve,
        handleClick,
        newGame,
        dispatch,
        togglePause,
        gameOverReady,
        clearGameOverReady
      }}
    >
      {children}
    </SudokuGameContext.Provider>
  );
}

export const useSudokuGame = () => {
  const context = useContext(SudokuGameContext);
  if (context === undefined)
    throw new Error('useSudokuGame must be used within a SudokuGameProvider');
  return context;
};
