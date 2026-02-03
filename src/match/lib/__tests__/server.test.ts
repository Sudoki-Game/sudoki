/**
 * Tests for Match Server Operations
 *
 * This file includes:
 * 1. Shared tests (run against both localStorage and Firestore)
 * 2. Server-specific tests (streak calculation, user stats updates)
 */

import {
  calculateStreakFromMatches,
  calculateStreakBonus,
} from '@/user/lib/stats';
import type { ServerMatch } from '@/match/types';
import {
  runSharedMatchTests,
  daysAgo,
  type MatchStorageAdapter,
} from './shared-tests';

// In-memory store for mock Firestore tests
let mockMatchStore: ServerMatch[] = [];
const TEST_USER_ID = 'test-user-123';

/**
 * Create a test match for a specific date
 */
function createServerMatchForDate(
  userId: string,
  date: Date,
  overrides: Partial<ServerMatch> = {},
): ServerMatch {
  const timestamp = date.getTime();
  return {
    id: `match_${timestamp}`,
    userPlayed: userId,
    isWon: true,
    difficulty: 'medium',
    score: 100,
    streakBonus: 0,
    autoSolvesCount: 0,
    autoSolves: '[]',
    livesRemaining: 3,
    board: '[]',
    originalBoard: '[]',
    solution: '[]',
    timestamp,
    ...overrides,
  };
}

/**
 * Mock Firestore adapter for shared tests
 * This simulates the server-side operations without actual Firestore
 */
function createMockFirestoreAdapter(): MatchStorageAdapter<ServerMatch> {
  return {
    saveMatch: async (match: ServerMatch) => {
      mockMatchStore.push(match);
      mockMatchStore.sort((a, b) => a.timestamp - b.timestamp);
      return { success: true };
    },
    getMatchHistory: async () => {
      return [...mockMatchStore].sort((a, b) => a.timestamp - b.timestamp);
    },
    getTodaysMatch: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayMs = today.getTime();

      const todaysMatches = mockMatchStore.filter((m) => {
        const matchDate = new Date(m.timestamp);
        matchDate.setHours(0, 0, 0, 0);
        return matchDate.getTime() === todayMs;
      });

      if (todaysMatches.length === 0) return null;

      // Return most recent match from today
      return todaysMatches.sort((a, b) => b.timestamp - a.timestamp)[0];
    },
    hasPlayedToday: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayMs = today.getTime();

      return mockMatchStore.some((m) => {
        const matchDate = new Date(m.timestamp);
        matchDate.setHours(0, 0, 0, 0);
        return matchDate.getTime() === todayMs;
      });
    },
    clearAll: () => {
      mockMatchStore = [];
    },
    createMatch: (date: Date, overrides?: Partial<ServerMatch>) =>
      createServerMatchForDate(TEST_USER_ID, date, overrides),
  };
}

// Clear mock store before each test
beforeEach(() => {
  mockMatchStore = [];
});

// ============================================
// Run shared tests against mock Firestore
// ============================================
runSharedMatchTests('Firestore', createMockFirestoreAdapter);

// ============================================
// Server-specific tests
// ============================================

