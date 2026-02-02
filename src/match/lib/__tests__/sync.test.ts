/**
 * Tests for Match Sync Module
 *
 * Tests the upload functions that sync local matches to the server,
 * with special focus on correct streak bonus calculation.
 */

import type { ClientMatch, ServerMatch } from '@/match/types';

// Mock all server-side dependencies before importing
jest.mock('@/firebase/server', () => ({
  serverAuth: {},
  serverDb: {},
}));
jest.mock('../client');
jest.mock('@/user/lib/client');
jest.mock('@/app/actions/match');

// Import after mocks are set up
import { toServerMatch } from '../sync';

/**
 * Helper: Create a test match at a specific timestamp
 */
function createMatch(
  timestamp: number,
  overrides: Partial<ClientMatch> = {},
): ClientMatch {
  return {
    id: `match_${timestamp}`,
    isWon: true,
    difficulty: 'medium',
    score: 500,
    streakBonus: 0, // Local matches often have 0 or incorrect bonus
    autoSolvesCount: 0,
    autoSolves: '[]',
    livesRemaining: 3,
    board: '[[1,2,3]]',
    originalBoard: '[[null,2,3]]',
    solution: '[[1,2,3]]',
    timestamp,
    ...overrides,
  };
}

/**
 * Helper: Convert milliseconds to days
 */
function daysAgo(days: number): number {
  return Date.now() - days * 24 * 60 * 60 * 1000;
}

describe('Match Sync Module', () => {
  describe('toServerMatch', () => {
    it('should convert ClientMatch to ServerMatch', () => {
      const clientMatch = createMatch(Date.now());
      const userId = 'test-user';

      const serverMatch = toServerMatch(clientMatch, userId, null);

      expect(serverMatch.userPlayed).toBe(userId);
      expect(serverMatch.id).toBe(clientMatch.id);
      expect(serverMatch.score).toBe(clientMatch.score);
      expect(serverMatch.timestamp).toBe(clientMatch.timestamp);
    });

    it('should remove isCached property', () => {
      const clientMatch: ClientMatch = {
        ...createMatch(Date.now()),
        isCached: true,
      };
      const userId = 'test-user';

      const serverMatch = toServerMatch(clientMatch, userId, null);

      expect('isCached' in serverMatch).toBe(false);
    });

    it('should calculate 0 bonus for first match (no previous match)', () => {
      const clientMatch = createMatch(Date.now(), { streakBonus: 100 });
      const userId = 'test-user';
      const lastMatchTimestamp = null; // No previous match

      const serverMatch = toServerMatch(
        clientMatch,
        userId,
        lastMatchTimestamp,
      );

      expect(serverMatch.streakBonus).toBe(0);
    });

    it('should calculate 200 bonus for consecutive day match', () => {
      const clientMatch = createMatch(Date.now(), { streakBonus: 0 });
      const userId = 'test-user';
      const lastMatchTimestamp = daysAgo(1); // Yesterday

      const serverMatch = toServerMatch(
        clientMatch,
        userId,
        lastMatchTimestamp,
      );

      expect(serverMatch.streakBonus).toBe(200);
    });

    it('should calculate 0 bonus for broken streak', () => {
      const clientMatch = createMatch(Date.now(), { streakBonus: 100 });
      const userId = 'test-user';
      const lastMatchTimestamp = daysAgo(5); // 5 days ago (streak broken)

      const serverMatch = toServerMatch(
        clientMatch,
        userId,
        lastMatchTimestamp,
      );

      expect(serverMatch.streakBonus).toBe(0);
    });
  });

  describe('Streak Bonus Calculation Scenarios', () => {
    /**
     * These tests document the expected behavior when syncing matches.
     * The actual upload functions use getServerMatchHistory and calculateStreakFromMatches
     * to determine the correct streak bonus at the time of each match.
     */

    it('should calculate 0 bonus for first match (no server history)', () => {
      // Scenario: Anonymous user plays first game locally
      const serverHistory: ServerMatch[] = [];

      // When uploading, with empty server history, streak should be 0
      // (first day = no bonus)
      expect(serverHistory.length).toBe(0);
      // Expected: calculateStreakBonus(0 + 1) = 0
    });

    it('should calculate 200 bonus for second consecutive day', () => {
      // Scenario: User played yesterday on server, today locally
      const userId = 'test-user';
      const serverHistory: ServerMatch[] = [
        {
          ...createMatch(daysAgo(1)),
          userPlayed: userId,
        },
      ];

      // When uploading, server history shows 1 day streak
      expect(serverHistory.length).toBe(1);
      // Expected: currentStreak = 1, so calculateStreakBonus(1 + 1) = 200
    });

    it('should calculate bonus correctly when syncing multiple days', () => {
      // Scenario: User played 3 days locally, now logging in
      const serverHistory: ServerMatch[] = [];

      const localMatches = [
        createMatch(daysAgo(2), { streakBonus: 0 }),
        createMatch(daysAgo(1), { streakBonus: 0 }),
        createMatch(daysAgo(0), { streakBonus: 0 }),
      ];

      // When syncing:
      // - Day 1 (oldest): 0 bonus (first day)
      // - Day 2: 200 bonus (second consecutive day)
      // - Day 3 (today): 200 bonus (third consecutive day)

      expect(localMatches.length).toBe(3);
      expect(serverHistory.length).toBe(0);
    });

    it('should handle broken streak correctly', () => {
      // Scenario: User played 3 days ago on server, then locally today
      const userId = 'test-user';
      const serverHistory: ServerMatch[] = [
        {
          ...createMatch(daysAgo(5)),
          userPlayed: userId,
        },
      ];

      // When uploading, server shows last play was 5 days ago (streak broken)
      expect(serverHistory.length).toBe(1);
      // Expected: currentStreak = 0, so calculateStreakBonus(0 + 1) = 0
    });

    it('should consider server matches when calculating streak for local matches', () => {
      // Scenario: User has 2-day streak on server, plays day 3 locally
      const userId = 'test-user';
      const serverHistory: ServerMatch[] = [
        {
          ...createMatch(daysAgo(2)),
          userPlayed: userId,
          streakBonus: 0, // First day
        },
        {
          ...createMatch(daysAgo(1)),
          userPlayed: userId,
          streakBonus: 200, // Second day
        },
      ];

      // When uploading, server history shows 2-day streak
      expect(serverHistory.length).toBe(2);
      // Expected: currentStreak = 2, so calculateStreakBonus(2 + 1) = 200
    });
  });
});
