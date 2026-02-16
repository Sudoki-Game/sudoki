import {
  getUserData,
  userExists,
  createUser,
  updateUser,
  updateDisplayName,
  checkOnboardingComplete,
  isDisplayNameTaken,
  getOrCreateUser,
  deleteUser,
  USERS_COLLECTION,
} from '../server';
import { serverDb } from '@/firebase/server';
import { deleteUserMatches } from '@/match/lib/server';

jest.mock('@/firebase/server', () => ({
  serverDb: {
    collection: jest.fn(),
  },
}));

jest.mock('@/match/lib/server', () => ({
  deleteUserMatches: jest.fn(),
}));

type MockUserDoc = {
  get: jest.Mock;
  set: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
};

type MockUsersQuery = {
  get: jest.Mock;
};

function createDocRef(overrides: Partial<MockUserDoc> = {}): MockUserDoc {
  return {
    get: jest.fn(),
    set: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    ...overrides,
  };
}

describe('user/lib/server', () => {
  let usersDocRef: MockUserDoc;
  let usersQueryRef: MockUsersQuery;
  let matchesDocRef: MockUserDoc;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    usersDocRef = createDocRef();
    usersQueryRef = { get: jest.fn() };
    matchesDocRef = createDocRef();

    (serverDb.collection as jest.Mock).mockImplementation((name: string) => {
      if (name === USERS_COLLECTION) {
        return {
          doc: jest.fn(() => usersDocRef),
          where: jest.fn(() => usersQueryRef),
        };
      }

      return {
        doc: jest.fn(() => matchesDocRef),
      };
    });

    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('getUserData', () => {
    it('returns null when user document does not exist', async () => {
      usersDocRef.get.mockResolvedValue({ exists: false });

      const result = await getUserData('uid-1');

      expect(result).toBeNull();
    });

    it('returns user data when user exists', async () => {
      const data = { uid: 'uid-2', displayName: 'Dylan' };
      usersDocRef.get.mockResolvedValue({
        exists: true,
        data: () => data,
      });

      const result = await getUserData('uid-2');

      expect(result).toEqual(data);
    });

    it('returns null and logs when firestore read fails', async () => {
      usersDocRef.get.mockRejectedValue(new Error('read failed'));

      const result = await getUserData('uid-3');

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        '[UserServer] Error getting user data:',
        expect.any(Error),
      );
    });
  });

  describe('userExists', () => {
    it('returns true or false from snapshot existence', async () => {
      usersDocRef.get
        .mockResolvedValueOnce({ exists: true })
        .mockResolvedValueOnce({ exists: false });

      await expect(userExists('uid-a')).resolves.toBe(true);
      await expect(userExists('uid-b')).resolves.toBe(false);
    });

    it('returns false and logs on error', async () => {
      usersDocRef.get.mockRejectedValue(new Error('exists check failed'));

      await expect(userExists('uid-c')).resolves.toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        '[UserServer] Error checking user existence:',
        expect.any(Error),
      );
    });
  });

  describe('createUser', () => {
    it('creates initial user data and persists it', async () => {
      const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(123456);

      const result = await createUser('uid-1', 'user@sudoki.uk', 'Player');

      expect(usersDocRef.set).toHaveBeenCalledWith(
        expect.objectContaining({
          uid: 'uid-1',
          email: 'user@sudoki.uk',
          displayName: 'Player',
          createdAt: 123456,
          lastActive: 123456,
        }),
      );
      expect(result.uid).toBe('uid-1');
      nowSpy.mockRestore();
    });
  });

  describe('updateUser and updateDisplayName', () => {
    it('updates user payload and refreshes lastActive', async () => {
      const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(1111);

      await expect(updateUser('uid-1', { combinedScore: 42 })).resolves.toBe(true);

      expect(usersDocRef.update).toHaveBeenCalledWith({
        combinedScore: 42,
        lastActive: 1111,
      });

      nowSpy.mockRestore();
    });

    it('returns false and logs when update fails', async () => {
      usersDocRef.update.mockRejectedValue(new Error('update failed'));

      await expect(updateUser('uid-1', { combinedScore: 1 })).resolves.toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        '[UserServer] Error updating user:',
        expect.any(Error),
      );
    });

    it('trim display name and delegates to updateUser', async () => {
      usersDocRef.update.mockResolvedValue(undefined);

      await expect(updateDisplayName('uid-3', '  New Name  ')).resolves.toBe(true);

      expect(usersDocRef.update).toHaveBeenCalledWith(
        expect.objectContaining({
          displayName: 'New Name',
        }),
      );
    });
  });

  describe('checkOnboardingComplete', () => {
    it('returns false when user does not exist', async () => {
      usersDocRef.get.mockResolvedValue({ exists: false });

      await expect(checkOnboardingComplete('uid-1')).resolves.toBe(false);
    });

    it('returns false when display name is blank', async () => {
      usersDocRef.get.mockResolvedValue({
        exists: true,
        data: () => ({ displayName: '   ' }),
      });

      await expect(checkOnboardingComplete('uid-1')).resolves.toBe(false);
    });

    it('returns true when display name is present', async () => {
      usersDocRef.get.mockResolvedValue({
        exists: true,
        data: () => ({ displayName: 'Player One' }),
      });

      await expect(checkOnboardingComplete('uid-1')).resolves.toBe(true);
    });
  });

  describe('isDisplayNameTaken', () => {
    it('returns false when no results are returned', async () => {
      usersQueryRef.get.mockResolvedValue({ empty: true, docs: [] });

      await expect(isDisplayNameTaken('Name')).resolves.toBe(false);
    });

    it('returns true when there are results and no exclusion', async () => {
      usersQueryRef.get.mockResolvedValue({
        empty: false,
        docs: [{ id: 'uid-1' }],
      });

      await expect(isDisplayNameTaken('Name')).resolves.toBe(true);
    });

    it('returns false when only excluded user is found', async () => {
      usersQueryRef.get.mockResolvedValue({
        empty: false,
        docs: [{ id: 'uid-1' }],
      });

      await expect(isDisplayNameTaken('Name', 'uid-1')).resolves.toBe(false);
    });

    it('returns true when another user also matches', async () => {
      usersQueryRef.get.mockResolvedValue({
        empty: false,
        docs: [{ id: 'uid-1' }, { id: 'uid-2' }],
      });

      await expect(isDisplayNameTaken('Name', 'uid-1')).resolves.toBe(true);
    });

    it('returns false and logs on query error', async () => {
      usersQueryRef.get.mockRejectedValue(new Error('query failed'));

      await expect(isDisplayNameTaken('Name')).resolves.toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        '[UserServer] Error checking display name:',
        expect.any(Error),
      );
    });
  });

  describe('getOrCreateUser', () => {
    it('returns existing user and updates lastActive', async () => {
      usersDocRef.get.mockResolvedValue({
        exists: true,
        data: () => ({ uid: 'uid-9', displayName: 'Exists' }),
      });
      usersDocRef.update.mockResolvedValue(undefined);

      const result = await getOrCreateUser('uid-9', 'existing@sudoki.uk');

      expect(result).toEqual({ uid: 'uid-9', displayName: 'Exists' });
      expect(usersDocRef.update).toHaveBeenCalledWith(
        expect.objectContaining({ lastActive: expect.any(Number) }),
      );
      expect(usersDocRef.set).not.toHaveBeenCalled();
    });

    it('creates user when one does not exist', async () => {
      const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(9999);
      usersDocRef.get.mockResolvedValue({ exists: false });

      const result = await getOrCreateUser('uid-10', 'new@sudoki.uk');

      expect(usersDocRef.set).toHaveBeenCalledTimes(1);
      expect(result).toEqual(
        expect.objectContaining({ uid: 'uid-10', email: 'new@sudoki.uk' }),
      );
      nowSpy.mockRestore();
    });
  });

  describe('deleteUser', () => {
    it('returns false when deleting user matches fails', async () => {
      (deleteUserMatches as jest.Mock).mockResolvedValue(false);

      await expect(deleteUser('uid-1')).resolves.toBe(false);
      expect(usersDocRef.delete).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        '[UserServer] Failed to delete user matches',
      );
    });

    it('deletes user document after matches are deleted', async () => {
      (deleteUserMatches as jest.Mock).mockResolvedValue(true);
      usersDocRef.delete.mockResolvedValue(undefined);

      await expect(deleteUser('uid-2')).resolves.toBe(true);
      expect(deleteUserMatches).toHaveBeenCalledWith('uid-2');
      expect(usersDocRef.delete).toHaveBeenCalledTimes(1);
    });

    it('returns false and logs when deletion throws', async () => {
      (deleteUserMatches as jest.Mock).mockResolvedValue(true);
      usersDocRef.delete.mockRejectedValue(new Error('delete failed'));

      await expect(deleteUser('uid-3')).resolves.toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        '[UserServer] Error deleting user:',
        expect.any(Error),
      );
    });
  });
});
