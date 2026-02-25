import type { ClientMatch } from '@/match/types';
import {
  uploadTodaysLocalMatch,
  uploadAllLocalMatches,
  uploadCachedMatches,
} from '../sync';
import {
  getCachedMatches,
  clearCacheFlags,
  getMatchHistory,
  clearMatchHistory,
  getTodaysMatch,
} from '../client';
import { clearUserData } from '@/user/lib/client';
import {
  hasMatchForDate,
  hasPlayedToday,
  saveMatch,
} from '@/match/lib/actionGateway';
import { getUserStats } from '@/user/lib/actionGateway';

jest.mock('../client', () => ({
  getCachedMatches: jest.fn(),
  clearCacheFlags: jest.fn(),
  getMatchHistory: jest.fn(),
  clearMatchHistory: jest.fn(),
  getTodaysMatch: jest.fn(),
}));

jest.mock('@/user/lib/client', () => ({
  clearUserData: jest.fn(),
}));

jest.mock('@/match/lib/actionGateway', () => ({
  hasMatchForDate: jest.fn(),
  hasPlayedToday: jest.fn(),
  saveMatch: jest.fn(),
}));

jest.mock('@/user/lib/actionGateway', () => ({
  getUserStats: jest.fn(),
}));

function createMatch(overrides: Partial<ClientMatch> = {}): ClientMatch {
  return {
    id: `m-${Date.now()}`,
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
    timestamp: Date.now(),
    ...overrides,
  };
}

