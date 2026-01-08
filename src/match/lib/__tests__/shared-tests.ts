/**
 * Shared Match Tests
 * 
 * These tests are run against both localStorage (client) and Firestore (server)
 * to ensure consistent behavior across both storage backends.
 * 
 * Test categories:
 * 1. Match history operations (save, retrieve, ordering)
 * 2. Streak calculation compatibility
 * 3. Score and bonus preservation
 */

import { calculateStreakFromMatches, calculateStreakBonus } from '@/user/lib/stats';
import type { BaseMatch } from '@/match/types';

/**
 * Create a date N days ago from today at noon (to avoid DST issues)
 */
export function daysAgo(n: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - n);
  date.setHours(12, 0, 0, 0);
  return date;
}

/**
 * Base match factory - override with storage-specific fields
 */
export function createBaseMatchForDate(
  date: Date,
  overrides: Partial<BaseMatch> = {}
): BaseMatch {
  const timestamp = date.getTime();
  return {
    id: `match_${timestamp}`,
    isWon: true,
    score: 100,
    streakBonus: 0,
    autoSolvesCount: 0,
    autoSolves: '[]',
    livesRemaining: 3,
    board: '[]',
    originalBoard: '[]',
    solution: '[]',
    timestamp,
    ...overrides
  };
}

/**
 * Interface for storage adapter (localStorage or Firestore)
 */
export interface MatchStorageAdapter<T extends BaseMatch> {
  saveMatch: (match: T) => Promise<{ success: boolean; error?: string }>;
  getMatchHistory: () => Promise<T[]>;
  getTodaysMatch: () => Promise<T | null>;
  hasPlayedToday: () => Promise<boolean>;
  clearAll: () => void | Promise<void>;
  createMatch: (date: Date, overrides?: Partial<T>) => T;
}

/**
 * Run shared tests against a storage adapter
 */
