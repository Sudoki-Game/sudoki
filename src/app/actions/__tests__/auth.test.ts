import { cookies } from 'next/headers';
import { serverAuth } from '@/firebase/server';
import {
  userExists,
  createUser,
  updateDisplayName,
  isDisplayNameTaken,
  checkOnboardingComplete,
  deleteUser,
} from '@/user/lib/server';
import {
  createSession,
  removeSession,
  getSession,
  completeOnboarding,
  checkUserOnboarding,
  deleteAccount,
} from '../auth';

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

jest.mock('@/firebase/server', () => ({
  serverAuth: {
    verifyIdToken: jest.fn(),
    deleteUser: jest.fn(),
  },
}));

jest.mock('@/user/lib/server', () => ({
  userExists: jest.fn(),
  createUser: jest.fn(),
  updateDisplayName: jest.fn(),
  isDisplayNameTaken: jest.fn(),
  checkOnboardingComplete: jest.fn(),
  deleteUser: jest.fn(),
}));

type MockCookieStore = {
  set: jest.Mock;
  get: jest.Mock;
  delete: jest.Mock;
};

function createCookieStore(): MockCookieStore {
  return {
    set: jest.fn(),
    get: jest.fn(),
    delete: jest.fn(),
  };
}

describe('auth server actions', () => {
  let cookieStore: MockCookieStore;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    cookieStore = createCookieStore();
    (cookies as jest.Mock).mockResolvedValue(cookieStore);
    consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('createSession', () => {
    it('creates a session and user when first login', async () => {
      (serverAuth.verifyIdToken as jest.Mock).mockResolvedValue({
        uid: 'user-1',
        email: 'user@example.com',
      });
      (userExists as jest.Mock).mockResolvedValue(false);

      const result = await createSession('token-1');

      expect(result).toEqual({ success: true, uid: 'user-1', isNewUser: true });
      expect(createUser).toHaveBeenCalledWith('user-1', 'user@example.com');
      expect(cookieStore.set).toHaveBeenCalledWith(
        'session',
        'token-1',
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 5,
          path: '/',
        }),
      );
    });

    it('creates a session without creating user when user exists', async () => {
      (serverAuth.verifyIdToken as jest.Mock).mockResolvedValue({
        uid: 'user-2',
        email: null,
      });
      (userExists as jest.Mock).mockResolvedValue(true);

      const result = await createSession('token-2');

      expect(result).toEqual({ success: true, uid: 'user-2', isNewUser: false });
      expect(createUser).not.toHaveBeenCalled();
      expect(cookieStore.set).toHaveBeenCalledTimes(1);
    });

    it('returns error when token verification fails', async () => {
      (serverAuth.verifyIdToken as jest.Mock).mockRejectedValue(
        new Error('invalid token'),
      );

      const result = await createSession('bad-token');

      expect(result).toEqual({ success: false, error: 'invalid token' });
      expect(cookieStore.set).not.toHaveBeenCalled();
    });
  });

  describe('session cookie helpers', () => {
    it('removeSession deletes session cookie', async () => {
      await removeSession();
      expect(cookieStore.delete).toHaveBeenCalledWith('session');
    });

    it('getSession returns current session value', async () => {
      cookieStore.get.mockReturnValue({ value: 'session-token' });
      const session = await getSession();
      expect(session).toBe('session-token');
    });

    it('getSession returns undefined when cookie missing', async () => {
      cookieStore.get.mockReturnValue(undefined);
      const session = await getSession();
      expect(session).toBeUndefined();
    });
  });

  describe('completeOnboarding', () => {
    const baseState = { success: false };

    function buildFormData(displayName: unknown): FormData {
      const formData = new FormData();
      if (displayName !== undefined) {
        formData.set('displayName', displayName as string);
      }
      return formData;
    }

    it('rejects invalid displayName payload', async () => {
      const result = await completeOnboarding(baseState, buildFormData(undefined));
      expect(result).toEqual({
        success: false,
        error: 'Invalid form submission',
      });
    });

    it('validates empty, short and long display names', async () => {
      const empty = await completeOnboarding(baseState, buildFormData('   '));
      const short = await completeOnboarding(baseState, buildFormData('a'));
      const long = await completeOnboarding(
        baseState,
        buildFormData('a'.repeat(31)),
      );

      expect(empty.error).toBe('Display name cannot be empty');
      expect(short.error).toBe('Display name must be at least 2 characters');
      expect(long.error).toBe('Display name cannot exceed 30 characters');
    });

    it('returns error when display name is already taken', async () => {
      (isDisplayNameTaken as jest.Mock).mockResolvedValue(true);

      const result = await completeOnboarding(baseState, buildFormData('TakenName'));

      expect(result).toEqual({
        success: false,
        error: 'This display name is already taken',
      });
    });

    it('returns error when user is not authenticated', async () => {
      (isDisplayNameTaken as jest.Mock).mockResolvedValue(false);
      cookieStore.get.mockReturnValue(undefined);

      const result = await completeOnboarding(baseState, buildFormData('Dylan'));

      expect(result).toEqual({ success: false, error: 'User not authenticated' });
    });

    it('updates display name for authenticated user', async () => {
      (isDisplayNameTaken as jest.Mock).mockResolvedValue(false);
      cookieStore.get.mockReturnValue({ value: 'session-token' });
      (serverAuth.verifyIdToken as jest.Mock).mockResolvedValue({ uid: 'uid-1' });

      const result = await completeOnboarding(baseState, buildFormData('  Dylan  '));

      expect(result).toEqual({ success: true });
      expect(updateDisplayName).toHaveBeenCalledWith('uid-1', 'Dylan');
    });

    it('returns caught error from downstream dependencies', async () => {
      (isDisplayNameTaken as jest.Mock).mockRejectedValue(new Error('db failure'));

      const result = await completeOnboarding(baseState, buildFormData('ValidName'));

      expect(result).toEqual({ success: false, error: 'db failure' });
    });
  });

  describe('checkUserOnboarding', () => {
    it('returns false when no session exists', async () => {
      cookieStore.get.mockReturnValue(undefined);

      const result = await checkUserOnboarding();

      expect(result).toEqual({ hasCompleted: false });
    });

    it('returns completion state for authenticated user', async () => {
      cookieStore.get.mockReturnValue({ value: 'session-token' });
      (serverAuth.verifyIdToken as jest.Mock).mockResolvedValue({ uid: 'uid-2' });
      (checkOnboardingComplete as jest.Mock).mockResolvedValue(true);

      const result = await checkUserOnboarding();

      expect(result).toEqual({ hasCompleted: true, uid: 'uid-2' });
    });

    it('handles errors by returning hasCompleted false', async () => {
      cookieStore.get.mockReturnValue({ value: 'session-token' });
      (serverAuth.verifyIdToken as jest.Mock).mockRejectedValue(
        new Error('token decode failure'),
      );

      const result = await checkUserOnboarding();

      expect(result).toEqual({ hasCompleted: false });
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error checking user onboarding:',
        expect.any(Error),
      );
    });
  });

  describe('deleteAccount', () => {
    it('returns error when user is not authenticated', async () => {
      cookieStore.get.mockReturnValue(undefined);

      const result = await deleteAccount();

      expect(result).toEqual({ success: false, error: 'User not authenticated' });
    });

    it('returns error when Firestore deletion fails', async () => {
      cookieStore.get.mockReturnValue({ value: 'session-token' });
      (serverAuth.verifyIdToken as jest.Mock).mockResolvedValue({ uid: 'uid-3' });
      (deleteUser as jest.Mock).mockResolvedValue(false);

      const result = await deleteAccount();

      expect(result).toEqual({ success: false, error: 'Failed to delete user data' });
      expect(serverAuth.deleteUser).not.toHaveBeenCalled();
    });

    it('deletes firestore/auth user and clears session on success', async () => {
      cookieStore.get.mockReturnValue({ value: 'session-token' });
      (serverAuth.verifyIdToken as jest.Mock).mockResolvedValue({ uid: 'uid-4' });
      (deleteUser as jest.Mock).mockResolvedValue(true);
      (serverAuth.deleteUser as jest.Mock).mockResolvedValue(undefined);

      const result = await deleteAccount();

      expect(result).toEqual({ success: true });
      expect(deleteUser).toHaveBeenCalledWith('uid-4');
      expect(serverAuth.deleteUser).toHaveBeenCalledWith('uid-4');
      expect(cookieStore.delete).toHaveBeenCalledWith('session');
    });

    it('returns caught error from account deletion', async () => {
      cookieStore.get.mockReturnValue({ value: 'session-token' });
      (serverAuth.verifyIdToken as jest.Mock).mockRejectedValue(
        new Error('verify failed'),
      );

      const result = await deleteAccount();

      expect(result).toEqual({ success: false, error: 'verify failed' });
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error deleting account:',
        expect.any(Error),
      );
    });
  });
});
