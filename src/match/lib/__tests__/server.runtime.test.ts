import type { ServerMatch } from '@/match/types';
import {
  MATCHES_COLLECTION,
  saveMatch,
  getMatch,
  getTodaysMatch,
  hasPlayedToday,
  hasMatchForDate,
  getMatchHistory,
  saveMatchBatch,
  updateUserStatsFromMatch,
  deleteUserMatches,
} from '../server';
import { serverDb } from '@/firebase/server';
import { validateMatch } from '../validation';

jest.mock('@/firebase/server', () => ({
  serverDb: {
    collection: jest.fn(),
    batch: jest.fn(),
  },
}));

const incrementMock = jest.fn((value: number) => ({ __increment: value }));

jest.mock('firebase-admin/firestore', () => ({
  FieldValue: {
    increment: (value: number) => incrementMock(value),
  },
}));

jest.mock('../validation', () => ({
  validateMatch: jest.fn(),
}));

function createMatch(overrides: Partial<ServerMatch> = {}): ServerMatch {
  return {
    id: 'match-1',
    userPlayed: 'user-1',
    isWon: true,
    difficulty: 'medium',
    score: 200,
    streakBonus: 0,
    autoSolvesCount: 0,
    autoSolves: '[]',
    livesRemaining: 3,
    board: '[]',
    originalBoard: '[]',
    solution: '[]',
    timestamp: Date.now(),
    ...overrides,
  };
}

type MockDoc = {
  id: string;
  data: () => unknown;
  ref?: unknown;
};

function createSnapshot(docs: MockDoc[]) {
  return {
    docs,
    empty: docs.length === 0,
  };
}