describe('match/lib/sync runtime', () => {
  let consoleErrorSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    (getUserStats as jest.Mock).mockResolvedValue({ lastMatchTimestamp: null });
    (saveMatch as jest.Mock).mockResolvedValue({ success: true });

    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  describe('uploadTodaysLocalMatch', () => {
    it('skips when no local match exists for today', async () => {
      (getTodaysMatch as jest.Mock).mockResolvedValue(null);

      const result = await uploadTodaysLocalMatch('user-1');

      expect(result).toEqual({ success: true, uploaded: 0, skipped: 1, failed: 0 });
      expect(saveMatch).not.toHaveBeenCalled();
    });

    it('skips when server already has today match', async () => {
      (getTodaysMatch as jest.Mock).mockResolvedValue(createMatch({ id: 'today' }));
      (hasPlayedToday as jest.Mock).mockResolvedValue(true);

      const result = await uploadTodaysLocalMatch('user-1');

      expect(result).toEqual({ success: true, uploaded: 0, skipped: 1, failed: 0 });
      expect(saveMatch).not.toHaveBeenCalled();
    });

    it('uploads and clears local storage on success', async () => {
      (getTodaysMatch as jest.Mock).mockResolvedValue(createMatch({ id: 'today' }));
      (hasPlayedToday as jest.Mock).mockResolvedValue(false);
      (saveMatch as jest.Mock).mockResolvedValue({ success: true });

      const result = await uploadTodaysLocalMatch('user-1');

      expect(result).toEqual({ success: true, uploaded: 1, skipped: 0, failed: 0 });
      expect(clearMatchHistory).toHaveBeenCalledTimes(1);
      expect(clearUserData).toHaveBeenCalledTimes(1);
    });

    it('marks failed upload and does not clear local data', async () => {
      (getTodaysMatch as jest.Mock).mockResolvedValue(createMatch({ id: 'today' }));
      (hasPlayedToday as jest.Mock).mockResolvedValue(false);
      (saveMatch as jest.Mock).mockResolvedValue({ success: false, error: 'save failed' });

      const result = await uploadTodaysLocalMatch('user-1');

      expect(result).toEqual({ success: false, uploaded: 0, skipped: 0, failed: 1 });
      expect(clearMatchHistory).not.toHaveBeenCalled();
      expect(clearUserData).not.toHaveBeenCalled();
    });

    it('returns error result when unexpected exception occurs', async () => {
      (getTodaysMatch as jest.Mock).mockRejectedValue(new Error('boom'));

      const result = await uploadTodaysLocalMatch('user-1');

      expect(result).toEqual({
        success: false,
        uploaded: 0,
        skipped: 0,
        failed: 0,
        error: 'boom',
      });
    });
  });

  describe('uploadAllLocalMatches', () => {
    it('returns early when there are no local matches', async () => {
      (getMatchHistory as jest.Mock).mockResolvedValue([]);

      const result = await uploadAllLocalMatches('user-1');

      expect(result).toEqual({ success: true, uploaded: 0, skipped: 0, failed: 0 });
    });

    it('uploads all local matches and clears local storage on full success', async () => {
      const matches = [createMatch({ id: 'm1' }), createMatch({ id: 'm2' })];
      (getMatchHistory as jest.Mock).mockResolvedValue(matches);
      (hasMatchForDate as jest.Mock).mockResolvedValue(false);
      (saveMatch as jest.Mock).mockResolvedValue({ success: true });

      const result = await uploadAllLocalMatches('user-1');

      expect(result).toEqual({ success: true, uploaded: 2, skipped: 0, failed: 0 });
      expect(clearMatchHistory).toHaveBeenCalledTimes(1);
      expect(clearUserData).toHaveBeenCalledTimes(1);
    });

    it('skips duplicates and counts failed saves', async () => {
      const matches = [createMatch({ id: 'dup' }), createMatch({ id: 'bad' })];
      (getMatchHistory as jest.Mock).mockResolvedValue(matches);
      (hasMatchForDate as jest.Mock)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);
      (saveMatch as jest.Mock).mockResolvedValue({ success: false, error: 'nope' });

      const result = await uploadAllLocalMatches('user-1');

      expect(result).toEqual({ success: false, uploaded: 0, skipped: 1, failed: 1 });
      expect(clearMatchHistory).not.toHaveBeenCalled();
      expect(clearUserData).not.toHaveBeenCalled();
    });

    it('continues when per-match upload throws', async () => {
      const matches = [createMatch({ id: 'm1' })];
      (getMatchHistory as jest.Mock).mockResolvedValue(matches);
      (hasMatchForDate as jest.Mock).mockRejectedValue(new Error('date check failed'));

      const result = await uploadAllLocalMatches('user-1');

      expect(result).toEqual({ success: false, uploaded: 0, skipped: 0, failed: 1 });
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('returns top-level error when initial loading fails', async () => {
      (getMatchHistory as jest.Mock).mockRejectedValue(new Error('history failed'));

      const result = await uploadAllLocalMatches('user-1');

      expect(result).toEqual({
        success: false,
        uploaded: 0,
        skipped: 0,
        failed: 0,
        error: 'history failed',
      });
    });
  });

  describe('uploadCachedMatches', () => {
    it('returns early when no cached matches exist', async () => {
      (getCachedMatches as jest.Mock).mockResolvedValue([]);

      const result = await uploadCachedMatches('user-1');

      expect(result).toEqual({ success: true, uploaded: 0, skipped: 0, failed: 0 });
      expect(clearCacheFlags).not.toHaveBeenCalled();
    });

    it('uploads/skips and clears cache flags for successfully processed matches', async () => {
      const cached = [
        createMatch({ id: 'skip-me', timestamp: 1000 }),
        createMatch({ id: 'upload-me', timestamp: 2000 }),
      ];
      (getCachedMatches as jest.Mock).mockResolvedValue(cached);
      (hasMatchForDate as jest.Mock)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);
      (saveMatch as jest.Mock).mockResolvedValue({ success: true });

      const result = await uploadCachedMatches('user-1');

      expect(result).toEqual({ success: true, uploaded: 1, skipped: 1, failed: 0 });
      expect(clearCacheFlags).toHaveBeenCalledWith(['skip-me', 'upload-me']);
    });

    it('does not clear cache flag for failed uploads', async () => {
      const cached = [createMatch({ id: 'bad', timestamp: 1000 })];
      (getCachedMatches as jest.Mock).mockResolvedValue(cached);
      (hasMatchForDate as jest.Mock).mockResolvedValue(false);
      (saveMatch as jest.Mock).mockResolvedValue({ success: false, error: 'failed' });

      const result = await uploadCachedMatches('user-1');

      expect(result).toEqual({ success: false, uploaded: 0, skipped: 0, failed: 1 });
      expect(clearCacheFlags).not.toHaveBeenCalled();
    });

    it('counts failed uploads when per-match logic throws', async () => {
      const cached = [createMatch({ id: 'boom', timestamp: 1000 })];
      (getCachedMatches as jest.Mock).mockResolvedValue(cached);
      (hasMatchForDate as jest.Mock).mockRejectedValue(new Error('query broke'));

      const result = await uploadCachedMatches('user-1');

      expect(result).toEqual({ success: false, uploaded: 0, skipped: 0, failed: 1 });
    });

    it('returns top-level error when reading cache fails', async () => {
      (getCachedMatches as jest.Mock).mockRejectedValue(new Error('cache read failed'));

      const result = await uploadCachedMatches('user-1');

      expect(result).toEqual({
        success: false,
        uploaded: 0,
        skipped: 0,
        failed: 0,
        error: 'cache read failed',
      });
    });
  });
});
