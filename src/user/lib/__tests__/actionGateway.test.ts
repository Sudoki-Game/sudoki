// Mock must be hoisted before imports
jest.mock('@/app/actions/user', () => ({
  getUserStats: jest.fn(),
  getTopPlayers: jest.fn(),
  getNearbyPlayers: jest.fn(),
}));

import {
  getUserStats,
  getTopPlayers,
  getNearbyPlayers,
} from '../actionGateway';
import * as userActions from '@/app/actions/user';
import type { BaseUserStats } from '@/user/types';
import type {
  LeaderboardPlayer,
  TopPlayersResult,
  NearbyPlayersResult,
} from '@/app/actions/user';

const mockedUserActions = userActions as jest.Mocked<typeof userActions>;

describe('User Action Gateway', () => {
  const mockUserId = 'test-user-456';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserStats', () => {
    it('should delegate to getUserStats action and return stats', async () => {
      const mockStats: BaseUserStats = {
        combinedScore: 1000,
        dailyStreak: 5,
        bestStreak: 10,
        matchesPlayed: 20,
        personalBestScore: 150,
        lastMatchTimestamp: Date.now(),
      };

      mockedUserActions.getUserStats.mockResolvedValue(mockStats);

      const result = await getUserStats(mockUserId);

      expect(userActions.getUserStats).toHaveBeenCalledWith(mockUserId);
      expect(result).toBe(mockStats);
    });

    it('should pass through action errors', async () => {
      const mockError = new Error('User not found');

      mockedUserActions.getUserStats.mockRejectedValue(mockError);

      await expect(getUserStats(mockUserId)).rejects.toThrow('User not found');
    });
  });

  describe('getTopPlayers', () => {
    it('should delegate to getTopPlayers action and return leaderboard', async () => {
      const mockPlayers: LeaderboardPlayer[] = [
        {
          rank: 1,
          displayName: 'Player One',
          combinedScore: 1000,
          matchesPlayed: 50,
          dailyStreak: 10,
        },
        {
          rank: 2,
          displayName: 'Player Two',
          combinedScore: 950,
          matchesPlayed: 45,
          dailyStreak: 8,
        },
      ];

      const mockResult: TopPlayersResult = {
        players: mockPlayers,
        totalPlayers: 100,
      };

      mockedUserActions.getTopPlayers.mockResolvedValue(mockResult);

      const result = await getTopPlayers();

      expect(userActions.getTopPlayers).toHaveBeenCalledWith();
      expect(result).toBe(mockResult);
    });

    it('should return empty leaderboard when no players exist', async () => {
      const mockResult: TopPlayersResult = {
        players: [],
        totalPlayers: 0,
      };

      mockedUserActions.getTopPlayers.mockResolvedValue(mockResult);

      const result = await getTopPlayers();

      expect(result).toEqual(mockResult);
    });
  });

  describe('getNearbyPlayers', () => {
    it('should delegate to getNearbyPlayers action and return nearby leaderboard', async () => {
      const mockCurrentPlayer: LeaderboardPlayer = {
        rank: 50,
        displayName: 'Current User',
        combinedScore: 500,
        matchesPlayed: 25,
        dailyStreak: 5,
      };

      const mockNearbyPlayers: LeaderboardPlayer[] = [
        {
          rank: 49,
          displayName: 'Player Above',
          combinedScore: 510,
          matchesPlayed: 26,
          dailyStreak: 6,
        },
        {
          rank: 51,
          displayName: 'Player Below',
          combinedScore: 490,
          matchesPlayed: 24,
          dailyStreak: 4,
        },
      ];

      const mockResult: NearbyPlayersResult = {
        above: [mockNearbyPlayers[0]],
        current: mockCurrentPlayer,
        below: [mockNearbyPlayers[1]],
        totalPlayers: 100,
      };

      mockedUserActions.getNearbyPlayers.mockResolvedValue(mockResult);

      const result = await getNearbyPlayers(mockUserId);

      expect(userActions.getNearbyPlayers).toHaveBeenCalledWith(mockUserId);
      expect(result).toBe(mockResult);
    });

    it('should handle user with no nearby players', async () => {
      const mockCurrentPlayer: LeaderboardPlayer = {
        rank: 1,
        displayName: 'Solo User',
        combinedScore: 100,
        matchesPlayed: 5,
        dailyStreak: 3,
      };

      const mockResult: NearbyPlayersResult = {
        above: [],
        current: mockCurrentPlayer,
        below: [],
        totalPlayers: 1,
      };

      mockedUserActions.getNearbyPlayers.mockResolvedValue(mockResult);

      const result = await getNearbyPlayers(mockUserId);

      expect(result).toEqual(mockResult);
    });
  });
});
