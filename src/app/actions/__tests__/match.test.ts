import type { ServerMatch } from '@/match/types';
import {
  hasMatchForDate,
  saveMatch,
  getTodaysMatch,
  hasPlayedToday,
  getMatchHistory,
} from '../match';
import {
  hasMatchForDate as hasMatchForDateServer,
  saveMatch as saveMatchServer,
  getTodaysMatch as getTodaysMatchServer,
  hasPlayedToday as hasPlayedTodayServer,
  getMatchHistory as getMatchHistoryServer,
} from '@/match/lib/server';

jest.mock('@/match/lib/server', () => ({
  hasMatchForDate: jest.fn(),
  saveMatch: jest.fn(),
  getTodaysMatch: jest.fn(),
  hasPlayedToday: jest.fn(),
  getMatchHistory: jest.fn(),
}));

function createMatch(overrides: Partial<ServerMatch> = {}): ServerMatch {
  const timestamp = Date.now();
  return {
    id: `match-${timestamp}`,
    isWon: true,
    difficulty: 'medium',
    score: 400,
    streakBonus: 20,
    autoSolvesCount: 0,
    autoSolves: '[]',
    livesRemaining: 3,
    board: '[[1,2,3,4,5,6,7,8,9]]',
    originalBoard: '[[null,2,3,4,5,6,7,8,9]]',
    solution: '[[1,2,3,4,5,6,7,8,9]]',
    timestamp,
    userPlayed: 'user-1',
    ...overrides,
  };
}

describe('match server actions wrappers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('forwards hasMatchForDate call and returns server result', async () => {
    (hasMatchForDateServer as jest.Mock).mockResolvedValue(true);

    const result = await hasMatchForDate('user-1', 1700000000000);

    expect(result).toBe(true);
    expect(hasMatchForDateServer).toHaveBeenCalledWith('user-1', 1700000000000);
  });

  it('forwards saveMatch call and returns server result', async () => {
    const match = createMatch();
    (saveMatchServer as jest.Mock).mockResolvedValue({ success: true });

    const result = await saveMatch('user-1', match);

    expect(result).toEqual({ success: true });
    expect(saveMatchServer).toHaveBeenCalledWith('user-1', match);
  });

  it('forwards getTodaysMatch call and returns server result', async () => {
    const match = createMatch();
    (getTodaysMatchServer as jest.Mock).mockResolvedValue(match);

    const result = await getTodaysMatch('user-1');

    expect(result).toEqual(match);
    expect(getTodaysMatchServer).toHaveBeenCalledWith('user-1');
  });

  it('forwards hasPlayedToday call and returns server result', async () => {
    (hasPlayedTodayServer as jest.Mock).mockResolvedValue(false);

    const result = await hasPlayedToday('user-1');

    expect(result).toBe(false);
    expect(hasPlayedTodayServer).toHaveBeenCalledWith('user-1');
  });

  it('forwards getMatchHistory call and returns server result', async () => {
    const history = [
      createMatch({ id: 'match-1', timestamp: 1700000000000 }),
      createMatch({ id: 'match-2', timestamp: 1700001000000 }),
    ];
    (getMatchHistoryServer as jest.Mock).mockResolvedValue(history);

    const result = await getMatchHistory('user-1');

    expect(result).toEqual(history);
    expect(getMatchHistoryServer).toHaveBeenCalledWith('user-1');
  });
});
