import { act, render, waitFor } from '@testing-library/react';
import { useEffect } from 'react';
import {
  SudokuGameProvider,
  useSudokuGame,
  type SudokuGameProviderState,
} from '../SudokuGameContext';
import { getDailyPuzzle } from '@/app/actions/puzzle';
import { playSound } from '@/game/lib/sound';
import {
  saveMatch as saveLocalMatch,
  hasPlayedToday as hasPlayedTodayLocal,
  getTodaysMatch as getTodaysMatchLocal,
} from '@/match/lib/client';
import { getStreakBonusForNewMatch } from '@/match/lib/validation';
import { updateUserStatsFromMatch as updateUserStatsLocal } from '@/user/lib/client';
import { auth } from '@/firebase/client';
import { onAuthStateChanged } from 'firebase/auth';
import {
  saveMatch as saveMatchToServer,
  getTodaysMatch as getTodaysMatchServer,
} from '@/app/actions/match';
import { uploadCachedMatches, uploadTodaysLocalMatch } from '@/match/lib/sync';

jest.mock('@/app/actions/puzzle', () => ({
  getDailyPuzzle: jest.fn(),
}));

jest.mock('@/game/lib/sound', () => ({
  playSound: jest.fn(),
}));

jest.mock('@/match/lib/client', () => ({
  saveMatch: jest.fn(),
  hasPlayedToday: jest.fn(),
  getTodaysMatch: jest.fn(),
}));

jest.mock('@/match/lib/validation', () => ({
  getStreakBonusForNewMatch: jest.fn(),
}));

jest.mock('@/user/lib/client', () => ({
  updateUserStatsFromMatch: jest.fn(),
}));

jest.mock('@/firebase/client', () => ({
  auth: { currentUser: null },
}));

jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn(),
}));

jest.mock('@/app/actions/match', () => ({
  saveMatch: jest.fn(),
  getTodaysMatch: jest.fn(),
}));

jest.mock('@/match/lib/sync', () => ({
  uploadCachedMatches: jest.fn(),
  uploadTodaysLocalMatch: jest.fn(),
}));

function makeBoard(fill: number | null = null) {
  return Array.from({ length: 9 }, () => Array(9).fill(fill));
}

function makePuzzle() {
  const puzzle = makeBoard(null);
  const solution = makeBoard(1);
  return { puzzle, solution, difficulty: 'medium' as const };
}

function SudokuConsumer({
  onChange,
}: {
  onChange: (ctx: SudokuGameProviderState) => void;
}) {
  const context = useSudokuGame();
  useEffect(() => {
    onChange(context);
  }, [context, onChange]);
  return null;
}

