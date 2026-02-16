import {
  doc,
  getDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  setDoc,
} from 'firebase/firestore';
import {
  getServerUserData,
  userExists,
  createUserEntry,
  updateUserDisplayName,
  hasUserCompletedOnboarding,
  isDisplayNameTaken,
  getUserMatches,
} from '../firestore';

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  getDocs: jest.fn(),
  setDoc: jest.fn(),
}));

jest.mock('../client', () => ({
  db: { id: 'mock-db' },
}));

describe('firebase/firestore helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (doc as jest.Mock).mockImplementation((_db, ...segments: string[]) => ({
      path: segments.join('/'),
    }));
    (collection as jest.Mock).mockImplementation((_db, segment: string) => ({
      path: segment,
    }));
    (where as jest.Mock).mockImplementation((field: string, op: string, value: unknown) => ({
      type: 'where',
      field,
      op,
      value,
    }));
    (orderBy as jest.Mock).mockImplementation((field: string, direction: string) => ({
      type: 'orderBy',
      field,
      direction,
    }));
    (limit as jest.Mock).mockImplementation((count: number) => ({
      type: 'limit',
      count,
    }));
    (query as jest.Mock).mockImplementation((...constraints: unknown[]) => constraints);
  });

  describe('getServerUserData', () => {
    it('returns null when user doc does not exist', async () => {
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => false,
      });

      const result = await getServerUserData('user-1');

      expect(result).toBeNull();
    });

    it('returns user data when user doc exists', async () => {
      const userData = {
        uid: 'user-2',
        displayName: 'Dylan',
        email: 'user@sudoki.uk',
      };
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => userData,
      });

      const result = await getServerUserData('user-2');

      expect(result).toEqual(userData);
      expect(doc).toHaveBeenCalledWith(expect.any(Object), 'users', 'user-2');
    });
  });

  it('userExists mirrors snapshot existence', async () => {
    (getDoc as jest.Mock)
      .mockResolvedValueOnce({ exists: () => true })
      .mockResolvedValueOnce({ exists: () => false });

    await expect(userExists('a')).resolves.toBe(true);
    await expect(userExists('b')).resolves.toBe(false);
  });

  it('createUserEntry writes default user document with timestamps', async () => {
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(12345);

    await createUserEntry('uid-1', 'user@sudoki.uk');

    expect(setDoc).toHaveBeenCalledWith(
      { path: 'users/uid-1' },
      expect.objectContaining({
        uid: 'uid-1',
        email: 'user@sudoki.uk',
        displayName: '',
        isActive: true,
        createdAt: 12345,
        lastActive: 12345,
        combinedScore: 0,
      }),
    );

    nowSpy.mockRestore();
  });

  it('updateUserDisplayName merges displayName update', async () => {
    await updateUserDisplayName('uid-2', 'NewName');

    expect(setDoc).toHaveBeenCalledWith(
      { path: 'users/uid-2' },
      { displayName: 'NewName' },
      { merge: true },
    );
  });

  describe('hasUserCompletedOnboarding', () => {
    it('returns false when user not found', async () => {
      (getDoc as jest.Mock).mockResolvedValue({ exists: () => false });

      await expect(hasUserCompletedOnboarding('uid-1')).resolves.toBe(false);
    });

    it('returns false for blank displayName', async () => {
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({ displayName: '   ' }),
      });

      await expect(hasUserCompletedOnboarding('uid-1')).resolves.toBe(false);
    });

    it('returns true for non-empty displayName', async () => {
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({ displayName: 'Player' }),
      });

      await expect(hasUserCompletedOnboarding('uid-1')).resolves.toBe(true);
    });
  });

  describe('isDisplayNameTaken', () => {
    it('returns false when query has no matches', async () => {
      (getDocs as jest.Mock).mockResolvedValue({ empty: true, docs: [] });

      await expect(isDisplayNameTaken('Dylan')).resolves.toBe(false);
    });

    it('returns true when query has matches and no exclude user', async () => {
      (getDocs as jest.Mock).mockResolvedValue({
        empty: false,
        docs: [{ id: 'uid-1' }],
      });

      await expect(isDisplayNameTaken('Dylan')).resolves.toBe(true);
    });

    it('returns false when only excluded user matches', async () => {
      (getDocs as jest.Mock).mockResolvedValue({
        empty: false,
        docs: [{ id: 'uid-1' }],
      });

      await expect(isDisplayNameTaken('Dylan', 'uid-1')).resolves.toBe(false);
    });

    it('returns true when another user matches excluding self', async () => {
      (getDocs as jest.Mock).mockResolvedValue({
        empty: false,
        docs: [{ id: 'uid-1' }, { id: 'uid-2' }],
      });

      await expect(isDisplayNameTaken('Dylan', 'uid-1')).resolves.toBe(true);
    });
  });

  it('getUserMatches builds query and maps docs to match data', async () => {
    (getDocs as jest.Mock).mockResolvedValue({
      docs: [
        { data: () => ({ id: 'm1', userPlayed: 'uid-1' }) },
        { data: () => ({ id: 'm2', userPlayed: 'uid-1' }) },
      ],
    });

    const result = await getUserMatches('uid-1', 5);

    expect(query).toHaveBeenCalledWith(
      { path: 'matches' },
      { type: 'where', field: 'userPlayed', op: '==', value: 'uid-1' },
      { type: 'orderBy', field: 'timestamp', direction: 'desc' },
      { type: 'limit', count: 5 },
    );
    expect(result).toEqual([
      { id: 'm1', userPlayed: 'uid-1' },
      { id: 'm2', userPlayed: 'uid-1' },
    ]);
  });
});
