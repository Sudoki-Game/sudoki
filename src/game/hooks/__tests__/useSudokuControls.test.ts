import { act, renderHook } from '@testing-library/react';
import type { GameState } from '@/game/types';
import useSudokuGameControls from '../useSudokuControls';
import { useSudokuGame } from '@/game/context/SudokuGameContext';
import { playSound } from '@/game/lib/sound';
import {
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
} from '@dnd-kit/core';

jest.mock('@/game/context/SudokuGameContext', () => ({
  useSudokuGame: jest.fn(),
}));

jest.mock('@/game/lib/sound', () => ({
  playSound: jest.fn(),
}));

jest.mock('@dnd-kit/core', () => ({
  useSensor: jest.fn(),
  useSensors: jest.fn(),
  PointerSensor: Symbol('PointerSensor'),
  KeyboardSensor: Symbol('KeyboardSensor'),
}));

function createGameState(overrides: Partial<GameState> = {}): GameState {
  return {
    board: Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => null)),
    originalBoard: Array.from({ length: 9 }, () =>
      Array.from({ length: 9 }, () => null),
    ),
    solution: Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => 1)),
    score: 0,
    lives: 3,
    status: 'playing',
    selected: { row: 4, col: 4 },
    highlights: new Set(),
    conflicts: new Map(),
    autoSolves: new Set(),
    dragValue: null,
    showSolution: false,
    difficulty: 'medium',
    ...overrides,
  };
}

describe('useSudokuGameControls', () => {
  let dispatchMock: jest.Mock;
  let updateCellMock: jest.Mock;
  let mockGame: GameState;

  beforeEach(() => {
    jest.clearAllMocks();

    dispatchMock = jest.fn();
    updateCellMock = jest.fn();
    mockGame = createGameState();

    (useSudokuGame as jest.Mock).mockImplementation(() => ({
      game: mockGame,
      updateCell: updateCellMock,
      dispatch: dispatchMock,
      isPaused: false,
    }));

    (useSensor as jest.Mock)
      .mockReturnValueOnce('pointer-sensor')
      .mockReturnValueOnce('keyboard-sensor');

    (useSensors as jest.Mock).mockReturnValue(['sensor-bundle']);
  });

  it('configures and returns dnd sensors and refs', () => {
    const { result } = renderHook(() => useSudokuGameControls());

    expect(useSensor).toHaveBeenCalledWith(PointerSensor, {
      activationConstraint: {
        delay: 100,
        tolerance: 150,
      },
    });
    expect(useSensor).toHaveBeenCalledWith(KeyboardSensor);
    expect(useSensors).toHaveBeenCalledWith('pointer-sensor', 'keyboard-sensor');

    expect(result.current.dndSensors).toEqual(['sensor-bundle']);
    expect(result.current.boardRef.current).toBeNull();
    expect(result.current.containerRef.current).toBeNull();
  });

  it('handles arrow key navigation and dispatches SELECT_CELL', () => {
    const { result, rerender } = renderHook(() => useSudokuGameControls());

    result.current.boardRef.current = document.createElement('div');
    mockGame = createGameState({ selected: { row: 4, col: 4 } });
    rerender();

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    });

    expect(dispatchMock).toHaveBeenCalledWith({
      type: 'SELECT_CELL',
      row: 3,
      col: 4,
    });
    expect(playSound).toHaveBeenCalledWith('/game/audio/metronome.mp3', {
      pitch: 1.8,
    });
  });

  it('updates selected cell with number key input', () => {
    const { result, rerender } = renderHook(() => useSudokuGameControls());

    result.current.boardRef.current = document.createElement('div');
    mockGame = createGameState({ selected: { row: 2, col: 7 } });
    rerender();

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: '9' }));
    });

    expect(updateCellMock).toHaveBeenCalledWith(2, 7, 9);
    expect(playSound).toHaveBeenCalledWith('/game/audio/metronome.mp3', {
      pitch: 1.4,
    });
  });

  it('clears selected cell with delete/backspace/0', () => {
    const { result, rerender } = renderHook(() => useSudokuGameControls());

    result.current.boardRef.current = document.createElement('div');
    mockGame = createGameState({ selected: { row: 1, col: 1 } });
    rerender();

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete' }));
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace' }));
      document.dispatchEvent(new KeyboardEvent('keydown', { key: '0' }));
    });

    expect(updateCellMock).toHaveBeenCalledWith(1, 1, null);
    expect(updateCellMock).toHaveBeenCalledTimes(3);
    expect(playSound).toHaveBeenCalledWith('/game/audio/metronome.mp3', {
      pitch: 0.9,
    });
  });

  it('blocks keyboard input when game is paused', () => {
    (useSudokuGame as jest.Mock).mockImplementation(() => ({
      game: createGameState(),
      updateCell: updateCellMock,
      dispatch: dispatchMock,
      isPaused: true,
    }));

    const { result, rerender } = renderHook(() => useSudokuGameControls());
    result.current.boardRef.current = document.createElement('div');
    rerender();

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: '5' }));
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    });

    expect(updateCellMock).not.toHaveBeenCalled();
    expect(dispatchMock).not.toHaveBeenCalled();
  });

  it('resets selection when clicking outside container while playing', () => {
    const { result, rerender } = renderHook(() => useSudokuGameControls());

    const container = document.createElement('div');
    const child = document.createElement('button');
    container.appendChild(child);
    document.body.appendChild(container);

    result.current.containerRef.current = container;

    mockGame = createGameState({ selected: { row: 0, col: 0 } });
    rerender();

    act(() => {
      document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    });

    expect(dispatchMock).toHaveBeenCalledWith({ type: 'RESET_SELECTION' });
    document.body.removeChild(container);
  });

  it('does not reset selection when paused or not playing', () => {
    (useSudokuGame as jest.Mock).mockImplementation(() => ({
      game: createGameState({ status: 'idle', selected: { row: 1, col: 1 } }),
      updateCell: updateCellMock,
      dispatch: dispatchMock,
      isPaused: true,
    }));

    const { result, rerender } = renderHook(() => useSudokuGameControls());

    const container = document.createElement('div');
    result.current.containerRef.current = container;
    rerender();

    act(() => {
      document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    });

    expect(dispatchMock).not.toHaveBeenCalled();
  });
});
