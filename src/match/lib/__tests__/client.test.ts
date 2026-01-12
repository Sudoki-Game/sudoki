/**
 * Tests for Match Client (localStorage operations)
 *
 * This file includes:
 * 1. Shared tests (run against both localStorage and Firestore)
 * 2. localStorage-specific tests (tamper detection, caching)
 */

import {
  saveMatch,
  getMatch,
  getTodaysMatch,
  hasPlayedToday,
  getMatchHistory,
  clearMatchHistory,
  getCachedMatches,
  clearCacheFlag,
  clearCacheFlags,
  MATCH_HISTORY_KEY,
} from '../client';
import type { ClientMatch } from '@/match/types';
import { runSharedMatchTests, type MatchStorageAdapter } from './shared-tests';

// Mock the HMAC secret
const mockHmacSecret = 'test-hmac-secret-key-12345';

// Store original env
const originalEnv = process.env;

/**
 * Create a valid test match
 */
function createTestMatch(overrides: Partial<ClientMatch> = {}): ClientMatch {
  const now = Date.now();
  return {
    id: `test_${now}`,
    isWon: true,
    score: 500,
    streakBonus: 0,
    autoSolvesCount: 0,
    autoSolves: '[]',
    livesRemaining: 3,
    board: '[[1,2,3,4,5,6,7,8,9]]',
    originalBoard: '[[null,2,3,4,5,6,7,8,9]]',
    solution: '[[1,2,3,4,5,6,7,8,9]]',
    timestamp: now,
    ...overrides,
  };
}

/**
 * Create a match from a specific date
 */
function createMatchFromDate(
  date: Date,
  overrides: Partial<ClientMatch> = {},
): ClientMatch {
  const timestamp = date.getTime();
  return createTestMatch({
    id: `test_${timestamp}`,
    timestamp,
    ...overrides,
  });
}

/**
 * localStorage adapter for shared tests
 */
function createLocalStorageAdapter(): MatchStorageAdapter<ClientMatch> {
  return {
    saveMatch: async (match: ClientMatch) => saveMatch(match),
    getMatchHistory: async () => getMatchHistory(),
    getTodaysMatch: async () => getTodaysMatch(),
    hasPlayedToday: async () => hasPlayedToday(),
    clearAll: () => {
      clearMatchHistory();
    },
    createMatch: (date: Date, overrides?: Partial<ClientMatch>) =>
      createMatchFromDate(date, overrides),
  };
}

beforeEach(() => {
  process.env = { ...originalEnv, NEXT_PUBLIC_HMAC_SECRET: mockHmacSecret };
  localStorage.clear();
});

afterAll(() => {
  process.env = originalEnv;
});

// ============================================
// Run shared tests against localStorage
// ============================================
runSharedMatchTests('localStorage', createLocalStorageAdapter);

// ============================================
// localStorage-specific tests
// ============================================

describe('[localStorage] getMatch by ID', () => {
  it('should retrieve a saved match by id', async () => {
    const match = createTestMatch({ id: 'specific_id', score: 777 });
    await saveMatch(match);

    const retrieved = await getMatch('specific_id');
    expect(retrieved).not.toBeNull();
    expect(retrieved?.id).toBe('specific_id');
    expect(retrieved?.score).toBe(777);
  });

  it('should return null for non-existent match', async () => {
    const retrieved = await getMatch('non_existent_id');
    expect(retrieved).toBeNull();
  });

  it('should return null if localStorage is empty', async () => {
    const retrieved = await getMatch('any_id');
    expect(retrieved).toBeNull();
  });
});

describe('[localStorage] Storage error handling', () => {
  it('should return error if localStorage throws on save', async () => {
    const match = createTestMatch();

    // Mock localStorage.setItem to throw
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = jest.fn(() => {
      throw new Error('Storage full');
    });

    const result = await saveMatch(match);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Storage full');

    localStorage.setItem = originalSetItem;
  });
});

