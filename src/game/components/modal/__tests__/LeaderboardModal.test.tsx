import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import LeaderboardModal from '../LeaderboardModal';
import { useModalRouter } from '@/game/context/ModalRouterContext';
import { auth } from '@/firebase/client';
import { getTopPlayers, getNearbyPlayers } from '@/app/actions/user';

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

jest.mock('@/firebase/client', () => ({
  auth: {
    currentUser: null,
  },
}));

jest.mock('@/app/actions/user', () => ({
  getTopPlayers: jest.fn(),
  getNearbyPlayers: jest.fn(),
}));

describe('LeaderboardModal', () => {
  const goBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useModalRouter as jest.Mock).mockReturnValue({ goBack });
  });

  it('renders top players and current user neighborhood', async () => {
    (auth as { currentUser: { uid: string } | null }).currentUser = { uid: 'u1' };

    (getTopPlayers as jest.Mock).mockResolvedValue({
      players: [
        { rank: 1, displayName: 'Alice', combinedScore: 900, matchesPlayed: 5, dailyStreak: 3 },
        { rank: 2, displayName: 'Bob', combinedScore: 800, matchesPlayed: 4, dailyStreak: 2 },
      ],
      totalPlayers: 10,
    });

    (getNearbyPlayers as jest.Mock).mockResolvedValue({
      above: [
        { rank: 3, displayName: 'Cara', combinedScore: 700, matchesPlayed: 4, dailyStreak: 2 },
      ],
      current: {
        rank: 4,
        displayName: 'Me',
        combinedScore: 600,
        matchesPlayed: 3,
        dailyStreak: 1,
      },
      below: [
        { rank: 5, displayName: 'Dan', combinedScore: 500, matchesPlayed: 3, dailyStreak: 1 },
      ],
      totalPlayers: 10,
    });

    render(<LeaderboardModal />);

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).toBeNull();
    });

    expect(screen.getByText('Leaderboard')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('You')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Go Back' }));
    expect(goBack).toHaveBeenCalledTimes(1);
  });

  it('does not request nearby players when no authenticated user', async () => {
    (auth as { currentUser: null }).currentUser = null;
    (getTopPlayers as jest.Mock).mockResolvedValue({ players: [], totalPlayers: 0 });

    render(<LeaderboardModal />);

    await waitFor(() => {
      expect(getTopPlayers).toHaveBeenCalledTimes(1);
    });

    expect(getNearbyPlayers).not.toHaveBeenCalled();
  });
});
