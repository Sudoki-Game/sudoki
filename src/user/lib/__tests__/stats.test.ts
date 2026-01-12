/**
 * Tests for Stats Calculation
 */

import {
  calculateStatsFromMatches,
  calculateStreakFromMatches,
  mergeMatchHistories,
  calculateStreakBonus,
} from '../stats';
import type { ClientMatch } from '@/match/types';

/**
 * Create a test match for a specific date
 */
function createMatchForDate(
  date: Date,
  overrides: Partial<ClientMatch> = {},
): ClientMatch {
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
    ...overrides,
  };
}

/**
 * Create a date N days ago from today
 */
function daysAgo(n: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - n);
  // Set to noon to avoid DST issues
  date.setHours(12, 0, 0, 0);
  return date;
}

describe('calculateStatsFromMatches', () => {
  it('should return default stats for empty match array', () => {
    const stats = calculateStatsFromMatches([]);

    expect(stats.combinedScore).toBe(0);
    expect(stats.matchesPlayed).toBe(0);
    expect(stats.personalBestScore).toBe(0);
    expect(stats.dailyStreak).toBe(0);
    expect(stats.bestStreak).toBe(0);
    expect(stats.lastMatchTimestamp).toBeNull();
  });

  it('should calculate combined score correctly', () => {
    const matches = [
      createMatchForDate(daysAgo(2), { score: 100, streakBonus: 50 }),
      createMatchForDate(daysAgo(1), { score: 200, streakBonus: 100 }),
      createMatchForDate(daysAgo(0), { score: 150, streakBonus: 0 }),
    ];

    const stats = calculateStatsFromMatches(matches);

    // Combined score = (100+50) + (200+100) + (150+0) = 600
    expect(stats.combinedScore).toBe(600);
  });

  it('should calculate matches played correctly', () => {
    const matches = [
      createMatchForDate(daysAgo(5)),
      createMatchForDate(daysAgo(3)),
      createMatchForDate(daysAgo(1)),
      createMatchForDate(daysAgo(0)),
    ];

    const stats = calculateStatsFromMatches(matches);
    expect(stats.matchesPlayed).toBe(4);
  });

  it('should calculate personal best score correctly', () => {
    const matches = [
      createMatchForDate(daysAgo(2), { score: 100 }),
      createMatchForDate(daysAgo(1), { score: 500 }),
      createMatchForDate(daysAgo(0), { score: 200 }),
    ];

    const stats = calculateStatsFromMatches(matches);
    expect(stats.personalBestScore).toBe(500);
  });

  it('should set lastMatchTimestamp to most recent match', () => {
    const recentDate = daysAgo(0);
    const matches = [
      createMatchForDate(daysAgo(5)),
      createMatchForDate(recentDate),
      createMatchForDate(daysAgo(3)),
    ];

    const stats = calculateStatsFromMatches(matches);
    expect(stats.lastMatchTimestamp).toBe(recentDate.getTime());
  });
});