describe('SudokuGameContext', () => {
  const mustGetContext = (ctx: SudokuGameProviderState | null) => {
    if (!ctx) {
      throw new Error('Context not available yet');
    }
    return ctx;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (getDailyPuzzle as jest.Mock).mockResolvedValue(makePuzzle());
    (hasPlayedTodayLocal as jest.Mock).mockResolvedValue(false);
    (getTodaysMatchLocal as jest.Mock).mockResolvedValue(null);
    (getTodaysMatchServer as jest.Mock).mockResolvedValue(null);
    (uploadCachedMatches as jest.Mock).mockResolvedValue({
      success: true,
      uploaded: 0,
      skipped: 0,
      failed: 0,
    });
    (uploadTodaysLocalMatch as jest.Mock).mockResolvedValue({
      success: true,
      uploaded: 0,
      skipped: 0,
      failed: 0,
    });
    (saveLocalMatch as jest.Mock).mockResolvedValue({ success: true });
    (saveMatchToServer as jest.Mock).mockResolvedValue({ success: true });
    (updateUserStatsLocal as jest.Mock).mockResolvedValue({ success: true });
    (getStreakBonusForNewMatch as jest.Mock).mockResolvedValue(20);

    (auth as { currentUser: { uid: string } | null }).currentUser = null;

    (onAuthStateChanged as jest.Mock).mockImplementation(
      (_auth: unknown, callback: (user: { uid: string } | null) => void) => {
        callback((auth as { currentUser: { uid: string } | null }).currentUser);
        return jest.fn();
      },
    );
  });

  it('throws when used outside provider', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() => render(<SudokuConsumer onChange={jest.fn()} />)).toThrow(
      'useSudokuGame must be used within a SudokuGameProvider',
    );

    spy.mockRestore();
  });

  it('initializes a new game for anonymous users who have not played today', async () => {
    let capturedContext: SudokuGameProviderState | null = null;
    render(
      <SudokuGameProvider>
        <SudokuConsumer onChange={(ctx) => (capturedContext = ctx)} />
      </SudokuGameProvider>,
    );

    await waitFor(() => {
      expect(capturedContext?.isReady).toBe(true);
      expect(capturedContext?.game.status).toBe('playing');
      expect(capturedContext?.game.lives).toBe(5);
      expect(capturedContext?.hasPlayedToday).toBe(false);
    });

    expect(getDailyPuzzle).toHaveBeenCalledWith('medium');
  });

  it('loads today match for anonymous users who already played', async () => {
    let capturedContext: SudokuGameProviderState | null = null;
    const localMatch = {
      id: 'local-1',
      isWon: true,
      difficulty: 'medium' as const,
      score: 120,
      streakBonus: 5,
      autoSolvesCount: 0,
      autoSolves: '[]',
      livesRemaining: 3,
      board: '[]',
      originalBoard: '[]',
      solution: '[]',
      timestamp: Date.now(),
    };

    (hasPlayedTodayLocal as jest.Mock).mockResolvedValue(true);
    (getTodaysMatchLocal as jest.Mock).mockResolvedValue(localMatch);

    render(
      <SudokuGameProvider>
        <SudokuConsumer onChange={(ctx) => (capturedContext = ctx)} />
      </SudokuGameProvider>,
    );

    await waitFor(() => {
      expect(capturedContext?.isReady).toBe(true);
      expect(capturedContext?.hasPlayedToday).toBe(true);
      expect(capturedContext?.todaysMatch?.id).toBe('local-1');
      expect(capturedContext?.lastMatch?.id).toBe('local-1');
    });

    expect(getDailyPuzzle).not.toHaveBeenCalled();
  });

  it('syncs and loads server match for logged-in users', async () => {
    let capturedContext: SudokuGameProviderState | null = null;
    (auth as { currentUser: { uid: string } | null }).currentUser = { uid: 'u1' };
    (getTodaysMatchServer as jest.Mock).mockResolvedValue({
      id: 'server-1',
      isWon: false,
      score: 222,
      streakBonus: 0,
      autoSolvesCount: 1,
      autoSolves: '[]',
      livesRemaining: 1,
      board: '[]',
      originalBoard: '[]',
      solution: '[]',
      timestamp: Date.now(),
    });

    render(
      <SudokuGameProvider>
        <SudokuConsumer onChange={(ctx) => (capturedContext = ctx)} />
      </SudokuGameProvider>,
    );

    await waitFor(() => {
      expect(uploadCachedMatches).toHaveBeenCalledWith('u1');
      expect(uploadTodaysLocalMatch).toHaveBeenCalledWith('u1');
      expect(capturedContext?.hasPlayedToday).toBe(true);
      expect(capturedContext?.todaysMatch?.id).toBe('server-1');
      expect(capturedContext?.todaysMatch?.difficulty).toBe('medium');
    });

    expect(getDailyPuzzle).not.toHaveBeenCalled();
  });

  it('runs logged-in sync branches when uploads report uploaded and failed counts', async () => {
    let capturedContext: SudokuGameProviderState | null = null;
    (auth as { currentUser: { uid: string } | null }).currentUser = { uid: 'u-sync' };
    (uploadCachedMatches as jest.Mock).mockResolvedValue({
      success: true,
      uploaded: 1,
      skipped: 0,
      failed: 1,
    });
    (uploadTodaysLocalMatch as jest.Mock).mockResolvedValue({
      success: true,
      uploaded: 1,
      skipped: 0,
      failed: 1,
    });
    (getTodaysMatchServer as jest.Mock).mockResolvedValue(null);

    render(
      <SudokuGameProvider>
        <SudokuConsumer onChange={(ctx) => (capturedContext = ctx)} />
      </SudokuGameProvider>,
    );

    await waitFor(() => {
      expect(uploadCachedMatches).toHaveBeenCalledWith('u-sync');
      expect(uploadTodaysLocalMatch).toHaveBeenCalledWith('u-sync');
      expect(capturedContext?.isReady).toBe(true);
      expect(capturedContext?.game.status).toBe('playing');
    });
  });

  it('selects a cell and resets selection when pausing with override', async () => {
    let capturedContext: SudokuGameProviderState | null = null;
    render(
      <SudokuGameProvider>
        <SudokuConsumer onChange={(ctx) => (capturedContext = ctx)} />
      </SudokuGameProvider>,
    );

    await waitFor(() => {
      expect(capturedContext?.isReady).toBe(true);
    });

    act(() => {
      capturedContext?.handleClick(0, 0);
    });

    await waitFor(() => {
      expect(capturedContext?.game.selected).toEqual({ row: 0, col: 0 });
    });

    act(() => {
      capturedContext?.togglePause(true);
    });

    await waitFor(() => {
      expect(capturedContext?.isPaused).toBe(true);
      expect(capturedContext?.game.selected).toEqual({ row: null, col: null });
    });

    expect(playSound).toHaveBeenCalled();
  });

  it('ignores updateCell for fixed cells and unchanged values', async () => {
    let capturedContext: SudokuGameProviderState | null = null;
    const puzzle = makeBoard(null);
    puzzle[0][0] = 7;
    (getDailyPuzzle as jest.Mock).mockResolvedValue({
      puzzle,
      solution: makeBoard(1),
      difficulty: 'medium',
    });

    render(
      <SudokuGameProvider>
        <SudokuConsumer onChange={(ctx) => (capturedContext = ctx)} />
      </SudokuGameProvider>,
    );

    await waitFor(() => {
      expect(capturedContext?.isReady).toBe(true);
    });

    const beforeFixed = mustGetContext(capturedContext).game.board[0][0];
    act(() => {
      capturedContext?.updateCell(0, 0, 3);
    });
    expect(mustGetContext(capturedContext).game.board[0][0]).toBe(beforeFixed);

    act(() => {
      capturedContext?.updateCell(0, 1, null);
    });
    expect(mustGetContext(capturedContext).game.board[0][1]).toBeNull();
  });

  it('handles drag-drop out of bounds by clearing source value and resetting drag state', async () => {
    let capturedContext: SudokuGameProviderState | null = null;
    const puzzle = makeBoard(null);
    puzzle[0][0] = null;
    (getDailyPuzzle as jest.Mock).mockResolvedValue({
      puzzle,
      solution: makeBoard(1),
      difficulty: 'medium',
    });

    render(
      <SudokuGameProvider>
        <SudokuConsumer onChange={(ctx) => (capturedContext = ctx)} />
      </SudokuGameProvider>,
    );

    await waitFor(() => {
      expect(capturedContext?.isReady).toBe(true);
    });

    act(() => {
      mustGetContext(capturedContext).dispatch({
        type: 'UPDATE_BOARD',
        board: (() => {
          const board = makeBoard(null);
          board[0][0] = 5;
          return board;
        })(),
      });
      mustGetContext(capturedContext).dispatch({ type: 'SET_LIVES', lives: 5 });
    });

    act(() => {
      capturedContext?.handleDragStart({
        active: { data: { current: { cell: { row: 0, col: 0, value: 5 } } } },
      } as never);
    });

    act(() => {
      capturedContext?.handleDrop({
        active: { data: { current: { cell: { row: 0, col: 0, value: 5 } } } },
        over: null,
      } as never);
    });

    expect(mustGetContext(capturedContext).game.board[0][0]).toBeNull();
    expect(mustGetContext(capturedContext).game.dragValue).toBeNull();
  });

  it('handles drag-drop in bounds and updates target cell', async () => {
    let capturedContext: SudokuGameProviderState | null = null;
    const puzzle = makeBoard(null);
    (getDailyPuzzle as jest.Mock).mockResolvedValue({
      puzzle,
      solution: makeBoard(1),
      difficulty: 'medium',
    });

    render(
      <SudokuGameProvider>
        <SudokuConsumer onChange={(ctx) => (capturedContext = ctx)} />
      </SudokuGameProvider>,
    );

    await waitFor(() => {
      expect(capturedContext?.isReady).toBe(true);
    });

    act(() => {
      mustGetContext(capturedContext).dispatch({
        type: 'UPDATE_BOARD',
        board: (() => {
          const board = makeBoard(null);
          board[0][0] = 4;
          return board;
        })(),
      });
      mustGetContext(capturedContext).dispatch({ type: 'SET_LIVES', lives: 5 });
    });

    act(() => {
      capturedContext?.handleDragStart({
        active: { data: { current: { cell: { row: 0, col: 0, value: 4 } } } },
      } as never);
    });

    act(() => {
      capturedContext?.handleDrop({
        active: { data: { current: { cell: { row: 0, col: 0, value: 4 } } } },
        over: { data: { current: { cell: { row: 0, col: 1 } } } },
      } as never);
    });

    expect(mustGetContext(capturedContext).game.board[0][0]).toBeNull();
    expect(mustGetContext(capturedContext).game.board[0][1]).toBe(4);
  });

  it('autoSolve fills a random empty cell and consumes one life', async () => {
    let capturedContext: SudokuGameProviderState | null = null;
    const puzzle = makeBoard(null);
    const solution = makeBoard(2);
    (getDailyPuzzle as jest.Mock).mockResolvedValue({
      puzzle,
      solution,
      difficulty: 'medium',
    });

    const originalCrypto = global.crypto;
    Object.defineProperty(global, 'crypto', {
      configurable: true,
      value: {
        getRandomValues: (arr: Uint32Array) => {
          arr[0] = 0;
          return arr;
        },
      },
    });

    render(
      <SudokuGameProvider>
        <SudokuConsumer onChange={(ctx) => (capturedContext = ctx)} />
      </SudokuGameProvider>,
    );

    await waitFor(() => {
      expect(capturedContext?.isReady).toBe(true);
    });

    const beforeLives = mustGetContext(capturedContext).game.lives;
    act(() => {
      capturedContext?.autoSolve();
    });

    expect(mustGetContext(capturedContext).game.board[0][0]).toBe(2);
    expect(mustGetContext(capturedContext).game.autoSolves.has('0,0')).toBe(true);
    expect(mustGetContext(capturedContext).game.lives).toBe(beforeLives - 1);

    Object.defineProperty(global, 'crypto', {
      configurable: true,
      value: originalCrypto,
    });
  });

  it('completes game as anonymous and sets gameOverReady after local save', async () => {
    let capturedContext: SudokuGameProviderState | null = null;
    const puzzle = makeBoard(null);
    puzzle[0][1] = 1;
    (getDailyPuzzle as jest.Mock).mockResolvedValue({
      puzzle,
      solution: makeBoard(1),
      difficulty: 'medium',
    });

    render(
      <SudokuGameProvider>
        <SudokuConsumer onChange={(ctx) => (capturedContext = ctx)} />
      </SudokuGameProvider>,
    );

    await waitFor(() => {
      expect(capturedContext?.isReady).toBe(true);
    });

    act(() => {
      capturedContext?.dispatch({ type: 'SET_LIVES', lives: 1 });
    });

    act(() => {
      capturedContext?.updateCell(0, 0, 1);
    });

    await waitFor(() => {
      expect(saveLocalMatch).toHaveBeenCalledTimes(1);
      expect(updateUserStatsLocal).toHaveBeenCalledTimes(1);
      expect(capturedContext?.game.status).toBe('lose');
      expect(capturedContext?.gameOverReady).toBe(true);
      expect(capturedContext?.hasPlayedToday).toBe(true);
      expect(capturedContext?.todaysMatch).not.toBeNull();
    });

    act(() => {
      capturedContext?.clearGameOverReady();
    });
    expect(mustGetContext(capturedContext).gameOverReady).toBe(false);
  });

  it('falls back to cached local save when logged-in server save fails', async () => {
    let capturedContext: SudokuGameProviderState | null = null;
    (auth as { currentUser: { uid: string } | null }).currentUser = { uid: 'u2' };
    (saveMatchToServer as jest.Mock).mockRejectedValue(new Error('server down'));

    const puzzle = makeBoard(null);
    puzzle[0][1] = 1;
    (getDailyPuzzle as jest.Mock).mockResolvedValue({
      puzzle,
      solution: makeBoard(1),
      difficulty: 'medium',
    });

    render(
      <SudokuGameProvider>
        <SudokuConsumer onChange={(ctx) => (capturedContext = ctx)} />
      </SudokuGameProvider>,
    );

    await waitFor(() => {
      expect(capturedContext?.isReady).toBe(true);
    });

    act(() => {
      capturedContext?.dispatch({ type: 'SET_LIVES', lives: 1 });
    });

    act(() => {
      capturedContext?.updateCell(0, 0, 1);
    });

    await waitFor(() => {
      expect(saveMatchToServer).toHaveBeenCalled();
      expect(saveLocalMatch).toHaveBeenCalledWith(
        expect.objectContaining({ isWon: false }),
        { isCached: true },
      );
      expect(updateUserStatsLocal).toHaveBeenCalled();
      expect(capturedContext?.gameOverReady).toBe(true);
    });
  });

  it('saves to server successfully for logged-in user without local fallback', async () => {
    let capturedContext: SudokuGameProviderState | null = null;
    (auth as { currentUser: { uid: string } | null }).currentUser = { uid: 'u3' };
    (saveMatchToServer as jest.Mock).mockResolvedValue({ success: true });

    const puzzle = makeBoard(null);
    puzzle[0][1] = 1;
    (getDailyPuzzle as jest.Mock).mockResolvedValue({
      puzzle,
      solution: makeBoard(1),
      difficulty: 'medium',
    });

    render(
      <SudokuGameProvider>
        <SudokuConsumer onChange={(ctx) => (capturedContext = ctx)} />
      </SudokuGameProvider>,
    );

    await waitFor(() => {
      expect(capturedContext?.isReady).toBe(true);
    });

    act(() => {
      capturedContext?.dispatch({ type: 'SET_LIVES', lives: 1 });
    });

    act(() => {
      capturedContext?.updateCell(0, 0, 1);
    });

    await waitFor(() => {
      expect(saveMatchToServer).toHaveBeenCalled();
      expect(saveLocalMatch).not.toHaveBeenCalledWith(
        expect.anything(),
        { isCached: true },
      );
      expect(capturedContext?.gameOverReady).toBe(true);
    });
  });

  it('handles reducer SHOW_SOLUTION and default action fallback', async () => {
    let capturedContext: SudokuGameProviderState | null = null;

    render(
      <SudokuGameProvider>
        <SudokuConsumer onChange={(ctx) => (capturedContext = ctx)} />
      </SudokuGameProvider>,
    );

    await waitFor(() => {
      expect(capturedContext?.isReady).toBe(true);
    });

    act(() => {
      mustGetContext(capturedContext).dispatch({ type: 'SHOW_SOLUTION', show: true });
    });
    expect(mustGetContext(capturedContext).game.showSolution).toBe(true);

    const before = mustGetContext(capturedContext).game.score;
    act(() => {
      mustGetContext(capturedContext).dispatch({ type: 'UNKNOWN_ACTION' } as never);
    });
    expect(mustGetContext(capturedContext).game.score).toBe(before);
  });

  it('handles upload sync catch branches and still starts new game', async () => {
    let capturedContext: SudokuGameProviderState | null = null;
    (auth as { currentUser: { uid: string } | null }).currentUser = { uid: 'u-catch' };
    (uploadCachedMatches as jest.Mock).mockRejectedValue(new Error('cache sync fail'));
    (uploadTodaysLocalMatch as jest.Mock).mockRejectedValue(new Error('today sync fail'));
    (getTodaysMatchServer as jest.Mock).mockResolvedValue(null);

    render(
      <SudokuGameProvider>
        <SudokuConsumer onChange={(ctx) => (capturedContext = ctx)} />
      </SudokuGameProvider>,
    );

    await waitFor(() => {
      expect(capturedContext?.isReady).toBe(true);
      expect(capturedContext?.game.status).toBe('playing');
    });
  });

  it('does not toggle pause when game is not playing and supports toggle without override', async () => {
    let capturedContext: SudokuGameProviderState | null = null;
    render(
      <SudokuGameProvider>
        <SudokuConsumer onChange={(ctx) => (capturedContext = ctx)} />
      </SudokuGameProvider>,
    );

    await waitFor(() => {
      expect(capturedContext?.isReady).toBe(true);
    });

    act(() => {
      mustGetContext(capturedContext).dispatch({ type: 'SET_STATUS', status: 'idle' });
    });
    await waitFor(() => {
      expect(mustGetContext(capturedContext).game.status).toBe('idle');
    });

    act(() => {
      capturedContext?.togglePause(true);
    });
    expect(mustGetContext(capturedContext).isPaused).toBe(false);

    act(() => {
      mustGetContext(capturedContext).dispatch({ type: 'SET_STATUS', status: 'playing' });
    });

    await waitFor(() => {
      expect(mustGetContext(capturedContext).game.status).toBe('playing');
    });

    act(() => {
      capturedContext?.togglePause();
    });
    expect(mustGetContext(capturedContext).isPaused).toBe(true);
  });

  it('returns early on handleClick and handleDragStart guard branches', async () => {
    let capturedContext: SudokuGameProviderState | null = null;
    render(
      <SudokuGameProvider>
        <SudokuConsumer onChange={(ctx) => (capturedContext = ctx)} />
      </SudokuGameProvider>,
    );

    await waitFor(() => {
      expect(capturedContext?.isReady).toBe(true);
    });

    act(() => {
      capturedContext?.togglePause(true);
    });

    const soundCalls = (playSound as jest.Mock).mock.calls.length;
    act(() => {
      capturedContext?.handleClick(1, 1);
      capturedContext?.handleDragStart({ active: { data: { current: null } } } as never);
    });
    expect((playSound as jest.Mock).mock.calls.length).toBe(soundCalls);

    act(() => {
      capturedContext?.togglePause(false);
      capturedContext?.handleDragStart({
        active: { data: { current: { cell: { row: null, col: null, value: 9 } } } },
      } as never);
    });
    expect(mustGetContext(capturedContext).game.selected).toEqual({ row: null, col: null });
  });

  it('covers out-of-bounds conflict deduction path and invalid drop no-op', async () => {
    let capturedContext: SudokuGameProviderState | null = null;
    render(
      <SudokuGameProvider>
        <SudokuConsumer onChange={(ctx) => (capturedContext = ctx)} />
      </SudokuGameProvider>,
    );

    await waitFor(() => {
      expect(capturedContext?.isReady).toBe(true);
    });

    act(() => {
      const board = makeBoard(null);
      board[0][0] = 5;
      mustGetContext(capturedContext).dispatch({ type: 'UPDATE_BOARD', board });
      mustGetContext(capturedContext).dispatch({ type: 'SET_SCORE', score: 100 });
      mustGetContext(capturedContext).dispatch({
        type: 'SET_CONFLICTS',
        conflicts: new Map([['0,0', 1]]),
      });
    });

    act(() => {
      capturedContext?.handleDragStart({
        active: { data: { current: { cell: { row: 0, col: 0, value: 5 } } } },
      } as never);
      capturedContext?.handleDrop({
        active: { data: { current: { cell: { row: 0, col: 0, value: 5 } } } },
        over: null,
      } as never);
    });

    expect(mustGetContext(capturedContext).game.score).toBe(100);

    act(() => {
      capturedContext?.handleDrop({
        active: { data: { current: { cell: { row: 0, col: 0, value: 5 } } } },
        over: { data: { current: { cell: { row: 0, col: 0 } } } },
      } as never);
    });
    expect(mustGetContext(capturedContext).game.board[0][0]).toBeNull();
  });

  it('covers in-bounds branch with null source and conflict penalty', async () => {
    let capturedContext: SudokuGameProviderState | null = null;
    render(
      <SudokuGameProvider>
        <SudokuConsumer onChange={(ctx) => (capturedContext = ctx)} />
      </SudokuGameProvider>,
    );

    await waitFor(() => {
      expect(capturedContext?.isReady).toBe(true);
    });

    act(() => {
      const board = makeBoard(null);
      board[0][0] = 7;
      board[0][1] = 7;
      mustGetContext(capturedContext).dispatch({ type: 'UPDATE_BOARD', board });
      mustGetContext(capturedContext).dispatch({ type: 'SET_LIVES', lives: 5 });
    });

    act(() => {
      capturedContext?.handleDragStart({
        active: { data: { current: { cell: { row: null, col: null, value: 7 } } } },
      } as never);
    });

    await waitFor(() => {
      expect(mustGetContext(capturedContext).game.dragValue).toBe(7);
    });

    act(() => {
      capturedContext?.handleDrop({
        active: { data: { current: { cell: { row: null, col: null, value: 7 } } } },
        over: { data: { current: { cell: { row: 0, col: 2 } } } },
      } as never);
    });

    expect(mustGetContext(capturedContext).game.lives).toBe(4);
    expect(mustGetContext(capturedContext).game.conflicts.size).toBeGreaterThan(0);
  });

  it('covers handleDrop early return when active is missing', async () => {
    let capturedContext: SudokuGameProviderState | null = null;
    render(
      <SudokuGameProvider>
        <SudokuConsumer onChange={(ctx) => (capturedContext = ctx)} />
      </SudokuGameProvider>,
    );

    await waitFor(() => {
      expect(capturedContext?.isReady).toBe(true);
    });

    act(() => {
      capturedContext?.handleDrop({ over: null, active: null } as never);
    });

    expect(mustGetContext(capturedContext).isReady).toBe(true);
  });

  it('covers autoSolve early returns for no lives and no empty cells', async () => {
    let capturedContext: SudokuGameProviderState | null = null;
    const fullBoard = makeBoard(9);
    (getDailyPuzzle as jest.Mock).mockResolvedValue({
      puzzle: fullBoard,
      solution: fullBoard,
      difficulty: 'medium',
    });

    render(
      <SudokuGameProvider>
        <SudokuConsumer onChange={(ctx) => (capturedContext = ctx)} />
      </SudokuGameProvider>,
    );

    await waitFor(() => {
      expect(capturedContext?.isReady).toBe(true);
    });

    act(() => {
      mustGetContext(capturedContext).dispatch({ type: 'SET_LIVES', lives: 0 });
      capturedContext?.autoSolve();
    });
    expect(mustGetContext(capturedContext).game.lives).toBe(0);

    act(() => {
      mustGetContext(capturedContext).dispatch({ type: 'SET_LIVES', lives: 5 });
      capturedContext?.autoSolve();
    });
    expect(mustGetContext(capturedContext).game.autoSolves.size).toBe(0);
  });

  it('covers anonymous save failure branch without updating gameOverReady', async () => {
    let capturedContext: SudokuGameProviderState | null = null;
    (saveLocalMatch as jest.Mock).mockResolvedValue({ success: false, error: 'denied' });

    const puzzle = makeBoard(null);
    puzzle[0][1] = 1;
    (getDailyPuzzle as jest.Mock).mockResolvedValue({
      puzzle,
      solution: makeBoard(1),
      difficulty: 'medium',
    });

    render(
      <SudokuGameProvider>
        <SudokuConsumer onChange={(ctx) => (capturedContext = ctx)} />
      </SudokuGameProvider>,
    );

    await waitFor(() => {
      expect(capturedContext?.isReady).toBe(true);
    });

    act(() => {
      capturedContext?.dispatch({ type: 'SET_LIVES', lives: 1 });
    });

    await waitFor(() => {
      expect(mustGetContext(capturedContext).game.lives).toBe(1);
    });

    act(() => {
      capturedContext?.updateCell(0, 0, 1);
    });

    await waitFor(() => {
      expect(saveLocalMatch).toHaveBeenCalled();
    });
    expect(mustGetContext(capturedContext).gameOverReady).toBe(false);
  });
});