describe('[localStorage] Tamper detection', () => {
  it('should return empty array if data is tampered', async () => {
    // Save a valid match first
    const match = createTestMatch();
    await saveMatch(match);

    // Tamper with localStorage directly
    const storedData = localStorage.getItem(MATCH_HISTORY_KEY);
    if (storedData) {
      const parsed = JSON.parse(storedData);
      // Change the data but keep the old signature
      parsed.data = Buffer.from(
        JSON.stringify([{ id: 'fake', score: 99999 }]),
      ).toString('base64');
      localStorage.setItem(MATCH_HISTORY_KEY, JSON.stringify(parsed));
    }

    const history = await getMatchHistory();
    expect(history).toEqual([]);
  });

  it('should detect score tampering', async () => {
    const match = createTestMatch({ score: 500 });
    await saveMatch(match);

    // Get the stored data
    const storedData = localStorage.getItem(MATCH_HISTORY_KEY);
    if (storedData) {
      const parsed = JSON.parse(storedData);
      // Decode, modify score, re-encode (keeping old signature)
      const decoded = Buffer.from(parsed.data, 'base64').toString('utf-8');
      const matches = JSON.parse(decoded);
      matches[0].score = 99999;
      parsed.data = Buffer.from(JSON.stringify(matches)).toString('base64');
      localStorage.setItem(MATCH_HISTORY_KEY, JSON.stringify(parsed));
    }

    // Should return empty due to tampering
    const history = await getMatchHistory();
    expect(history).toEqual([]);
  });

  it('should detect isWon tampering', async () => {
    const match = createTestMatch({ isWon: false });
    await saveMatch(match);

    // Tamper with isWon
    const storedData = localStorage.getItem(MATCH_HISTORY_KEY);
    if (storedData) {
      const parsed = JSON.parse(storedData);
      const decoded = Buffer.from(parsed.data, 'base64').toString('utf-8');
      const matches = JSON.parse(decoded);
      matches[0].isWon = true; // Cheat: change loss to win
      parsed.data = Buffer.from(JSON.stringify(matches)).toString('base64');
      localStorage.setItem(MATCH_HISTORY_KEY, JSON.stringify(parsed));
    }

    const history = await getMatchHistory();
    expect(history).toEqual([]);
  });
});

describe('[localStorage] Cache functionality', () => {
  it('should save a match with isCached flag when specified', async () => {
    const match = createTestMatch({ id: 'cached_match' });
    await saveMatch(match, { isCached: true });

    const history = await getMatchHistory();
    expect(history).toHaveLength(1);
    expect(history[0].isCached).toBe(true);
  });

  it('should not set isCached flag when not specified', async () => {
    const match = createTestMatch({ id: 'normal_match' });
    await saveMatch(match);

    const history = await getMatchHistory();
    expect(history).toHaveLength(1);
    expect(history[0].isCached).toBeUndefined();
  });

  describe('getCachedMatches', () => {
    it('should return empty array when no cached matches exist', async () => {
      const match = createTestMatch();
      await saveMatch(match);

      const cached = await getCachedMatches();
      expect(cached).toEqual([]);
    });

    it('should return only matches with isCached flag', async () => {
      const normalMatch = createTestMatch({ id: 'normal' });
      const cachedMatch1 = createTestMatch({ id: 'cached1' });
      const cachedMatch2 = createTestMatch({ id: 'cached2' });

      await saveMatch(normalMatch);
      await saveMatch(cachedMatch1, { isCached: true });
      await saveMatch(cachedMatch2, { isCached: true });

      const cached = await getCachedMatches();
      expect(cached).toHaveLength(2);
      expect(cached.map((m: { id: string }) => m.id)).toContain('cached1');
      expect(cached.map((m: { id: string }) => m.id)).toContain('cached2');
      expect(cached.map((m: { id: string }) => m.id)).not.toContain('normal');
    });
  });

  describe('clearCacheFlag', () => {
    it('should remove isCached flag from a specific match', async () => {
      const match = createTestMatch({ id: 'cached_to_clear' });
      await saveMatch(match, { isCached: true });

      // Verify it's cached
      let cached = await getCachedMatches();
      expect(cached).toHaveLength(1);

      // Clear the flag
      await clearCacheFlag('cached_to_clear');

      // Verify it's no longer cached
      cached = await getCachedMatches();
      expect(cached).toHaveLength(0);

      // But match should still exist in history
      const history = await getMatchHistory();
      expect(history).toHaveLength(1);
      expect(history[0].isCached).toBeUndefined();
    });
  });

  describe('clearCacheFlags', () => {
    it('should remove isCached flag from multiple matches', async () => {
      const match1 = createTestMatch({ id: 'cached1' });
      const match2 = createTestMatch({ id: 'cached2' });
      const match3 = createTestMatch({ id: 'cached3' });

      await saveMatch(match1, { isCached: true });
      await saveMatch(match2, { isCached: true });
      await saveMatch(match3, { isCached: true });

      // Clear flags for only two of them
      await clearCacheFlags(['cached1', 'cached2']);

      const cached = await getCachedMatches();
      expect(cached).toHaveLength(1);
      expect(cached[0].id).toBe('cached3');
    });

    it('should handle empty array', async () => {
      const match = createTestMatch({ id: 'cached' });
      await saveMatch(match, { isCached: true });

      await clearCacheFlags([]);

      const cached = await getCachedMatches();
      expect(cached).toHaveLength(1);
    });
  });
});

describe('[localStorage] clearMatchHistory', () => {
  it('should remove all matches from localStorage', async () => {
    const match = createTestMatch();
    await saveMatch(match);

    expect(localStorage.getItem(MATCH_HISTORY_KEY)).not.toBeNull();

    clearMatchHistory();

    expect(localStorage.getItem(MATCH_HISTORY_KEY)).toBeNull();
  });

  it('should not throw if no matches exist', () => {
    expect(() => clearMatchHistory()).not.toThrow();
  });
});