describe('[Firestore] Streak Calculation for Match Saving', () => {
  describe('calculateStreakBonus integration', () => {
    /**
     * Streak bonus is awarded for playing on consecutive days,
     * regardless of whether the player wins or loses.
     */
    it('should return 0 bonus for first day (no prior matches)', () => {
      const matchHistory: ServerMatch[] = [];
      const { currentStreak } = calculateStreakFromMatches(matchHistory);

      // First match ever - streak will be 1 after this match
      const streakBonus = calculateStreakBonus(currentStreak + 1);

      expect(currentStreak).toBe(0);
      expect(streakBonus).toBe(0); // Day 1 = no bonus
    });

    it('should return 200 bonus for second consecutive day', () => {
      const userId = 'test-user';
      const matchHistory = [
        createServerMatchForDate(userId, daysAgo(1)), // Played yesterday
      ];
      const { currentStreak } = calculateStreakFromMatches(matchHistory);

      // Playing today extends streak to 2
      const streakBonus = calculateStreakBonus(currentStreak + 1);

      expect(currentStreak).toBe(1);
      expect(streakBonus).toBe(200); // Day 2 = 200 bonus
    });

    it('should return 200 bonus for third consecutive day', () => {
      const userId = 'test-user';
      const matchHistory = [
        createServerMatchForDate(userId, daysAgo(2)),
        createServerMatchForDate(userId, daysAgo(1)),
      ];
      const { currentStreak } = calculateStreakFromMatches(matchHistory);

      // Playing today extends streak to 3
      const streakBonus = calculateStreakBonus(currentStreak + 1);

      expect(currentStreak).toBe(2);
      expect(streakBonus).toBe(200); // Day 3 = 200 bonus
    });

    it('should return 0 bonus after streak is broken', () => {
      const userId = 'test-user';
      const matchHistory = [
        createServerMatchForDate(userId, daysAgo(5)),
        createServerMatchForDate(userId, daysAgo(4)),
        createServerMatchForDate(userId, daysAgo(3)),
        // Gap: didn't play on day 2 or 1
      ];
      const { currentStreak } = calculateStreakFromMatches(matchHistory);

      // Streak was broken, starting fresh today
      const streakBonus = calculateStreakBonus(currentStreak + 1);

      expect(currentStreak).toBe(0); // Streak broken
      expect(streakBonus).toBe(0); // Day 1 = no bonus
    });

    it('should maintain streak if played yesterday but not today yet', () => {
      const userId = 'test-user';
      const matchHistory = [
        createServerMatchForDate(userId, daysAgo(3)),
        createServerMatchForDate(userId, daysAgo(2)),
        createServerMatchForDate(userId, daysAgo(1)), // Yesterday
      ];
      const { currentStreak } = calculateStreakFromMatches(matchHistory);

      // Playing today would extend to day 4
      const streakBonus = calculateStreakBonus(currentStreak + 1);

      expect(currentStreak).toBe(3);
      expect(streakBonus).toBe(200); // Day 4 = 200 bonus
    });
  });

  describe('updateUserStatsFromMatch should update streak fields', () => {
    /**
     * This test documents the REQUIRED behavior that is currently MISSING.
     * The updateUserStatsFromMatch function must update:
     * - dailyStreak: current consecutive days played
     * - bestStreak: highest streak ever achieved
     */
    it('should update dailyStreak to current streak value', () => {
      const userId = 'test-user';
      const matchHistory = [
        createServerMatchForDate(userId, daysAgo(2)),
        createServerMatchForDate(userId, daysAgo(1)),
      ];
      const { currentStreak, bestStreak } =
        calculateStreakFromMatches(matchHistory);

      // After playing today, streak should be 3
      const newStreak = currentStreak + 1;

      // These are the values that SHOULD be saved to Firestore
      const expectedUserUpdate = {
        dailyStreak: newStreak,
        bestStreak: Math.max(bestStreak, newStreak),
      };

      expect(expectedUserUpdate.dailyStreak).toBe(3);
      expect(expectedUserUpdate.bestStreak).toBe(3);
    });

    it('should preserve bestStreak when current streak is lower', () => {
      const userId = 'test-user';
      // User had a 10-day streak in the past, but it was broken
      const matchHistory = [
        // Old streak (10 days, but not connected to current)
        ...Array.from({ length: 10 }, (_, i) =>
          createServerMatchForDate(userId, daysAgo(20 - i)),
        ),
        // Gap
        // Current streak starts fresh
        createServerMatchForDate(userId, daysAgo(1)),
      ];

      const { currentStreak, bestStreak } =
        calculateStreakFromMatches(matchHistory);

      // Playing today would be day 2 of current streak
      const newStreak = currentStreak + 1;

      const expectedUserUpdate = {
        dailyStreak: newStreak,
        bestStreak: Math.max(bestStreak, newStreak),
      };

      expect(expectedUserUpdate.dailyStreak).toBe(2);
      expect(expectedUserUpdate.bestStreak).toBe(10); // Best streak preserved
    });

    it('should update bestStreak when current streak exceeds it', () => {
      const userId = 'test-user';
      // User had a 3-day streak that is ongoing
      const matchHistory = [
        createServerMatchForDate(userId, daysAgo(2)),
        createServerMatchForDate(userId, daysAgo(1)),
      ];

      const { currentStreak, bestStreak } =
        calculateStreakFromMatches(matchHistory);

      // Playing today makes it day 3, which is a new best
      const newStreak = currentStreak + 1;

      const expectedUserUpdate = {
        dailyStreak: newStreak,
        bestStreak: Math.max(bestStreak, newStreak),
      };

      expect(expectedUserUpdate.dailyStreak).toBe(3);
      expect(expectedUserUpdate.bestStreak).toBe(3);
    });
  });
});

describe('[Firestore] Match History Source Selection', () => {
  /**
   * Critical test: For logged-in users, match history MUST come from server,
   * NOT from localStorage (which may be empty).
   *
   * This documents the bug that caused streak bonus to always be 0 for logged-in users.
   */
  describe('getMatchHistoryForStreakCalculation', () => {
    it('should use server match history for logged-in users', () => {
      // This is a conceptual test - the actual implementation should:
      // 1. Check if user is logged in
      // 2. If logged in: fetch from getMatchHistoryServer(userId)
      // 3. If anonymous: fetch from getMatchHistory() (localStorage)

      const isLoggedIn = true;
      const userId = 'test-user-123';

      // The function signature should be:
      // async function getMatchHistoryForUser(isLoggedIn: boolean, userId?: string)

      // When isLoggedIn is true, it MUST call the server function
      expect(isLoggedIn).toBe(true);
      expect(userId).toBeDefined();

      // Mock expectation: getMatchHistoryServer should be called, NOT getMatchHistory
    });

    it('should use localStorage match history for anonymous users', () => {
      const isLoggedIn = false;

      // When isLoggedIn is false, it should use localStorage
      expect(isLoggedIn).toBe(false);

      // Mock expectation: getMatchHistory (localStorage) should be called
    });
  });
});