describe('match/lib/server runtime', () => {
  let matchDocRef: {
    get: jest.Mock;
    set: jest.Mock;
  };
  let userDocRef: {
    get: jest.Mock;
    update: jest.Mock;
  };
  let deleteDocRef: {
    delete: jest.Mock;
  };
  let whereQuery: {
    get: jest.Mock;
    orderBy: jest.Mock;
    limit: jest.Mock;
    where?: jest.Mock;
  };
  let batchRef: {
    set: jest.Mock;
    delete: jest.Mock;
    commit: jest.Mock;
  };
  let consoleErrorSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    matchDocRef = {
      get: jest.fn(),
      set: jest.fn(),
    };

    userDocRef = {
      get: jest.fn(),
      update: jest.fn(),
    };

    deleteDocRef = {
      delete: jest.fn(),
    };

    whereQuery = {
      get: jest.fn(),
      orderBy: jest.fn(),
      limit: jest.fn(),
    };
    whereQuery.orderBy.mockReturnValue(whereQuery);
    whereQuery.limit.mockReturnValue(whereQuery);

    batchRef = {
      set: jest.fn(),
      delete: jest.fn(),
      commit: jest.fn(),
    };

    (serverDb.batch as jest.Mock).mockReturnValue(batchRef);

    (serverDb.collection as jest.Mock).mockImplementation((name: string) => {
      if (name === MATCHES_COLLECTION) {
        return {
          where: jest.fn(() => whereQuery),
          doc: jest.fn((id?: string) =>
            id && id.startsWith('delete-') ? deleteDocRef : matchDocRef,
          ),
        };
      }

      if (name === 'users') {
        return {
          doc: jest.fn(() => userDocRef),
        };
      }

      throw new Error(`Unexpected collection: ${name}`);
    });

    (validateMatch as jest.Mock).mockReturnValue({
      isValid: true,
      errors: [],
      warnings: [],
    });

    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  describe('saveMatch', () => {
    it('returns validation error when match is invalid', async () => {
      (validateMatch as jest.Mock).mockReturnValue({
        isValid: false,
        errors: [{ field: 'score', message: 'bad score' }],
        warnings: [],
      });

      const result = await saveMatch('user-1', createMatch());

      expect(result).toEqual({
        success: false,
        error: 'Invalid match data: score: bad score',
      });
      expect(matchDocRef.set).not.toHaveBeenCalled();
    });

    it('warns on validation warnings and saves successfully', async () => {
      (validateMatch as jest.Mock).mockReturnValue({
        isValid: true,
        errors: [],
        warnings: [{ field: 'difficulty', message: 'suspicious' }],
      });
      whereQuery.get.mockResolvedValue(createSnapshot([]));
      userDocRef.get.mockResolvedValue({ exists: false, data: () => ({}) });
      userDocRef.update.mockResolvedValue(undefined);
      matchDocRef.set.mockResolvedValue(undefined);

      const match = createMatch({ userPlayed: 'user-1' });
      const result = await saveMatch('user-1', match);

      expect(result).toEqual({ success: true });
      expect(matchDocRef.set).toHaveBeenCalledWith(match);
    });

    it('returns mismatch error when user IDs differ', async () => {
      const result = await saveMatch('user-2', createMatch({ userPlayed: 'user-1' }));

      expect(result).toEqual({ success: false, error: 'User ID mismatch' });
    });

    it('rejects older match if same day match already exists', async () => {
      const newerTimestamp = Date.now();
      const olderTimestamp = newerTimestamp - 1000;
      whereQuery.get.mockResolvedValue(
        createSnapshot([
          {
            id: 'existing',
            data: () => createMatch({ timestamp: newerTimestamp }),
          },
        ]),
      );

      const result = await saveMatch(
        'user-1',
        createMatch({ timestamp: olderTimestamp, userPlayed: 'user-1' }),
      );

      expect(result).toEqual({
        success: false,
        error: 'Match already exists for today',
      });
    });

    it('swallows stats update failure and still saves match', async () => {
      whereQuery.get.mockResolvedValue(createSnapshot([]));
      userDocRef.get.mockRejectedValue(new Error('user read failed'));
      matchDocRef.set.mockResolvedValue(undefined);

      const result = await saveMatch('user-1', createMatch({ userPlayed: 'user-1' }));

      expect(result).toEqual({ success: true });
    });

    it('returns save failure on unexpected exception', async () => {
      whereQuery.get.mockRejectedValue(new Error('query failed'));

      const result = await saveMatch('user-1', createMatch({ userPlayed: 'user-1' }));

      expect(result).toEqual({ success: false, error: 'query failed' });
    });
  });

  describe('getMatch', () => {
    it('returns null when match does not exist', async () => {
      matchDocRef.get.mockResolvedValue({ exists: false });

      await expect(getMatch('match-1')).resolves.toBeNull();
    });

    it('returns match data when found', async () => {
      const match = createMatch();
      matchDocRef.get.mockResolvedValue({ exists: true, data: () => match });

      await expect(getMatch('match-1')).resolves.toEqual(match);
    });

    it('returns null when getMatch throws', async () => {
      matchDocRef.get.mockRejectedValue(new Error('db failed'));

      await expect(getMatch('match-1')).resolves.toBeNull();
    });
  });

  describe('getTodaysMatch and helpers', () => {
    it('returns today\'s match from query result', async () => {
      const today = createMatch({ id: 'today' });
      const old = createMatch({ id: 'old', timestamp: Date.now() - 5 * 86400000 });
      whereQuery.get.mockResolvedValue(
        createSnapshot([
          { id: old.id, data: () => old },
          { id: today.id, data: () => today },
        ]),
      );

      await expect(getTodaysMatch('user-1')).resolves.toEqual(today);
    });

    it('returns null when no today match exists', async () => {
      const old = createMatch({ id: 'old', timestamp: Date.now() - 5 * 86400000 });
      whereQuery.get.mockResolvedValue(createSnapshot([{ id: old.id, data: () => old }]));

      await expect(getTodaysMatch('user-1')).resolves.toBeNull();
    });

    it('returns false for hasPlayedToday when no today match', async () => {
      whereQuery.get.mockResolvedValue(createSnapshot([]));

      await expect(hasPlayedToday('user-1')).resolves.toBe(false);
    });

    it('returns false when getTodaysMatch throws', async () => {
      whereQuery.get.mockRejectedValue(new Error('db failed'));

      await expect(getTodaysMatch('user-1')).resolves.toBeNull();
    });
  });

  describe('hasMatchForDate and history', () => {
    it('finds a match for a specific calendar date', async () => {
      const target = new Date();
      target.setHours(14, 0, 0, 0);
      const sameDay = createMatch({ timestamp: target.getTime() });
      whereQuery.get.mockResolvedValue(createSnapshot([{ id: 'd1', data: () => sameDay }]));

      await expect(hasMatchForDate('user-1', target.getTime())).resolves.toBe(true);
    });

    it('returns false when no match for specific date exists', async () => {
      const target = new Date('2026-01-10T12:00:00.000Z').getTime();
      const other = createMatch({ timestamp: new Date('2026-01-08T12:00:00.000Z').getTime() });
      whereQuery.get.mockResolvedValue(createSnapshot([{ id: 'other', data: () => other }]));

      await expect(hasMatchForDate('user-1', target)).resolves.toBe(false);
    });

    it('returns sorted history by ascending timestamp', async () => {
      const m1 = createMatch({ id: 'b', timestamp: 200 });
      const m2 = createMatch({ id: 'a', timestamp: 100 });
      whereQuery.get.mockResolvedValue(
        createSnapshot([
          { id: m1.id, data: () => m1 },
          { id: m2.id, data: () => m2 },
        ]),
      );

      const result = await getMatchHistory('user-1');

      expect(result.map((m) => m.id)).toEqual(['a', 'b']);
    });

    it('returns [] on history error', async () => {
      whereQuery.get.mockRejectedValue(new Error('history failed'));

      await expect(getMatchHistory('user-1')).resolves.toEqual([]);
    });
  });

  describe('saveMatchBatch', () => {
    it('returns mismatch error when batch contains another user', async () => {
      const result = await saveMatchBatch('user-1', [createMatch({ userPlayed: 'user-2' })]);

      expect(result).toEqual({ success: false, error: 'User ID mismatch in batch' });
      expect(batchRef.commit).not.toHaveBeenCalled();
    });

    it('commits batch for valid matches', async () => {
      batchRef.commit.mockResolvedValue(undefined);

      const matches = [createMatch({ id: 'm1' }), createMatch({ id: 'm2' })];
      const result = await saveMatchBatch('user-1', matches);

      expect(batchRef.set).toHaveBeenCalledTimes(2);
      expect(batchRef.commit).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ success: true });
    });

    it('returns error when batch commit fails', async () => {
      batchRef.commit.mockRejectedValue(new Error('batch failed'));

      const result = await saveMatchBatch('user-1', [createMatch({ id: 'm1' })]);

      expect(result).toEqual({ success: false, error: 'batch failed' });
    });
  });

  describe('updateUserStatsFromMatch', () => {
    it('sets streak to 1 for first match', async () => {
      userDocRef.get.mockResolvedValue({ exists: false, data: () => ({}) });
      userDocRef.update.mockResolvedValue(undefined);

      const match = createMatch({ timestamp: Date.now(), score: 300 });
      await updateUserStatsFromMatch('user-1', match, 50);

      expect(incrementMock).toHaveBeenCalledWith(350);
      expect(userDocRef.update).toHaveBeenCalledWith(
        expect.objectContaining({
          dailyStreak: 1,
          bestStreak: 1,
          personalBestScore: 300,
          lastMatchTimestamp: match.timestamp,
        }),
      );
    });

    it('keeps same streak on same-day match', async () => {
      const now = Date.now();
      userDocRef.get.mockResolvedValue({
        exists: true,
        data: () => ({
          dailyStreak: 4,
          bestStreak: 5,
          personalBestScore: 250,
          lastMatchTimestamp: now - 1000,
        }),
      });
      userDocRef.update.mockResolvedValue(undefined);

      await updateUserStatsFromMatch('user-1', createMatch({ timestamp: now, score: 240 }), 0);

      expect(userDocRef.update).toHaveBeenCalledWith(
        expect.objectContaining({
          dailyStreak: 4,
          bestStreak: 5,
          personalBestScore: 250,
        }),
      );
    });

    it('increments streak for consecutive day', async () => {
      const yesterday = Date.now() - 86400000;
      const today = Date.now();
      userDocRef.get.mockResolvedValue({
        exists: true,
        data: () => ({
          dailyStreak: 2,
          bestStreak: 2,
          personalBestScore: 100,
          lastMatchTimestamp: yesterday,
        }),
      });
      userDocRef.update.mockResolvedValue(undefined);

      await updateUserStatsFromMatch('user-1', createMatch({ timestamp: today, score: 150 }), 0);

      expect(userDocRef.update).toHaveBeenCalledWith(
        expect.objectContaining({
          dailyStreak: 3,
          bestStreak: 3,
          personalBestScore: 150,
        }),
      );
    });

    it('resets streak for broken sequence', async () => {
      const fiveDaysAgo = Date.now() - 5 * 86400000;
      userDocRef.get.mockResolvedValue({
        exists: true,
        data: () => ({
          dailyStreak: 6,
          bestStreak: 7,
          personalBestScore: 500,
          lastMatchTimestamp: fiveDaysAgo,
        }),
      });
      userDocRef.update.mockResolvedValue(undefined);

      await updateUserStatsFromMatch('user-1', createMatch({ timestamp: Date.now(), score: 120 }), 0);

      expect(userDocRef.update).toHaveBeenCalledWith(
        expect.objectContaining({
          dailyStreak: 1,
          bestStreak: 7,
          personalBestScore: 500,
        }),
      );
    });

    it('rethrows when update fails', async () => {
      userDocRef.get.mockResolvedValue({ exists: false, data: () => ({}) });
      userDocRef.update.mockRejectedValue(new Error('update failed'));

      await expect(updateUserStatsFromMatch('user-1', createMatch(), 0)).rejects.toThrow(
        'update failed',
      );
    });
  });

  describe('deleteUserMatches', () => {
    it('returns true when there are no matches to delete', async () => {
      whereQuery.get.mockResolvedValue(createSnapshot([]));

      await expect(deleteUserMatches('user-1')).resolves.toBe(true);
    });

    it('batch deletes all user matches', async () => {
      batchRef.commit.mockResolvedValue(undefined);
      whereQuery.get.mockResolvedValue(
        createSnapshot([
          { id: '1', data: () => ({}), ref: { id: 'ref-1' } },
          { id: '2', data: () => ({}), ref: { id: 'ref-2' } },
        ]),
      );

      await expect(deleteUserMatches('user-1')).resolves.toBe(true);
      expect(batchRef.delete).toHaveBeenCalledTimes(2);
      expect(batchRef.commit).toHaveBeenCalledTimes(1);
    });

    it('returns false when delete process throws', async () => {
      whereQuery.get.mockRejectedValue(new Error('delete failed'));

      await expect(deleteUserMatches('user-1')).resolves.toBe(false);
    });
  });
});
