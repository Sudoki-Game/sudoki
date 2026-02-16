import { render, screen } from '@testing-library/react';
import SudokuGrid from '../SudokuGrid';
import type { GameState } from '@/game/types';

jest.mock('../SudokuCell', () => ({
  __esModule: true,
  default: ({
    cellValue,
    isSelected,
    disabled,
    id,
  }: {
    cellValue: number | null;
    isSelected: boolean;
    disabled?: boolean;
    id?: string;
  }) => (
    <button
      type='button'
      data-testid={id || 'sudoku-cell'}
      data-value={cellValue ?? ''}
      data-selected={String(isSelected)}
      data-disabled={String(!!disabled)}
    />
  ),
}));

jest.mock('../BoardCell', () => ({
  __esModule: true,
  default: ({ row, col }: { row: number; col: number }) => (
    <div data-testid='board-cell' data-row={row} data-col={col} />
  ),
}));

function createGame(overrides: Partial<GameState> = {}): GameState {
  const board = Array.from({ length: 9 }, () => Array(9).fill(null));
  return {
    board,
    originalBoard: Array.from({ length: 9 }, () => Array(9).fill(null)),
    solution: Array.from({ length: 9 }, () => Array(9).fill(1)),
    score: 0,
    lives: 5,
    status: 'playing',
    selected: { row: null, col: null },
    highlights: new Set<string>(),
    conflicts: new Map<string, number>(),
    autoSolves: new Set<string>(),
    dragValue: null,
    showSolution: false,
    difficulty: 'medium',
    ...overrides,
  };
}

describe('SudokuGrid', () => {
  it('renders placeholder cells when not ready', () => {
    const game = createGame();
    render(
      <SudokuGrid
        game={game}
        isReady={false}
        showSolution={false}
        handleClick={() => {}}
      />,
    );

    expect(screen.getAllByTestId(/cell-/)).toHaveLength(81);
  });

  it('renders immutable as SudokuCell and mutable as BoardCell in live mode', () => {
    const board = Array.from({ length: 9 }, () => Array(9).fill(null));
    board[0][0] = 3;
    board[0][1] = 4;

    const originalBoard = Array.from({ length: 9 }, () => Array(9).fill(null));
    originalBoard[0][0] = 3;

    const game = createGame({
      board,
      originalBoard,
      autoSolves: new Set(['0,2']),
      status: 'playing',
    });

    render(
      <SudokuGrid
        game={game}
        isReady={true}
        showSolution={false}
        handleClick={() => {}}
      />,
    );

    expect(screen.getByTestId('cell-0-0')).toBeInTheDocument();
    expect(screen.getAllByTestId('board-cell').length).toBeGreaterThan(0);
  });

  it('renders solution view with selected solved cells', () => {
    const board = Array.from({ length: 9 }, () => Array(9).fill(null));
    const solution = Array.from({ length: 9 }, () => Array(9).fill(1));
    board[0][0] = 1;

    const game = createGame({
      board,
      solution,
      autoSolves: new Set<string>(),
      originalBoard: Array.from({ length: 9 }, () => Array(9).fill(null)),
    });

    render(
      <SudokuGrid
        game={game}
        isReady={true}
        showSolution={true}
        handleClick={() => {}}
      />,
    );

    const cells = screen.getAllByTestId('sudoku-cell');
    expect(cells.length).toBe(81);
    expect(cells[0]).toHaveAttribute('data-selected', 'true');
  });
});
