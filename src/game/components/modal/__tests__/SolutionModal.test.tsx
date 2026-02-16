import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import SolutionModal from '../SolutionModal';
import { useModalRouter } from '@/game/context/ModalRouterContext';
import { onAuthStateChanged } from 'firebase/auth';
import { getTodaysMatch as getTodaysMatchLocal } from '@/match/lib/client';
import { getTodaysMatch as getTodaysMatchServer } from '@/app/actions/match';

jest.mock('dynascale', () => ({
  Dynascale: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('../Modal', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('../../SudokuGrid', () => ({
  __esModule: true,
  default: () => <div data-testid='solution-grid'>Grid</div>,
}));

jest.mock('@/game/context/ModalRouterContext', () => ({
  useModalRouter: jest.fn(),
}));

jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn(),
}));

jest.mock('@/firebase/client', () => ({
  auth: {},
}));

jest.mock('@/match/lib/client', () => ({
  getTodaysMatch: jest.fn(),
}));

jest.mock('@/app/actions/match', () => ({
  getTodaysMatch: jest.fn(),
}));

function createMatchPayload() {
  return {
    id: 'm1',
    isWon: true,
    difficulty: 'medium' as const,
    score: 100,
    streakBonus: 0,
    autoSolvesCount: 0,
    autoSolves: JSON.stringify(['1,1']),
    livesRemaining: 3,
    board: JSON.stringify([[1]]),
    originalBoard: JSON.stringify([[null]]),
    solution: JSON.stringify([[1]]),
    timestamp: Date.now(),
  };
}

describe('SolutionModal', () => {
  const goBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useModalRouter as jest.Mock).mockReturnValue({ goBack });
    (onAuthStateChanged as jest.Mock).mockImplementation(
      (_auth: unknown, cb: (user: { uid: string } | null) => void) => {
        cb(null);
        return jest.fn();
      },
    );
  });

  it('renders nothing when no match exists', async () => {
    (getTodaysMatchLocal as jest.Mock).mockResolvedValue(null);

    const { container } = render(<SolutionModal />);

    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  it('renders solution grid from local match and supports go back', async () => {
    (getTodaysMatchLocal as jest.Mock).mockResolvedValue(createMatchPayload());

    render(<SolutionModal />);

    await waitFor(() => {
      expect(screen.getByTestId('solution-grid')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Go Back' }));
    expect(goBack).toHaveBeenCalledTimes(1);
  });

  it('loads server match when user is authenticated', async () => {
    (onAuthStateChanged as jest.Mock).mockImplementation(
      (_auth: unknown, cb: (user: { uid: string } | null) => void) => {
        cb({ uid: 'u1' });
        return jest.fn();
      },
    );

    (getTodaysMatchServer as jest.Mock).mockResolvedValue(createMatchPayload());

    render(<SolutionModal />);

    await waitFor(() => {
      expect(getTodaysMatchServer).toHaveBeenCalledWith('u1');
      expect(screen.getByTestId('solution-grid')).toBeInTheDocument();
    });
  });
});
