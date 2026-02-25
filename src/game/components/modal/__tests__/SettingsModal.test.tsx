import { fireEvent, render, screen } from '@testing-library/react';
import SettingsModal from '../SettingsModal';
import { useAuth } from '@/auth/context/AuthContext';
import { useModalRouter } from '@/game/context/ModalRouterContext';
import { useRouter } from 'next/navigation';
import { useDialog } from '@/ui/context/DialogContext';
import { auth } from '@/firebase/client';
import { deleteAccount } from '@/auth/lib/actionGateway';

jest.mock('@/auth/context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/game/context/ModalRouterContext', () => ({
  useModalRouter: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/ui/context/DialogContext', () => ({
  useDialog: jest.fn(),
}));

jest.mock('@/firebase/client', () => ({
  auth: {
    signOut: jest.fn(),
  },
}));

jest.mock('@/auth/lib/actionGateway', () => ({
  deleteAccount: jest.fn(),
}));

describe('SettingsModal', () => {
  const openModal = jest.fn();
  const closeModal = jest.fn();
  const goBack = jest.fn();
  const push = jest.fn();
  const showDialog = jest.fn();
  const hideDialog = jest.fn();
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    (useModalRouter as jest.Mock).mockReturnValue({
      openModal,
      closeModal,
      goBack,
    });
    (useRouter as jest.Mock).mockReturnValue({ push });
    (useDialog as jest.Mock).mockReturnValue({ showDialog, hideDialog });

    alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => undefined);
  });

  afterEach(() => {
    alertSpy.mockRestore();
  });

  it('shows sign in CTA when logged out', () => {
    (useAuth as jest.Mock).mockReturnValue({ isLoggedIn: false });

    render(<SettingsModal />);

    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));
    expect(push).toHaveBeenCalledWith('/login');
  });

  it('does not render auth buttons while auth state is unknown', () => {
    (useAuth as jest.Mock).mockReturnValue({ isLoggedIn: null });

    render(<SettingsModal />);

    expect(screen.queryByRole('button', { name: 'Sign In' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Sign Out' })).toBeNull();
  });

  it('opens bug report and how-to-play modals and handles go back', () => {
    (useAuth as jest.Mock).mockReturnValue({ isLoggedIn: false });

    render(<SettingsModal />);

    fireEvent.click(screen.getByRole('button', { name: 'Report a Bug' }));
    fireEvent.click(screen.getByRole('button', { name: 'How to Play' }));
    fireEvent.click(screen.getByRole('button', { name: 'Go Back' }));

    expect(openModal).toHaveBeenCalledWith('bug-report');
    expect(openModal).toHaveBeenCalledWith('how-to-play');
    expect(goBack).toHaveBeenCalledTimes(1);
  });

  it('shows sign-out dialog and runs confirm flow', async () => {
    (useAuth as jest.Mock).mockReturnValue({ isLoggedIn: true });
    (auth.signOut as jest.Mock).mockResolvedValue(undefined);

    render(<SettingsModal />);

    fireEvent.click(screen.getByRole('button', { name: 'Sign Out' }));

    const firstDialogCall = showDialog.mock.calls[0][0];
    await firstDialogCall.onConfirm();

    expect(auth.signOut).toHaveBeenCalledTimes(1);
    expect(showDialog).toHaveBeenCalledTimes(2);

    const successDialogCall = showDialog.mock.calls[1][0];
    successDialogCall.onConfirm();

    expect(closeModal).toHaveBeenCalledTimes(1);
  });

  it('handles delete account success path', async () => {
    (useAuth as jest.Mock).mockReturnValue({ isLoggedIn: true });
    (deleteAccount as jest.Mock).mockResolvedValue({ success: true });
    (auth.signOut as jest.Mock).mockResolvedValue(undefined);

    render(<SettingsModal />);

    fireEvent.click(screen.getByRole('button', { name: 'Delete Account' }));

    const firstDialogCall = showDialog.mock.calls[0][0];
    await firstDialogCall.onConfirm();

    expect(deleteAccount).toHaveBeenCalledTimes(1);
    expect(auth.signOut).toHaveBeenCalledTimes(1);

    const successDialogCall = showDialog.mock.calls[1][0];
    successDialogCall.onConfirm();

    expect(push).toHaveBeenCalledWith('/');
  });

  it('alerts when delete account fails', async () => {
    (useAuth as jest.Mock).mockReturnValue({ isLoggedIn: true });
    (deleteAccount as jest.Mock).mockResolvedValue({
      success: false,
      error: 'Delete failed',
    });

    render(<SettingsModal />);

    fireEvent.click(screen.getByRole('button', { name: 'Delete Account' }));

    const firstDialogCall = showDialog.mock.calls[0][0];
    await firstDialogCall.onConfirm();

    expect(alertSpy).toHaveBeenCalledWith('Delete failed');
  });
});
