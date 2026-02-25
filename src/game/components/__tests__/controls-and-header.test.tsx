import { fireEvent, render, screen } from '@testing-library/react';
import Header from '../Header';
import SudokuStats from '../SudokuStats';
import SudokuControls from '../SudokuControls';
import { MAX_LIVES } from '@/game/util/constants';
import { useAuth } from '@/auth/context/AuthContext';
import { useModalRouter } from '@/game/context/ModalRouterContext';
import { useSudokuGame } from '@/game/context/SudokuGameContext';
import { playSound } from '@/game/lib/sound';

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...props} alt={props.alt || ''} />
  ),
}));

jest.mock('@/auth/context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/game/context/ModalRouterContext', () => ({
  useModalRouter: jest.fn(),
}));

jest.mock('@/game/context/SudokuGameContext', () => ({
  useSudokuGame: jest.fn(),
}));

jest.mock('@/game/lib/sound', () => ({
  playSound: jest.fn(),
}));

jest.mock('../DraggableCell', () => ({
  __esModule: true,
  default: ({ id, disabled, cellProps }: { id: string; disabled: boolean; cellProps: { onClick: () => void } }) => (
    <button
      type='button'
      data-testid={id}
      disabled={disabled}
      onClick={cellProps.onClick}
    >
      {id}
    </button>
  ),
}));

describe('Header', () => {
  const openModal = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useModalRouter as jest.Mock).mockReturnValue({ openModal });
  });

  it('always opens settings modal', () => {
    (useAuth as jest.Mock).mockReturnValue({ isLoggedIn: false });

    render(<Header />);

    const settingsButton = screen.getByAltText('Settings Icon').closest('button');
    expect(settingsButton).not.toBeNull();

    fireEvent.click(settingsButton as HTMLButtonElement);

    expect(openModal).toHaveBeenCalledWith('settings');
  });

  it('disables leaderboard button when user is logged out', () => {
    (useAuth as jest.Mock).mockReturnValue({ isLoggedIn: false });

    render(<Header />);

    const leaderboardButton = screen
      .getByAltText('Leaderboard Icon')
      .closest('button');

    expect(leaderboardButton).toBeDisabled();
  });

  it('opens leaderboard modal when logged in', () => {
    (useAuth as jest.Mock).mockReturnValue({ isLoggedIn: true });

    render(<Header />);

    const leaderboardButton = screen
      .getByAltText('Leaderboard Icon')
      .closest('button');

    fireEvent.click(leaderboardButton as HTMLButtonElement);

    expect(openModal).toHaveBeenCalledWith('leaderboard');
  });
});

describe('SudokuStats', () => {
  it('renders score and heart states based on lives', () => {
    render(<SudokuStats score={1234} lives={2} />);

    expect(screen.getByText('Score')).toBeInTheDocument();
    expect(screen.getByText('1234')).toBeInTheDocument();
    expect(screen.getAllByAltText('Heart')).toHaveLength(2);
    expect(screen.getAllByAltText('Empty Heart')).toHaveLength(MAX_LIVES - 2);
  });

  it('renders all empty hearts when lives are zero', () => {
    render(<SudokuStats score={0} lives={0} />);

    expect(screen.queryAllByAltText('Heart')).toHaveLength(0);
    expect(screen.getAllByAltText('Empty Heart')).toHaveLength(MAX_LIVES);
  });
});

describe('SudokuControls', () => {
  const autoSolve = jest.fn();
  const updateCell = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders skeleton controls when game is not ready', () => {
    (useSudokuGame as jest.Mock).mockReturnValue({
      game: { status: 'playing', selected: { row: 1, col: 1 } },
      isReady: false,
      isPaused: false,
      autoSolve,
      updateCell,
    });

    const { container } = render(<SudokuControls />);

    expect(container.firstChild).not.toBeNull();
    expect(container.querySelectorAll('.skeletonCell')).toHaveLength(10);
  });

  it('renders controls and updates selected cell on number click', () => {
    (useSudokuGame as jest.Mock).mockReturnValue({
      game: { status: 'playing', selected: { row: 4, col: 5 } },
      isReady: true,
      isPaused: false,
      autoSolve,
      updateCell,
    });

    render(<SudokuControls />);

    expect(screen.getByTestId('draggable-1')).toBeInTheDocument();
    expect(screen.getByTestId('draggable-9')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('draggable-3'));

    expect(updateCell).toHaveBeenCalledWith(4, 5, 3);
    expect(playSound).toHaveBeenCalledWith('/game/audio/metronome.mp3', {
      pitch: 1.8,
    });
  });

  it('does not update cell when selection is missing', () => {
    (useSudokuGame as jest.Mock).mockReturnValue({
      game: { status: 'playing', selected: { row: null, col: null } },
      isReady: true,
      isPaused: false,
      autoSolve,
      updateCell,
    });

    render(<SudokuControls />);

    fireEvent.click(screen.getByTestId('draggable-7'));

    expect(updateCell).not.toHaveBeenCalled();
    expect(playSound).not.toHaveBeenCalled();
  });

  it('disables controls when paused and wires auto-solve action', () => {
    (useSudokuGame as jest.Mock).mockReturnValue({
      game: { status: 'playing', selected: { row: 0, col: 0 } },
      isReady: true,
      isPaused: true,
      autoSolve,
      updateCell,
    });

    render(<SudokuControls />);

    expect(screen.getByTestId('draggable-1')).toBeDisabled();

    const autoSolveButton = screen.getByTitle('Auto-Solve (-1 Life)');
    expect(autoSolveButton).toBeDisabled();
  });

  it('disables controls when game is not playing', () => {
    (useSudokuGame as jest.Mock).mockReturnValue({
      game: { status: 'won', selected: { row: 0, col: 0 } },
      isReady: true,
      isPaused: false,
      autoSolve,
      updateCell,
    });

    render(<SudokuControls />);

    expect(screen.getByTestId('draggable-1')).toBeDisabled();
  });
});
