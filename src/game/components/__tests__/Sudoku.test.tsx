import { render, screen, waitFor } from '@testing-library/react';
import Sudoku from '../Sudoku';
import { useSudokuGame } from '@/game/context/SudokuGameContext';
import { useModalRouter } from '@/game/context/ModalRouterContext';
import useSudokuControls from '@/game/hooks/useSudokuControls';

jest.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='dnd-context'>{children}</div>
  ),
  DragOverlay: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='drag-overlay'>{children}</div>
  ),
}));

jest.mock('dynascale', () => ({
  Dynascale: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('@/game/context/SudokuGameContext', () => ({
  useSudokuGame: jest.fn(),
}));

jest.mock('@/game/context/ModalRouterContext', () => ({
  useModalRouter: jest.fn(),
}));

jest.mock('@/game/hooks/useSudokuControls', () => jest.fn());

jest.mock('../SudokuGrid', () => ({
  __esModule: true,
  default: () => <div data-testid='sudoku-grid'>Grid</div>,
}));

jest.mock('../SudokuControls', () => ({
  __esModule: true,
  default: () => <div data-testid='sudoku-controls'>Controls</div>,
}));

jest.mock('../SudokuStats', () => ({
  __esModule: true,
  default: ({ score, lives }: { score: number; lives: number }) => (
    <div data-testid='sudoku-stats'>{`${score}-${lives}`}</div>
  ),
}));

function createGameState(overrides: Record<string, unknown> = {}) {
  const board = Array.from({ length: 9 }, () => Array(9).fill(null));
  return {
    board,
    originalBoard: board,
    solution: board,
    score: 100,
    lives: 3,
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

describe('Sudoku', () => {
  const togglePause = jest.fn();
  const handleClick = jest.fn();
  const handleDragStart = jest.fn();
  const handleDrop = jest.fn();
  const clearGameOverReady = jest.fn();
  const openModal = jest.fn();
  const closeModal = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useSudokuControls as jest.Mock).mockReturnValue({
      dndSensors: [],
      boardRef: { current: null },
      containerRef: { current: null },
    });
    (useModalRouter as jest.Mock).mockReturnValue({
      openModal,
      closeModal,
      activeModal: null,
    });
    localStorage.clear();
  });

  it('opens tutorial modal for first-time ready users', async () => {
    (useSudokuGame as jest.Mock).mockReturnValue({
      game: createGameState(),
      isPaused: false,
      isReady: true,
      togglePause,
      handleClick,
      handleDragStart,
      handleDrop,
      hasPlayedToday: false,
      todaysMatch: null,
      gameOverReady: false,
      clearGameOverReady,
    });

    render(<Sudoku />);

    await waitFor(() => {
      expect(openModal).toHaveBeenCalledWith('how-to-play');
    });
    expect(togglePause).toHaveBeenCalledWith(false);
  });

  it('opens gameover modal when save-complete flag is set', async () => {
    localStorage.setItem('sudoki_tutorial_seen', 'true');
    (useSudokuGame as jest.Mock).mockReturnValue({
      game: createGameState(),
      isPaused: false,
      isReady: true,
      togglePause,
      handleClick,
      handleDragStart,
      handleDrop,
      hasPlayedToday: false,
      todaysMatch: null,
      gameOverReady: true,
      clearGameOverReady,
    });

    render(<Sudoku />);

    await waitFor(() => {
      expect(openModal).toHaveBeenCalledWith('gameover');
      expect(clearGameOverReady).toHaveBeenCalledTimes(1);
    });
  });

  it('opens gameover on load when todays match exists and game is idle', async () => {
    localStorage.setItem('sudoki_tutorial_seen', 'true');
    (useSudokuGame as jest.Mock).mockReturnValue({
      game: createGameState({ status: 'idle' }),
      isPaused: false,
      isReady: true,
      togglePause,
      handleClick,
      handleDragStart,
      handleDrop,
      hasPlayedToday: true,
      todaysMatch: { id: 'today' },
      gameOverReady: false,
      clearGameOverReady,
    });

    render(<Sudoku />);

    await waitFor(() => {
      expect(openModal).toHaveBeenCalledWith('gameover');
    });
  });

  it('disables root state when paused', () => {
    localStorage.setItem('sudoki_tutorial_seen', 'true');
    (useSudokuGame as jest.Mock).mockReturnValue({
      game: createGameState(),
      isPaused: true,
      isReady: true,
      togglePause,
      handleClick,
      handleDragStart,
      handleDrop,
      hasPlayedToday: false,
      todaysMatch: null,
      gameOverReady: false,
      clearGameOverReady,
    });

    const { container } = render(<Sudoku />);
    const root = container.firstChild as HTMLDivElement;
    expect(root).toHaveAttribute('inert');
    expect(root).toHaveStyle({ opacity: '40%' });
    expect(screen.getByTestId('sudoku-grid')).toBeInTheDocument();
  });

  it('closes stale gameover modal when user has not played today', async () => {
    localStorage.setItem('sudoki_tutorial_seen', 'true');
    (useModalRouter as jest.Mock).mockReturnValue({
      openModal,
      closeModal,
      activeModal: 'gameover',
    });
    (useSudokuGame as jest.Mock).mockReturnValue({
      game: createGameState(),
      isPaused: true,
      isReady: true,
      togglePause,
      handleClick,
      handleDragStart,
      handleDrop,
      hasPlayedToday: false,
      todaysMatch: null,
      gameOverReady: false,
      clearGameOverReady,
    });

    render(<Sudoku />);

    await waitFor(() => {
      expect(closeModal).toHaveBeenCalledTimes(1);
    });
  });
});
