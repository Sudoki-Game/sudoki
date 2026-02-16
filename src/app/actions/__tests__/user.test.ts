import { createDefaultBaseUserStats } from '@/user/types';
import {
  getUserStats,
  getTopPlayers,
  getNearbyPlayers,
} from '../user';

const collectionMock = jest.fn();

jest.mock('@/firebase/server', () => ({
  serverDb: {
    collection: (name: string) => collectionMock(name),
  },
}));

type DocSnapshot = {
  exists: boolean;
  data: () => Record<string, unknown>;
};

function createDocSnapshot(
  data: Record<string, unknown>,
  exists = true,
): DocSnapshot {
  return {
    exists,
    data: () => data,
  };
}

function createQuerySnapshot(rows: Record<string, unknown>[]) {
  return {
    docs: rows.map((row) => ({ data: () => row })),
  };
}

describe('user server actions', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('getUserStats', () => {
    it('returns default stats when user document does not exist', async () => {
      const docGet = jest
        .fn<Promise<DocSnapshot>, []>()
        .mockResolvedValue(createDocSnapshot({}, false));

      collectionMock.mockReturnValue({
        doc: jest.fn(() => ({ get: docGet })),
      });

      const result = await getUserStats('missing-user');

      expect(result).toEqual(createDefaultBaseUserStats());
    });

    it('returns mapped stats when user exists', async () => {
      const source = {
        combinedScore: 1200,
        dailyStreak: 8,
        bestStreak: 12,
        matchesPlayed: 45,
        personalBestScore: 400,
        lastMatchTimestamp: 1700000000000,
        extra: 'ignored',
      };

      const docGet = jest
        .fn<Promise<DocSnapshot>, []>()
        .mockResolvedValue(createDocSnapshot(source));

      collectionMock.mockReturnValue({
        doc: jest.fn(() => ({ get: docGet })),
      });

      const result = await getUserStats('user-1');

      expect(result).toEqual({
        combinedScore: 1200,
        dailyStreak: 8,
        bestStreak: 12,
        matchesPlayed: 45,
        personalBestScore: 400,
        lastMatchTimestamp: 1700000000000,
      });
    });

    it('returns default stats when firestore throws', async () => {
      const docGet = jest.fn<Promise<DocSnapshot>, []>().mockRejectedValue(
        new Error('firestore unavailable'),
      );

      collectionMock.mockReturnValue({
        doc: jest.fn(() => ({ get: docGet })),
      });

      const result = await getUserStats('user-err');

      expect(result).toEqual(createDefaultBaseUserStats());
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[UserActions] Error getting user stats:',
        expect.any(Error),
      );
    });
  });

  describe('getTopPlayers', () => {
    it('returns ranked top players with total count', async () => {
      const topRows = [
        {
          displayName: 'Alpha',
          combinedScore: 3000,
          matchesPlayed: 50,
          dailyStreak: 11,
        },
        {
          displayName: 'Bravo',
          combinedScore: 2500,
          matchesPlayed: 40,
          dailyStreak: 8,
        },
      ];

      const usersCollection = {
        orderBy: jest.fn(() => ({
          limit: jest.fn(() => ({
            get: jest
              .fn()
              .mockResolvedValue(createQuerySnapshot(topRows)),
          })),
        })),
        count: jest.fn(() => ({
          get: jest.fn().mockResolvedValue({
            data: () => ({ count: 77 }),
          }),
        })),
      };

      collectionMock.mockReturnValue(usersCollection);

      const result = await getTopPlayers();

      expect(result).toEqual({
        players: [
          {
            rank: 1,
            displayName: 'Alpha',
            combinedScore: 3000,
            matchesPlayed: 50,
            dailyStreak: 11,
          },
          {
            rank: 2,
            displayName: 'Bravo',
            combinedScore: 2500,
            matchesPlayed: 40,
            dailyStreak: 8,
          },
        ],
        totalPlayers: 77,
      });
    });

    it('returns empty result when firestore throws', async () => {
      const usersCollection = {
        orderBy: jest.fn(() => ({
          limit: jest.fn(() => ({
            get: jest.fn().mockRejectedValue(new Error('query failed')),
          })),
        })),
        count: jest.fn(() => ({
          get: jest.fn().mockResolvedValue({
            data: () => ({ count: 0 }),
          }),
        })),
      };

      collectionMock.mockReturnValue(usersCollection);

      const result = await getTopPlayers();

      expect(result).toEqual({ players: [], totalPlayers: 0 });
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[UserActions] Error getting top players:',
        expect.any(Error),
      );
    });
  });

  describe('getNearbyPlayers', () => {
    it('returns empty nearby result when current user does not exist', async () => {
      const usersCollection = {
        doc: jest.fn(() => ({
          get: jest
            .fn<Promise<DocSnapshot>, []>()
            .mockResolvedValue(createDocSnapshot({}, false)),
        })),
      };

      collectionMock.mockReturnValue(usersCollection);

      const result = await getNearbyPlayers('missing-user');

      expect(result).toEqual({
        above: [],
        current: null,
        below: [],
        totalPlayers: 0,
      });
    });

    it('returns above/current/below with correct ranks', async () => {
      const aboveRows = [
        {
          displayName: 'CloseAbove',
          combinedScore: 1210,
          matchesPlayed: 31,
          dailyStreak: 6,
        },
        {
          displayName: 'TopAbove',
          combinedScore: 1500,
          matchesPlayed: 50,
          dailyStreak: 10,
        },
      ];

      const belowRows = [
        {
          displayName: 'NearBelow',
          combinedScore: 1180,
          matchesPlayed: 29,
          dailyStreak: 4,
        },
      ];

      const usersCollection = {
        doc: jest.fn(() => ({
          get: jest.fn().mockResolvedValue(
            createDocSnapshot({
              displayName: 'CurrentUser',
              combinedScore: 1200,
              matchesPlayed: 30,
              dailyStreak: 5,
            }),
          ),
        })),
        orderBy: jest.fn((field: string, direction: string) => {
          if (field !== 'combinedScore') {
            throw new Error('Unexpected orderBy field');
          }

          if (direction === 'asc') {
            return {
              where: jest.fn(() => ({
                limit: jest.fn(() => ({
                  get: jest
                    .fn()
                    .mockResolvedValue(createQuerySnapshot(aboveRows)),
                })),
              })),
            };
          }

          if (direction === 'desc') {
            return {
              where: jest.fn(() => ({
                limit: jest.fn(() => ({
                  get: jest
                    .fn()
                    .mockResolvedValue(createQuerySnapshot(belowRows)),
                })),
              })),
            };
          }

          throw new Error('Unexpected orderBy direction');
        }),
        where: jest.fn(() => ({
          count: jest.fn(() => ({
            get: jest.fn().mockResolvedValue({
              data: () => ({ count: 2 }),
            }),
          })),
        })),
        count: jest.fn(() => ({
          get: jest.fn().mockResolvedValue({
            data: () => ({ count: 10 }),
          }),
        })),
      };

      collectionMock.mockReturnValue(usersCollection);

      const result = await getNearbyPlayers('user-2');

      expect(result).toEqual({
        above: [
          {
            rank: 1,
            displayName: 'TopAbove',
            combinedScore: 1500,
            matchesPlayed: 50,
            dailyStreak: 10,
          },
          {
            rank: 2,
            displayName: 'CloseAbove',
            combinedScore: 1210,
            matchesPlayed: 31,
            dailyStreak: 6,
          },
        ],
        current: {
          rank: 3,
          displayName: 'CurrentUser',
          combinedScore: 1200,
          matchesPlayed: 30,
          dailyStreak: 5,
        },
        below: [
          {
            rank: 4,
            displayName: 'NearBelow',
            combinedScore: 1180,
            matchesPlayed: 29,
            dailyStreak: 4,
          },
        ],
        totalPlayers: 10,
      });
    });

    it('returns empty result when firestore throws', async () => {
      const usersCollection = {
        doc: jest.fn(() => ({
          get: jest.fn().mockRejectedValue(new Error('user read failed')),
        })),
      };

      collectionMock.mockReturnValue(usersCollection);

      const result = await getNearbyPlayers('user-err');

      expect(result).toEqual({
        above: [],
        current: null,
        below: [],
        totalPlayers: 0,
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[UserActions] Error getting nearby players:',
        expect.any(Error),
      );
    });
  });
});
