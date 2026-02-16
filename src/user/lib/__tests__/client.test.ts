/**
 * Tests for User Client (localStorage operations)
 */

import {
  saveUserData,
  getUserData,
  clearUserData,
  updateUserStatsFromMatch,
  USER_DATA_KEY,
} from '../client';
import type { LocalUserData } from '@/user/types';
import type { ClientMatch } from '@/match/types';
import { createDefaultLocalUserData } from '@/user/types';

// Mock the HMAC secret
const mockHmacSecret = 'test-hmac-secret-key-12345';

// Store original env
const originalEnv = process.env;

/**
 * Create test user data
 */
function createTestUserData(
  overrides: Partial<LocalUserData> = {},
): LocalUserData {
  return {
    ...createDefaultLocalUserData(),
    combinedScore: 1000,
    dailyStreak: 5,
    bestStreak: 10,
    matchesPlayed: 20,
    personalBestScore: 500,
    lastMatchTimestamp: Date.now(),
    ...overrides,
  };
}

function createTestMatch(overrides: Partial<ClientMatch> = {}): ClientMatch {
  const now = Date.now();
  return {
    id: `m_${now}`,
    isWon: true,
    difficulty: 'medium',
    score: 400,
    streakBonus: 25,
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

beforeEach(() => {
  process.env = { ...originalEnv, NEXT_PUBLIC_HMAC_SECRET: mockHmacSecret };
  localStorage.clear();
});

afterAll(() => {
  process.env = originalEnv;
});

describe('saveUserData', () => {
  it('should save user data to localStorage', async () => {
    const userData = createTestUserData();
    const result = await saveUserData(userData);

    expect(result.success).toBe(true);
    expect(localStorage.getItem(USER_DATA_KEY)).not.toBeNull();
  });

  it('should return error if localStorage throws', async () => {
    const userData = createTestUserData();

    // Mock localStorage.setItem to throw
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = jest.fn(() => {
      throw new Error('Storage full');
    });

    const result = await saveUserData(userData);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Storage full');

    localStorage.setItem = originalSetItem;
  });

  it('should overwrite existing data', async () => {
    const userData1 = createTestUserData({ combinedScore: 100 });
    const userData2 = createTestUserData({ combinedScore: 200 });

    await saveUserData(userData1);
    await saveUserData(userData2);

    const retrieved = await getUserData();
    expect(retrieved?.combinedScore).toBe(200);
  });
});

describe('getUserData', () => {
  it('should retrieve saved user data', async () => {
    const userData = createTestUserData({ combinedScore: 777, dailyStreak: 3 });
    await saveUserData(userData);

    const retrieved = await getUserData();
    expect(retrieved).not.toBeNull();
    expect(retrieved?.combinedScore).toBe(777);
    expect(retrieved?.dailyStreak).toBe(3);
  });

  it('should return default data if nothing saved', async () => {
    const retrieved = await getUserData();
    const defaults = createDefaultLocalUserData();

    expect(retrieved).toEqual(defaults);
  });

  it('should return default data if data is tampered', async () => {
    const userData = createTestUserData({ combinedScore: 500 });
    await saveUserData(userData);

    // Tamper with localStorage directly
    const storedData = localStorage.getItem(USER_DATA_KEY);
    if (storedData) {
      const parsed = JSON.parse(storedData);
      // Change the data but keep the old signature
      parsed.data = Buffer.from(
        JSON.stringify({ combinedScore: 99999 }),
      ).toString('base64');
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(parsed));
    }

    const retrieved = await getUserData();
    const defaults = createDefaultLocalUserData();
    expect(retrieved).toEqual(defaults);
  });

  it('should return default data when stored payload is invalid JSON', async () => {
    localStorage.setItem(USER_DATA_KEY, 'not-json');

    const retrieved = await getUserData();
    expect(retrieved).toEqual(createDefaultLocalUserData());
  });

  it('should return default data when signed payload shape is invalid', async () => {
    localStorage.setItem(USER_DATA_KEY, JSON.stringify({ wrong: 'shape' }));

    const retrieved = await getUserData();
    expect(retrieved).toEqual(createDefaultLocalUserData());
  });
});

describe('clearUserData', () => {
  it('should remove user data from localStorage', async () => {
    const userData = createTestUserData();
    await saveUserData(userData);

    expect(localStorage.getItem(USER_DATA_KEY)).not.toBeNull();

    clearUserData();

    expect(localStorage.getItem(USER_DATA_KEY)).toBeNull();
  });

  it('should not throw if no data exists', () => {
    expect(() => clearUserData()).not.toThrow();
  });
});

describe('tamper detection', () => {
  it('should detect score tampering', async () => {
    const userData = createTestUserData({ combinedScore: 500 });
    await saveUserData(userData);

    // Tamper with score
    const storedData = localStorage.getItem(USER_DATA_KEY);
    if (storedData) {
      const parsed = JSON.parse(storedData);
      const decoded = Buffer.from(parsed.data, 'base64').toString('utf-8');
      const data = JSON.parse(decoded);
      data.combinedScore = 999999;
      parsed.data = Buffer.from(JSON.stringify(data)).toString('base64');
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(parsed));
    }

    // Should return defaults due to tampering
    const retrieved = await getUserData();
    expect(retrieved?.combinedScore).toBe(0);
  });

  it('should detect streak tampering', async () => {
    const userData = createTestUserData({ dailyStreak: 5, bestStreak: 10 });
    await saveUserData(userData);

    // Tamper with streak
    const storedData = localStorage.getItem(USER_DATA_KEY);
    if (storedData) {
      const parsed = JSON.parse(storedData);
      const decoded = Buffer.from(parsed.data, 'base64').toString('utf-8');
      const data = JSON.parse(decoded);
      data.dailyStreak = 999;
      data.bestStreak = 999;
      parsed.data = Buffer.from(JSON.stringify(data)).toString('base64');
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(parsed));
    }

    const retrieved = await getUserData();
    expect(retrieved?.dailyStreak).toBe(0);
    expect(retrieved?.bestStreak).toBe(0);
  });
});

