import { cookies } from 'next/headers';
import { serverAuth } from '@/firebase/server';
import { getServerUser } from '../server';

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

jest.mock('@/firebase/server', () => ({
  serverAuth: {
    verifyIdToken: jest.fn(),
  },
}));

type MockCookieStore = {
  get: jest.Mock;
};

function createCookieStore(): MockCookieStore {
  return {
    get: jest.fn(),
  };
}

describe('auth/lib/server getServerUser', () => {
  let cookieStore: MockCookieStore;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    cookieStore = createCookieStore();
    (cookies as jest.Mock).mockResolvedValue(cookieStore);
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('returns null when session cookie is missing', async () => {
    cookieStore.get.mockReturnValue(undefined);

    const result = await getServerUser();

    expect(result).toBeNull();
    expect(serverAuth.verifyIdToken).not.toHaveBeenCalled();
  });

  it('returns null when session cookie has empty value', async () => {
    cookieStore.get.mockReturnValue({ value: '' });

    const result = await getServerUser();

    expect(result).toBeNull();
    expect(serverAuth.verifyIdToken).not.toHaveBeenCalled();
  });

  it('maps verified token into AuthUser shape', async () => {
    cookieStore.get.mockReturnValue({ value: 'session-token' });
    (serverAuth.verifyIdToken as jest.Mock).mockResolvedValue({
      uid: 'uid-1',
      email: 'user@sudoki.uk',
      email_verified: true,
      name: 'Dylan',
    });

    const result = await getServerUser();

    expect(serverAuth.verifyIdToken).toHaveBeenCalledWith('session-token');
    expect(result).toEqual({
      uid: 'uid-1',
      email: 'user@sudoki.uk',
      emailVerified: true,
      displayName: 'Dylan',
    });
  });

  it('falls back optional fields to null/false when token omits them', async () => {
    cookieStore.get.mockReturnValue({ value: 'session-token' });
    (serverAuth.verifyIdToken as jest.Mock).mockResolvedValue({
      uid: 'uid-2',
    });

    const result = await getServerUser();

    expect(result).toEqual({
      uid: 'uid-2',
      email: null,
      emailVerified: false,
      displayName: null,
    });
  });

  it('returns null and logs when token verification fails', async () => {
    cookieStore.get.mockReturnValue({ value: 'bad-token' });
    (serverAuth.verifyIdToken as jest.Mock).mockRejectedValue(
      new Error('invalid token'),
    );

    const result = await getServerUser();

    expect(result).toBeNull();
    expect(consoleSpy).toHaveBeenCalledWith(
      'Token verification failed:',
      expect.any(Error),
    );
  });
});
