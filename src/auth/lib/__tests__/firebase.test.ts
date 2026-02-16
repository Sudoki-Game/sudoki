import { FirebaseError } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  onAuthStateChanged as onAuthStateChangedBase,
  sendSignInLinkToEmail,
  GoogleAuthProvider,
} from 'firebase/auth';

const authSignOutMock = jest.fn();

jest.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: jest.fn(),
  signInWithPopup: jest.fn(),
  onAuthStateChanged: jest.fn(),
  sendSignInLinkToEmail: jest.fn(),
  GoogleAuthProvider: jest.fn(),
}));

jest.mock('../../../firebase/client', () => ({
  auth: {
    signOut: authSignOutMock,
  },
}));

function loadFirebaseLib() {
  return import('../firebase');
}

describe('auth/lib/firebase', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('subscribes to auth state changes and returns unsubscribe function', async () => {
    const unsubscribe = jest.fn();
    (onAuthStateChangedBase as jest.Mock).mockReturnValue(unsubscribe);

    const { onAuthStateChanged } = await loadFirebaseLib();
    const callback = jest.fn();
    const result = onAuthStateChanged(callback);

    expect(onAuthStateChangedBase).toHaveBeenCalledWith(
      expect.objectContaining({ signOut: authSignOutMock }),
      callback,
    );
    expect(result).toBe(unsubscribe);
  });

  it('creates user with email and password', async () => {
    const response = { user: { uid: 'u1' } };
    (createUserWithEmailAndPassword as jest.Mock).mockResolvedValue(response);

    const { signUpWithEmail } = await loadFirebaseLib();
    const result = await signUpWithEmail('test@sudoki.uk', 'secret');

    expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
      expect.objectContaining({ signOut: authSignOutMock }),
      'test@sudoki.uk',
      'secret',
    );
    expect(result).toBe(response);
  });

  it('sends magic link and stores email in localStorage', async () => {
    const { sendMagicLink } = await loadFirebaseLib();
    await sendMagicLink('dev@sudoki.uk');

    expect(sendSignInLinkToEmail).toHaveBeenCalledWith(
      expect.objectContaining({ signOut: authSignOutMock }),
      'dev@sudoki.uk',
      expect.objectContaining({
        handleCodeInApp: true,
      }),
    );
    expect(localStorage.getItem('emailForSignIn')).toBe('dev@sudoki.uk');
  });

  it('throws string message when sending magic link fails', async () => {
    (sendSignInLinkToEmail as jest.Mock).mockRejectedValue(
      new Error('mail service unavailable'),
    );

    const { sendMagicLink } = await loadFirebaseLib();

    await expect(sendMagicLink('broken@sudoki.uk')).rejects.toBe(
      'Failed to send magic link: mail service unavailable',
    );
  });

  it('signs in with Google provider and popup', async () => {
    const provider = { providerId: 'google.com' };
    (GoogleAuthProvider as unknown as jest.Mock).mockImplementation(
      () => provider,
    );
    (signInWithPopup as jest.Mock).mockResolvedValue({ user: { uid: 'u2' } });

    const { signInWithGoogle } = await loadFirebaseLib();
    await signInWithGoogle();

    expect(GoogleAuthProvider).toHaveBeenCalledTimes(1);
    expect(signInWithPopup).toHaveBeenCalledWith(
      expect.objectContaining({ signOut: authSignOutMock }),
      provider,
    );
  });

  it('signs out using firebase auth instance', async () => {
    authSignOutMock.mockResolvedValue('done');

    const { signOut } = await loadFirebaseLib();
    const result = await signOut();

    expect(authSignOutMock).toHaveBeenCalledTimes(1);
    expect(result).toBe('done');
  });

  it('logs and swallows signOut errors', async () => {
    authSignOutMock.mockImplementation(() => {
      throw new Error('cannot sign out');
    });
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    const { signOut } = await loadFirebaseLib();
    const result = await signOut();

    expect(result).toBeUndefined();
    expect(consoleSpy).toHaveBeenCalledWith(
      'Error signing out',
      expect.any(Error),
    );

    consoleSpy.mockRestore();
  });

  describe('mapFirebaseError', () => {
    it('maps known firebase auth error codes', async () => {
      const { mapFirebaseError } = await loadFirebaseLib();

      expect(
        mapFirebaseError(new FirebaseError('auth/wrong-password', 'wrong pwd')),
      ).toBe('Incorrect password');
      expect(
        mapFirebaseError(new FirebaseError('auth/email-already-in-use', 'dup')),
      ).toBe('An account with this email already exists');
      expect(
        mapFirebaseError(new FirebaseError('auth/network-request-failed', 'net')),
      ).toBe('Network error. Please check your connection');
    });

    it('returns fallback message for unknown firebase code', async () => {
      const { mapFirebaseError } = await loadFirebaseLib();

      expect(mapFirebaseError(new FirebaseError('auth/unknown', 'x'))).toBe(
        'Authentication failed',
      );
    });

    it('returns generic Error message for non-firebase errors', async () => {
      const { mapFirebaseError } = await loadFirebaseLib();

      expect(mapFirebaseError(new Error('plain error'))).toBe('plain error');
    });

    it('returns default message for non-error values', async () => {
      const { mapFirebaseError } = await loadFirebaseLib();

      expect(mapFirebaseError('bad')).toBe('Authentication failed');
    });
  });
});