describe('calculateStreakFromMatches', () => {
  it('should return 0 for empty matches', () => {
    const { currentStreak, bestStreak } = calculateStreakFromMatches([]);
    expect(currentStreak).toBe(0);
    expect(bestStreak).toBe(0);
  });

  it('should calculate current streak for consecutive days', () => {
    const matches = [
      createMatchForDate(daysAgo(2)),
      createMatchForDate(daysAgo(1)),
      createMatchForDate(daysAgo(0)),
    ];

    const { currentStreak } = calculateStreakFromMatches(matches);
    expect(currentStreak).toBe(3);
  });

  it('should break streak if day is missed', () => {
    const matches = [
      createMatchForDate(daysAgo(5)),
      createMatchForDate(daysAgo(4)),
      // Day 3 missed
      createMatchForDate(daysAgo(1)),
      createMatchForDate(daysAgo(0)),
    ];

    const { currentStreak, bestStreak } = calculateStreakFromMatches(matches);
    expect(currentStreak).toBe(2);
    expect(bestStreak).toBe(2); // Best is the longer of the two segments
  });

  it('should track best streak separately from current', () => {
    const matches = [
      createMatchForDate(daysAgo(10)),
      createMatchForDate(daysAgo(9)),
      createMatchForDate(daysAgo(8)),
      createMatchForDate(daysAgo(7)),
      createMatchForDate(daysAgo(6)),
      // Break
      createMatchForDate(daysAgo(1)),
      createMatchForDate(daysAgo(0)),
    ];

    const { currentStreak, bestStreak } = calculateStreakFromMatches(matches);
    expect(currentStreak).toBe(2);
    expect(bestStreak).toBe(5);
  });

  it('should handle single match as streak of 1', () => {
    const matches = [createMatchForDate(daysAgo(0))];

    const { currentStreak, bestStreak } = calculateStreakFromMatches(matches);
    expect(currentStreak).toBe(1);
    expect(bestStreak).toBe(1);
  });

  it('should have current streak of 0 if not played today', () => {
    const matches = [
      createMatchForDate(daysAgo(3)),
      createMatchForDate(daysAgo(2)),
      // Not played yesterday or today
    ];

    const { currentStreak } = calculateStreakFromMatches(matches);
    expect(currentStreak).toBe(0);
  });

  it('should continue streak if played yesterday but not today', () => {
    const matches = [
      createMatchForDate(daysAgo(2)),
      createMatchForDate(daysAgo(1)),
      // Not played today yet
    ];

    const { currentStreak } = calculateStreakFromMatches(matches);
    // Streak is maintained as user might still play today
    expect(currentStreak).toBe(2);
  });
});

describe('mergeMatchHistories', () => {
  it('should return empty array for two empty arrays', () => {
    const merged = mergeMatchHistories([], []);
    expect(merged).toEqual([]);
  });

  it('should return local matches if server is empty', () => {
    const localMatches = [
      createMatchForDate(daysAgo(1), { id: 'local_1' }),
      createMatchForDate(daysAgo(0), { id: 'local_2' }),
    ];

    const merged = mergeMatchHistories(localMatches, []);
    expect(merged).toHaveLength(2);
  });

  it('should return server matches if local is empty', () => {
    const serverMatches = [
      createMatchForDate(daysAgo(1), { id: 'server_1' }),
      createMatchForDate(daysAgo(0), { id: 'server_2' }),
    ];

    const merged = mergeMatchHistories([], serverMatches);
    expect(merged).toHaveLength(2);
  });

  it('should prefer server match when same day conflict exists', () => {
    const sameDay = daysAgo(1);
    const localMatches = [
      createMatchForDate(sameDay, { id: 'local_1', score: 100 }),
    ];
    const serverMatches = [
      createMatchForDate(sameDay, { id: 'server_1', score: 200 }),
    ];

    const merged = mergeMatchHistories(localMatches, serverMatches);
    expect(merged).toHaveLength(1);
    expect(merged[0].id).toBe('server_1');
    expect(merged[0].score).toBe(200);
  });

  it('should include both when no conflict', () => {
    const localMatches = [createMatchForDate(daysAgo(2), { id: 'local_1' })];
    const serverMatches = [createMatchForDate(daysAgo(1), { id: 'server_1' })];

    const merged = mergeMatchHistories(localMatches, serverMatches);
    expect(merged).toHaveLength(2);
    expect(merged.map((m: { id: string }) => m.id).sort()).toEqual([
      'local_1',
      'server_1',
    ]);
  });

  it('should sort merged results by timestamp', () => {
    const localMatches = [
      createMatchForDate(daysAgo(0), { id: 'local_today' }),
    ];
    const serverMatches = [
      createMatchForDate(daysAgo(5), { id: 'server_old' }),
    ];

    const merged = mergeMatchHistories(localMatches, serverMatches);
    expect(merged[0].id).toBe('server_old');
    expect(merged[1].id).toBe('local_today');
  });
});

describe('calculateStreakBonus', () => {
  it('should return 0 for no streak', () => {
    const bonus = calculateStreakBonus(0);
    expect(bonus).toBe(0);
  });

  it('should return 0 for streak of 1', () => {
    const bonus = calculateStreakBonus(1);
    expect(bonus).toBe(0);
  });

  it('should return 200 for streak of 2 or more', () => {
    expect(calculateStreakBonus(2)).toBe(200);
    expect(calculateStreakBonus(5)).toBe(200);
    expect(calculateStreakBonus(100)).toBe(200);
  });
});