export function runSharedMatchTests<T extends BaseMatch>(
  adapterName: string,
  getAdapter: () => MatchStorageAdapter<T>
) {
  describe(`[${adapterName}] Match History Operations`, () => {
    let adapter: MatchStorageAdapter<T>;

    beforeEach(async () => {
      adapter = getAdapter();
      await adapter.clearAll();
    });

    describe('saveMatch', () => {
      it('should save a match successfully', async () => {
        const match = adapter.createMatch(new Date());
        const result = await adapter.saveMatch(match);
        expect(result.success).toBe(true);
      });

      it('should add match to existing history', async () => {
        const match1 = adapter.createMatch(daysAgo(1), { id: 'match_1' });
        const match2 = adapter.createMatch(new Date(), { id: 'match_2' });

        await adapter.saveMatch(match1);
        await adapter.saveMatch(match2);

        const history = await adapter.getMatchHistory();
        expect(history).toHaveLength(2);
      });
    });

    describe('getMatchHistory', () => {
      it('should return empty array if no matches', async () => {
        const history = await adapter.getMatchHistory();
        expect(history).toEqual([]);
      });

      it('should return all matches in chronological order', async () => {
        const match1 = adapter.createMatch(daysAgo(3), { id: 'oldest' });
        const match2 = adapter.createMatch(daysAgo(2), { id: 'middle' });
        const match3 = adapter.createMatch(daysAgo(1), { id: 'newest' });

        // Save in random order
        await adapter.saveMatch(match2);
        await adapter.saveMatch(match1);
        await adapter.saveMatch(match3);

        const history = await adapter.getMatchHistory();
        expect(history).toHaveLength(3);
        // Should be sorted by timestamp ascending
        expect(history[0].id).toBe('oldest');
        expect(history[1].id).toBe('middle');
        expect(history[2].id).toBe('newest');
      });
    });

    describe('getTodaysMatch', () => {
      it('should return match from today', async () => {
        const todayMatch = adapter.createMatch(new Date(), { id: 'today_match' });
        await adapter.saveMatch(todayMatch);

        const retrieved = await adapter.getTodaysMatch();
        expect(retrieved).not.toBeNull();
        expect(retrieved?.id).toBe('today_match');
      });

      it('should return null if only old matches exist', async () => {
        const oldMatch = adapter.createMatch(daysAgo(2), { id: 'old_match' });
        await adapter.saveMatch(oldMatch);

        const retrieved = await adapter.getTodaysMatch();
        expect(retrieved).toBeNull();
      });

      it('should return null if no matches exist', async () => {
        const retrieved = await adapter.getTodaysMatch();
        expect(retrieved).toBeNull();
      });
    });

    describe('hasPlayedToday', () => {
      it('should return true if match from today exists', async () => {
        const todayMatch = adapter.createMatch(new Date());
        await adapter.saveMatch(todayMatch);

        const hasPlayed = await adapter.hasPlayedToday();
        expect(hasPlayed).toBe(true);
      });

      it('should return false if no matches exist', async () => {
        const hasPlayed = await adapter.hasPlayedToday();
        expect(hasPlayed).toBe(false);
      });

      it('should return false if only old matches exist', async () => {
        const oldMatch = adapter.createMatch(daysAgo(2));
        await adapter.saveMatch(oldMatch);

        const hasPlayed = await adapter.hasPlayedToday();
        expect(hasPlayed).toBe(false);
      });
    });
  });

  describe(`[${adapterName}] Streak Calculation Compatibility`, () => {
    let adapter: MatchStorageAdapter<T>;

    beforeEach(async () => {
      adapter = getAdapter();
      await adapter.clearAll();
    });

    it('should return matches with timestamps for streak calculation', async () => {
      const yesterdayMatch = adapter.createMatch(daysAgo(1), { id: 'yesterday' });
      const todayMatch = adapter.createMatch(new Date(), { id: 'today' });

      await adapter.saveMatch(yesterdayMatch);
      await adapter.saveMatch(todayMatch);

      const history = await adapter.getMatchHistory();

      // History should have all matches needed for streak calculation
      expect(history).toHaveLength(2);
      expect(history.every(m => typeof m.timestamp === 'number')).toBe(true);

      // Should be sorted by timestamp (oldest first) for streak algorithms
      expect(history[0].id).toBe('yesterday');
      expect(history[1].id).toBe('today');
    });

    it('should preserve streakBonus field for total score calculation', async () => {
      const match = adapter.createMatch(new Date(), {
        id: 'with_bonus',
        score: 500,
        streakBonus: 200
      });
      await adapter.saveMatch(match);

      const history = await adapter.getMatchHistory();
      expect(history[0].streakBonus).toBe(200);
      expect(history[0].score + history[0].streakBonus).toBe(700);
    });

    it('should return match history that supports multi-day streak', async () => {
      // Create matches for 3 consecutive days
      await adapter.saveMatch(adapter.createMatch(daysAgo(3), { id: 'day1' }));
      await adapter.saveMatch(adapter.createMatch(daysAgo(2), { id: 'day2' }));
      await adapter.saveMatch(adapter.createMatch(daysAgo(1), { id: 'day3' }));

      const history = await adapter.getMatchHistory();

      // All 3 matches should be returned for streak calculation
      expect(history).toHaveLength(3);

      // Verify dates are on different days
      const dates = history.map(m => new Date(m.timestamp).toDateString());
      const uniqueDates = new Set(dates);
      expect(uniqueDates.size).toBe(3);
    });

    it('should not lose match history after adding new match', async () => {
      const oldMatch = adapter.createMatch(daysAgo(1), { id: 'old' });
      await adapter.saveMatch(oldMatch);

      let history = await adapter.getMatchHistory();
      expect(history).toHaveLength(1);

      // Add new match - old one should still be there
      const newMatch = adapter.createMatch(new Date(), { id: 'new' });
      await adapter.saveMatch(newMatch);

      history = await adapter.getMatchHistory();
      expect(history).toHaveLength(2);
      expect(history.map(m => m.id)).toContain('old');
      expect(history.map(m => m.id)).toContain('new');
    });

    it('should calculate correct streak bonus from history', async () => {
      // Create 2 consecutive days of matches
      await adapter.saveMatch(adapter.createMatch(daysAgo(1)));

      const history = await adapter.getMatchHistory();
      const { currentStreak } = calculateStreakFromMatches(history);

      // Playing today would extend to day 2
      const streakBonus = calculateStreakBonus(currentStreak + 1);

      expect(currentStreak).toBe(1);
      expect(streakBonus).toBe(200);
    });

    it('should return 0 streak bonus when streak is broken', async () => {
      // Create match from 3 days ago (streak broken)
      await adapter.saveMatch(adapter.createMatch(daysAgo(3)));

      const history = await adapter.getMatchHistory();
      const { currentStreak } = calculateStreakFromMatches(history);

      // Playing today starts fresh
      const streakBonus = calculateStreakBonus(currentStreak + 1);

      expect(currentStreak).toBe(0);
      expect(streakBonus).toBe(0);
    });
  });

  describe(`[${adapterName}] Streak Update Verification`, () => {
    let adapter: MatchStorageAdapter<T>;

    beforeEach(async () => {
      adapter = getAdapter();
      await adapter.clearAll();
    });

    it('should calculate dailyStreak correctly for ongoing streak', async () => {
      // 3-day ongoing streak
      await adapter.saveMatch(adapter.createMatch(daysAgo(2)));
      await adapter.saveMatch(adapter.createMatch(daysAgo(1)));

      const history = await adapter.getMatchHistory();
      const { currentStreak, bestStreak } = calculateStreakFromMatches(history);

      // Playing today makes it day 3
      const newStreak = currentStreak + 1;

      expect(newStreak).toBe(3);
      expect(Math.max(bestStreak, newStreak)).toBe(3);
    });

    it('should preserve bestStreak when current streak is lower', async () => {
      // Old 5-day streak (broken)
      for (let i = 0; i < 5; i++) {
        await adapter.saveMatch(adapter.createMatch(daysAgo(10 - i), { id: `old_${i}` }));
      }
      // Gap, then new streak starting yesterday
      await adapter.saveMatch(adapter.createMatch(daysAgo(1), { id: 'new_1' }));

      const history = await adapter.getMatchHistory();
      const { currentStreak, bestStreak } = calculateStreakFromMatches(history);

      // Playing today = day 2 of new streak
      const newStreak = currentStreak + 1;

      expect(newStreak).toBe(2);
      expect(bestStreak).toBe(5); // Best streak preserved
      expect(Math.max(bestStreak, newStreak)).toBe(5);
    });
  });
}
