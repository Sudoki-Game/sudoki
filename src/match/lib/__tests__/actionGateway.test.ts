// Mock must be hoisted before imports
jest.mock('@/app/actions/match', () => ({
  hasMatchForDate: jest.fn(),
  hasPlayedToday: jest.fn(),
  saveMatch: jest.fn(),
  getTodaysMatch: jest.fn(),
  getMatchHistory: jest.fn(),
}));

import {
  hasMatchForDate,
  hasPlayedToday,
  saveMatch,
  getTodaysMatch,
  getMatchHistory,
} from '../actionGateway';
import * as matchActions from '@/app/actions/match';
import type { ServerMatch } from '@/match/types';

const mockedMatchActions = matchActions as jest.Mocked<typeof matchActions>;

describe('Match Action Gateway', () => {
  const mockUserId = 'test-user-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('hasMatchForDate', () => {
    it('should delegate to hasMatchForDate action and return result', async () => {
      const timestamp = Date.now();

      mockedMatchActions.hasMatchForDate.mockResolvedValue(true);

      const result = await hasMatchForDate(mockUserId, timestamp);

      expect(matchActions.hasMatchForDate).toHaveBeenCalledWith(
        mockUserId,
        timestamp,
      );
      expect(result).toBe(true);
    });

    it('should return false when no match exists', async () => {
      const timestamp = Date.now();

      mockedMatchActions.hasMatchForDate.mockResolvedValue(false);

      const result = await hasMatchForDate(mockUserId, timestamp);

      expect(result).toBe(false);
    });

    it('should pass through action errors', async () => {
      const timestamp = Date.now();
      const mockError = new Error('Database error');

      mockedMatchActions.hasMatchForDate.mockRejectedValue(mockError);

      await expect(hasMatchForDate(mockUserId, timestamp)).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('hasPlayedToday', () => {
    it('should delegate to hasPlayedToday action and return result', async () => {
      mockedMatchActions.hasPlayedToday.mockResolvedValue(true);

      const result = await hasPlayedToday(mockUserId);

      expect(matchActions.hasPlayedToday).toHaveBeenCalledWith(mockUserId);
      expect(result).toBe(true);
    });

    it('should return false when user has not played today', async () => {
      mockedMatchActions.hasPlayedToday.mockResolvedValue(false);

      const result = await hasPlayedToday(mockUserId);

      expect(result).toBe(false);
    });
  });

  describe('saveMatch', () => {
    it('should delegate to saveMatch action and return success result', async () => {
      const mockMatch: ServerMatch = {
        id: 'match-1',
        isWon: true,
        score: 100,
        streakBonus: 10,
        autoSolvesCount: 2,
        autoSolves: '[]',
        livesRemaining: 3,
        board: '[]',
        originalBoard: '[]',
        solution: '[]',
        difficulty: 'medium',
        timestamp: Date.now(),
        userPlayed: mockUserId,
      };

      const mockResult = { success: true };

      mockedMatchActions.saveMatch.mockResolvedValue(mockResult);

      const result = await saveMatch(mockUserId, mockMatch);

      expect(matchActions.saveMatch).toHaveBeenCalledWith(
        mockUserId,
        mockMatch,
      );
      expect(result).toEqual(mockResult);
    });

    it('should delegate to saveMatch action and return error result', async () => {
      const mockMatch: ServerMatch = {
        id: 'match-2',
        isWon: false,
        score: 50,
        streakBonus: 0,
        autoSolvesCount: 5,
        autoSolves: '[]',
        livesRemaining: 0,
        board: '[]',
        originalBoard: '[]',
        solution: '[]',
        difficulty: 'easy',
        timestamp: Date.now(),
        userPlayed: mockUserId,
      };

      const mockResult = { success: false, error: 'Invalid signature' };

      mockedMatchActions.saveMatch.mockResolvedValue(mockResult);

      const result = await saveMatch(mockUserId, mockMatch);

      expect(result).toEqual(mockResult);
    });
  });

  describe('getTodaysMatch', () => {
    it('should delegate to getTodaysMatch action and return match', async () => {
      const mockMatch: ServerMatch = {
        id: 'match-3',
        isWon: true,
        score: 150,
        streakBonus: 20,
        autoSolvesCount: 1,
        autoSolves: '[]',
        livesRemaining: 3,
        board: '[]',
        originalBoard: '[]',
        solution: '[]',
        difficulty: 'hard',
        timestamp: Date.now(),
        userPlayed: mockUserId,
      };

      mockedMatchActions.getTodaysMatch.mockResolvedValue(mockMatch);

      const result = await getTodaysMatch(mockUserId);

      expect(matchActions.getTodaysMatch).toHaveBeenCalledWith(mockUserId);
      expect(result).toBe(mockMatch);
    });

    it('should return null when no match exists for today', async () => {
      mockedMatchActions.getTodaysMatch.mockResolvedValue(null);

      const result = await getTodaysMatch(mockUserId);

      expect(result).toBeNull();
    });
  });

  describe('getMatchHistory', () => {
    it('should delegate to getMatchHistory action and return matches', async () => {
      const mockMatches: ServerMatch[] = [
        {
          id: 'match-4',
          isWon: true,
          score: 80,
          streakBonus: 5,
          autoSolvesCount: 1,
          autoSolves: '[]',
          livesRemaining: 3,
          board: '[]',
          originalBoard: '[]',
          solution: '[]',
          difficulty: 'easy',
          timestamp: Date.now() - 86400000,
          userPlayed: mockUserId,
        },
        {
          id: 'match-5',
          isWon: true,
          score: 120,
          streakBonus: 10,
          autoSolvesCount: 2,
          autoSolves: '[]',
          livesRemaining: 2,
          board: '[]',
          originalBoard: '[]',
          solution: '[]',
          difficulty: 'medium',
          timestamp: Date.now(),
          userPlayed: mockUserId,
        },
      ];

      mockedMatchActions.getMatchHistory.mockResolvedValue(mockMatches);

      const result = await getMatchHistory(mockUserId);

      expect(matchActions.getMatchHistory).toHaveBeenCalledWith(mockUserId);
      expect(result).toBe(mockMatches);
    });

    it('should return empty array when no history exists', async () => {
      mockedMatchActions.getMatchHistory.mockResolvedValue([]);

      const result = await getMatchHistory(mockUserId);

      expect(result).toEqual([]);
    });
  });
});
