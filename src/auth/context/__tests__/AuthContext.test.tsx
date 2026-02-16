import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import { createSession, removeSession } from '@/app/actions/auth';
import { getUserStats } from '@/app/actions/user';
import { onAuthStateChanged } from '@/auth/lib/firebase';
import { auth } from '@/firebase/client';

jest.mock('@/app/actions/auth', () => ({
  createSession: jest.fn(),
  removeSession: jest.fn(),
}));

jest.mock('@/app/actions/user', () => ({
  getUserStats: jest.fn(),
}));

jest.mock('@/auth/lib/firebase', () => ({
  onAuthStateChanged: jest.fn(),
}));

jest.mock('@/firebase/client', () => ({
  auth: { currentUser: null },
}));

describe('AuthContext', () => {
  type TestAuthUser = { uid: string; getIdToken: () => Promise<string> };
  let authStateCallback:
    | ((user: TestAuthUser | null) => Promise<void> | void)
    | null = null;
  let unsubscribeMock: jest.Mock;
  let lastUserData: unknown = null;

  beforeEach(() => {
    jest.clearAllMocks();
    unsubscribeMock = jest.fn();
    (onAuthStateChanged as jest.Mock).mockImplementation((cb) => {
      authStateCallback = cb;
      return unsubscribeMock;
    });
  });

  function AuthConsumer() {
    const { loading, isLoggedIn, getUserData } = useAuth();

    return (
      <div>
        <div data-testid='loading'>{String(loading)}</div>
        <div data-testid='logged-in'>{String(isLoggedIn)}</div>
        <button
          type='button'
          onClick={async () => {
            const result = await getUserData();
            lastUserData = result;
          }}
        >
          get-user-data
        </button>
      </div>
    );
  }

  it('throws when useAuth is used outside provider', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() => render(<AuthConsumer />)).toThrow(
      'useAuth must be used within an AuthProvider',
    );

    spy.mockRestore();
  });

  it('creates session when auth state resolves with a user', async () => {
    const getIdToken = jest.fn().mockResolvedValue('token-123');

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );

    expect(screen.getByTestId('loading')).toHaveTextContent('true');

    await act(async () => {
      await authStateCallback?.({ uid: 'uid-1', getIdToken });
    });

    await waitFor(() => {
      expect(createSession).toHaveBeenCalledWith('token-123');
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
      expect(screen.getByTestId('logged-in')).toHaveTextContent('true');
    });
  });

  it('removes session when auth state resolves without user', async () => {
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );

    await act(async () => {
      await authStateCallback?.(null);
    });

    await waitFor(() => {
      expect(removeSession).toHaveBeenCalled();
      expect(screen.getByTestId('logged-in')).toHaveTextContent('false');
    });
  });

  it('returns null from getUserData when no current user exists', async () => {
    (auth as { currentUser: { uid: string } | null }).currentUser = null;

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );

    await act(async () => {
      await authStateCallback?.(null);
    });

    await screen.findByText('get-user-data');
    fireEvent.click(screen.getByText('get-user-data'));

    await waitFor(() => {
      expect(lastUserData).toBeNull();
    });
    expect(getUserStats).not.toHaveBeenCalled();
  });

  it('fetches server stats from getUserData when current user exists', async () => {
    (auth as { currentUser: { uid: string } | null }).currentUser = {
      uid: 'uid-2',
    };
    (getUserStats as jest.Mock).mockResolvedValue({
      combinedScore: 10,
      dailyStreak: 2,
      bestStreak: 3,
      matchesPlayed: 4,
      personalBestScore: 5,
      lastMatchTimestamp: null,
    });

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );

    await act(async () => {
      await authStateCallback?.(null);
    });

    fireEvent.click(screen.getByText('get-user-data'));

    await waitFor(() => {
      expect(getUserStats).toHaveBeenCalledWith('uid-2');
      expect(lastUserData).toEqual(
        expect.objectContaining({ combinedScore: 10 }),
      );
    });
  });

  it('unsubscribes auth listener on unmount', () => {
    const { unmount } = render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );

    unmount();
    expect(unsubscribeMock).toHaveBeenCalledTimes(1);
  });
});
