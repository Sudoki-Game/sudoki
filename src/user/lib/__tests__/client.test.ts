/**
 * Tests for User Client (localStorage operations)
 */

import {
  saveUserData,
  getUserData,
  clearUserData,
  USER_DATA_KEY
} from '../client';
import type { LocalUserData } from '@/user/types';
import { createDefaultLocalUserData } from '@/user/types';

// Mock the HMAC secret
const mockHmacSecret = 'test-hmac-secret-key-12345';

// Store original env
const originalEnv = process.env;

/**
 * Create test user data
 */
function createTestUserData(overrides: Partial<LocalUserData> = {}): LocalUserData {
  return {
    ...createDefaultLocalUserData(),
    combinedScore: 1000,
    dailyStreak: 5,
    bestStreak: 10,
    matchesPlayed: 20,
    personalBestScore: 500,
    lastMatchTimestamp: Date.now(),
    ...overrides
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
      parsed.data = Buffer.from(JSON.stringify({ combinedScore: 99999 })).toString('base64');
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(parsed));
    }

    const retrieved = await getUserData();
    const defaults = createDefaultLocalUserData();
    expect(retrieved).toEqual(defaults);
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