describe('updateUserStatsFromMatch', () => {
  it('should initialize streak and counters for first-ever match', async () => {
    clearUserData();
    const match = createTestMatch({ score: 500, streakBonus: 50, timestamp: Date.now() });

    const result = await updateUserStatsFromMatch(match);
    expect(result.success).toBe(true);

    const updated = await getUserData();
    expect(updated.combinedScore).toBe(550);
    expect(updated.matchesPlayed).toBe(1);
    expect(updated.dailyStreak).toBe(1);
    expect(updated.bestStreak).toBe(1);
    expect(updated.personalBestScore).toBe(500);
    expect(updated.lastMatchTimestamp).toBe(match.timestamp);
  });

  it('should keep streak when second match is on the same day', async () => {
    const base = new Date('2026-02-14T10:00:00.000Z').getTime();
    await saveUserData(
      createTestUserData({
        combinedScore: 100,
        matchesPlayed: 2,
        dailyStreak: 4,
        bestStreak: 6,
        personalBestScore: 700,
        lastMatchTimestamp: base,
      }),
    );

    const sameDayLater = base + 2 * 60 * 60 * 1000;
    const match = createTestMatch({ score: 250, streakBonus: 10, timestamp: sameDayLater });
    await updateUserStatsFromMatch(match);

    const updated = await getUserData();
    expect(updated.dailyStreak).toBe(4);
    expect(updated.bestStreak).toBe(6);
    expect(updated.combinedScore).toBe(360);
    expect(updated.matchesPlayed).toBe(3);
  });

  it('should increment streak on consecutive day and update best streak', async () => {
    const yesterday = new Date('2026-02-14T12:00:00.000Z').getTime();
    const today = new Date('2026-02-15T13:00:00.000Z').getTime();

    await saveUserData(
      createTestUserData({
        dailyStreak: 3,
        bestStreak: 3,
        personalBestScore: 300,
        lastMatchTimestamp: yesterday,
      }),
    );

    await updateUserStatsFromMatch(
      createTestMatch({ score: 350, streakBonus: 0, timestamp: today }),
    );

    const updated = await getUserData();
    expect(updated.dailyStreak).toBe(4);
    expect(updated.bestStreak).toBe(4);
    expect(updated.personalBestScore).toBe(350);
  });

  it('should reset streak when day gap is larger than one day', async () => {
    const oldDay = new Date('2026-02-10T10:00:00.000Z').getTime();
    const newDay = new Date('2026-02-15T10:00:00.000Z').getTime();

    await saveUserData(
      createTestUserData({
        dailyStreak: 7,
        bestStreak: 9,
        lastMatchTimestamp: oldDay,
      }),
    );

    await updateUserStatsFromMatch(
      createTestMatch({ score: 120, streakBonus: undefined, timestamp: newDay }),
    );

    const updated = await getUserData();
    expect(updated.dailyStreak).toBe(1);
    expect(updated.bestStreak).toBe(9);
  });

  it('should recover from read errors by using default data', async () => {
    const originalGetItem = localStorage.getItem;
    localStorage.getItem = jest.fn(() => {
      throw new Error('read denied');
    });

    const result = await updateUserStatsFromMatch(createTestMatch());
    expect(result.success).toBe(true);

    localStorage.getItem = originalGetItem;
  });
});
