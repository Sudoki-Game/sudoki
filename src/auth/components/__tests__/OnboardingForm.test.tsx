import { render, screen, waitFor } from '@testing-library/react';
import { useActionState, useEffect } from 'react';
import OnboardingForm from '../OnboardingForm';
import { useRouter } from 'next/navigation';
import { uploadAllLocalMatches } from '@/match/lib/sync';
import { getAuth } from 'firebase/auth';

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useActionState: jest.fn(),
  useEffect: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/match/lib/sync', () => ({
  uploadAllLocalMatches: jest.fn(),
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
}));

jest.mock('@/app/actions/auth', () => ({
  completeOnboarding: jest.fn(),
}));

describe('OnboardingForm', () => {
  const replaceMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    (useRouter as jest.Mock).mockReturnValue({ replace: replaceMock });
    (useEffect as jest.Mock).mockImplementation((effect: () => void) => {
      effect();
    });
    (useActionState as jest.Mock).mockReturnValue([
      { success: false, error: undefined },
      jest.fn(),
    ]);
    (getAuth as jest.Mock).mockReturnValue({ currentUser: null });
    (uploadAllLocalMatches as jest.Mock).mockResolvedValue({
      uploaded: 0,
      failed: 0,
    });
  });

  it('renders onboarding input and helper text', () => {
    render(<OnboardingForm />);

    expect(screen.getByPlaceholderText('Enter your display name')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start Playing!' })).toBeInTheDocument();
    expect(
      screen.getByText('You can change this later in your settings.'),
    ).toBeInTheDocument();
  });

  it('renders action error when onboarding state has an error', () => {
    (useActionState as jest.Mock).mockReturnValue([
      { success: false, error: 'Display name already taken' },
      jest.fn(),
    ]);

    render(<OnboardingForm />);

    expect(screen.getByText('Display name already taken')).toBeInTheDocument();
  });

  it('redirects and warns when no authenticated user is available for sync', async () => {
    (useActionState as jest.Mock).mockReturnValue([
      { success: true, error: undefined },
      jest.fn(),
    ]);
    (getAuth as jest.Mock).mockReturnValue({ currentUser: null });

    render(<OnboardingForm />);

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/');
    });
    expect(uploadAllLocalMatches).not.toHaveBeenCalled();
  });

  it('uploads local matches and logs outcomes on successful onboarding', async () => {
    (useActionState as jest.Mock).mockReturnValue([
      { success: true, error: undefined },
      jest.fn(),
    ]);
    (getAuth as jest.Mock).mockReturnValue({ currentUser: { uid: 'user-1' } });
    (uploadAllLocalMatches as jest.Mock).mockResolvedValue({ uploaded: 2, failed: 1 });

    render(<OnboardingForm />);

    await waitFor(() => {
      expect(uploadAllLocalMatches).toHaveBeenCalledWith('user-1');
    });
  });

  it('warns when onboarding sync throws', async () => {
    const syncError = new Error('network error');

    (useActionState as jest.Mock).mockReturnValue([
      { success: true, error: undefined },
      jest.fn(),
    ]);
    (getAuth as jest.Mock).mockReturnValue({ currentUser: { uid: 'user-2' } });
    (uploadAllLocalMatches as jest.Mock).mockRejectedValue(syncError);

    render(<OnboardingForm />);

    await waitFor(() => {
      expect(uploadAllLocalMatches).toHaveBeenCalledWith('user-2');
    });
  });
});
