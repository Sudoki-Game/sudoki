/**
 * Sync Module Tests
 *
 * Tests for the sync/transfer logic that handles:
 * - Transferring local data to server on account creation
 * - Syncing data on login
 */

import { ClientMatch } from '@/match/types';

// We'll implement these functions
import {
  prepareTransferData,
  mergeWithServerData,
  clearLocalDataAfterTransfer
} from '../sync';

/**
 * Create a test match with correct BaseMatch structure
 */
function createTestMatch(overrides: Partial<ClientMatch> = {}): ClientMatch {
  return {
    id: `match_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    isWon: true,
    score: 100,
    streakBonus: 0,
    autoSolvesCount: 0,
    autoSolves: '[]',
    livesRemaining: 3,
    board: '[]',
    originalBoard: '[]',
    solution: '[]',
    timestamp: Date.now(),
    ...overrides
  };
}

describe('prepareTransferData', () => {
  const mockMatches: ClientMatch[] = [
    createTestMatch({
      id: 'match-1',
      score: 200,
      timestamp: Date.now() - 86400000 * 2,
      streakBonus: 0
    }),
    createTestMatch({
      id: 'match-2',
      score: 300,
      timestamp: Date.now() - 86400000,
      streakBonus: 200
    })
  ];

  it('should prepare transfer data with matches and recalculated stats', () => {
    const result = prepareTransferData(mockMatches);

    expect(result.matches).toHaveLength(2);
    expect(result.recalculatedStats.matchesPlayed).toBe(2);
    expect(result.recalculatedStats.combinedScore).toBe(700); // 200 + 300 + 200 (streak bonus)
  });

  it('should handle empty match history', () => {
    const result = prepareTransferData([]);

    expect(result.matches).toHaveLength(0);
    expect(result.recalculatedStats.matchesPlayed).toBe(0);
    expect(result.recalculatedStats.combinedScore).toBe(0);
  });

  it('should sort matches by timestamp', () => {
    const unsortedMatches: ClientMatch[] = [
      createTestMatch({ id: 'match-later', timestamp: 3000 }),
      createTestMatch({ id: 'match-earlier', timestamp: 1000 })
    ];

    const result = prepareTransferData(unsortedMatches);

    expect(result.matches[0].timestamp).toBe(1000);
    expect(result.matches[1].timestamp).toBe(3000);
  });
});

describe('mergeWithServerData', () => {
  const localMatches: ClientMatch[] = [
    createTestMatch({
      id: 'local-1',
      score: 100,
      timestamp: Date.now() - 86400000 * 3, // 3 days ago
      streakBonus: 0
    }),
    createTestMatch({
      id: 'local-2',
      score: 200,
      timestamp: Date.now() - 86400000, // Yesterday
      streakBonus: 0
    })
  ];

  const serverMatches: ClientMatch[] = [
    createTestMatch({
      id: 'server-1',
      score: 250,
      timestamp: Date.now() - 86400000, // Yesterday (conflict with local-2)
      streakBonus: 200
    })
  ];

  it('should merge local and server matches', () => {
    const result = mergeWithServerData(localMatches, serverMatches);

    // Should have 2 matches: local-1 (no conflict) + server-1 (takes precedence)
    expect(result.mergedMatches).toHaveLength(2);
  });

  it('should give server precedence on conflict', () => {
    const result = mergeWithServerData(localMatches, serverMatches);

    // The match from yesterday should be the server match
    const yesterdayMatch = result.mergedMatches.find(
      (m: ClientMatch) => m.id === 'server-1'
    );
    expect(yesterdayMatch).toBeDefined();

    // Local-2 should not be included
    const localYesterdayMatch = result.mergedMatches.find(
      (m: ClientMatch) => m.id === 'local-2'
    );
    expect(localYesterdayMatch).toBeUndefined();
  });

  it('should recalculate stats from merged history', () => {
    const result = mergeWithServerData(localMatches, serverMatches);

    // 2 matches: 100 + 250 + 200 (streak bonus) = 550
    expect(result.recalculatedStats.matchesPlayed).toBe(2);
  });

  it('should handle empty server data', () => {
    const result = mergeWithServerData(localMatches, []);

    expect(result.mergedMatches).toHaveLength(2);
    expect(result.mergedMatches).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'local-1' }),
        expect.objectContaining({ id: 'local-2' })
      ])
    );
  });

  it('should handle empty local data', () => {
    const result = mergeWithServerData([], serverMatches);

    expect(result.mergedMatches).toHaveLength(1);
    expect(result.mergedMatches[0].id).toBe('server-1');
  });
});

describe('clearLocalDataAfterTransfer', () => {
  // Keys must match the actual constants
  const MATCH_HISTORY_KEY = 'sudoku_match_history';
  const USER_DATA_KEY = 'sudoku_user_data';

  beforeEach(() => {
    localStorage.clear();
  });

  it('should clear match history and user data from localStorage', () => {
    // Setup local storage with data
    localStorage.setItem(MATCH_HISTORY_KEY, 'some-data');
    localStorage.setItem(USER_DATA_KEY, 'some-data');

    clearLocalDataAfterTransfer();

    expect(localStorage.getItem(MATCH_HISTORY_KEY)).toBeNull();
    expect(localStorage.getItem(USER_DATA_KEY)).toBeNull();
  });

  it('should not throw if localStorage is empty', () => {
    expect(() => clearLocalDataAfterTransfer()).not.toThrow();
  });
});
