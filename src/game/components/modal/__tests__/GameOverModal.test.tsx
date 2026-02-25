import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import GameOverModal from '../GameOverModal';
import { useModalRouter } from '@/game/context/ModalRouterContext';
import { useRouter } from 'next/navigation';
import { useSudokuGame } from '@/game/context/SudokuGameContext';
import { auth } from '@/firebase/client';
import { getUserData as getUserDataLocal } from '@/user/lib/client';
import { getUserStats as getUserStatsServer } from '@/user/lib/actionGateway';

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...props} alt={props.alt || ''} />
  ),
}));

jest.mock('@/game/context/ModalRouterContext', () => ({
  useModalRouter: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/game/context/SudokuGameContext', () => ({
  useSudokuGame: jest.fn(),
}));

jest.mock('@/firebase/client', () => ({
  auth: {
    currentUser: null,
  },
}));

jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn(() => jest.fn()),
}));

jest.mock('@/match/lib/client', () => ({
  getTodaysMatch: jest.fn(),
}));

jest.mock('@/match/lib/actionGateway', () => ({
  getTodaysMatch: jest.fn(),
}));

jest.mock('@/user/lib/client', () => ({
  getUserData: jest.fn(),
}));

jest.mock('@/user/lib/actionGateway', () => ({
  getUserStats: jest.fn(),
}));

function createContextMatch() {
  return {
    id: 'm1',
    isWon: false,
    difficulty: 'medium' as const,
    score: 123,
    streakBonus: 0,
    autoSolvesCount: 0,
    autoSolves: '[]',
    livesRemaining: 1,
    board: '[]',
    originalBoard: '[]',
    solution: '[]',
    timestamp: Date.now(),
  };
}

describe('GameOverModal', () => {
  const openModal = jest.fn();
  const push = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useModalRouter as jest.Mock).mockReturnValue({ openModal });
    (useRouter as jest.Mock).mockReturnValue({ push });
  });

  it('renders anonymous CTA when logged out and context match exists', async () => {
    (auth as { currentUser: null }).currentUser = null;
    (useSudokuGame as jest.Mock).mockReturnValue({
      todaysMatch: createContextMatch(),
    });
    (getUserDataLocal as jest.Mock).mockResolvedValue({
      dailyStreak: 2,
      personalBestScore: 500,
      combinedScore: 1000,
    });

    render(<GameOverModal onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByAltText('Game Over!')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Create an Account' }));
    expect(push).toHaveBeenCalledWith('/login');
  });

  it('renders leaderboard CTA for authenticated users', async () => {
    (auth as { currentUser: { uid: string } }).currentUser = { uid: 'u1' };
    (useSudokuGame as jest.Mock).mockReturnValue({
      todaysMatch: createContextMatch(),
    });
    (getUserStatsServer as jest.Mock).mockResolvedValue({
      dailyStreak: 4,
      personalBestScore: 600,
      combinedScore: 1200,
    });

    render(<GameOverModal onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Leaderboard' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Leaderboard' }));
    expect(openModal).toHaveBeenCalledWith('leaderboard');
  });
});
