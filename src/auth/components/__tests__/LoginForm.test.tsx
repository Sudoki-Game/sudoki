import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import LoginForm from '../LoginForm';
import {
  mapFirebaseError,
  sendMagicLink,
  signInWithGoogle,
} from '@/auth/lib/firebase';

jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  useFormStatus: jest.fn(),
}));

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useActionState: jest.fn(),
}));

jest.mock('@/auth/lib/firebase', () => ({
  sendMagicLink: jest.fn(),
  signInWithGoogle: jest.fn(),
  mapFirebaseError: jest.fn(),
}));

describe('LoginForm', () => {
  let submitAction:
    | ((prevState: { success: boolean; error?: string }, formData: FormData) => Promise<{ success: boolean; error?: string }>)
    | null;

  beforeEach(() => {
    jest.clearAllMocks();
    submitAction = null;

    (useFormStatus as jest.Mock).mockReturnValue({ pending: false });
    (useActionState as jest.Mock).mockImplementation((action, initialState) => {
      submitAction = action;
      return [initialState, jest.fn()];
    });
    (mapFirebaseError as jest.Mock).mockReturnValue('Mapped auth error');
  });

  it('renders form fields and providers', () => {
    render(<LoginForm />);

    expect(screen.getByPlaceholderText('email@example.com')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Continue with Google' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Continue with GitHub' }),
    ).toBeDisabled();
    expect(screen.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute(
      'href',
      '/privacy',
    );
  });

  it('shows loading state on submit button while pending', () => {
    (useFormStatus as jest.Mock).mockReturnValue({ pending: true });

    render(<LoginForm />);

    expect(screen.getByRole('button', { name: 'Loading...' })).toBeDisabled();
  });

  it('returns validation error for invalid form submission', async () => {
    render(<LoginForm />);

    const formData = new FormData();
    formData.set('email', new File(['x'], 'x.txt'));

    await expect(submitAction!(
      { success: false },
      formData,
    )).resolves.toEqual({ success: false, error: 'Invalid form submission' });
  });

  it('returns validation error when email is blank after trimming', async () => {
    render(<LoginForm />);

    const formData = new FormData();
    formData.set('email', '   ');

    await expect(submitAction!(
      { success: false },
      formData,
    )).resolves.toEqual({
      success: false,
      error: 'Email and password are required',
    });
  });

  it('normalizes email and sends magic link successfully', async () => {
    (sendMagicLink as jest.Mock).mockResolvedValue(undefined);
    render(<LoginForm />);

    const formData = new FormData();
    formData.set('email', '  USER@EXAMPLE.COM  ');

    await expect(submitAction!({ success: false }, formData)).resolves.toEqual({
      success: true,
    });
    expect(sendMagicLink).toHaveBeenCalledWith('user@example.com');
  });

  it('maps and returns firebase error when sendMagicLink fails', async () => {
    const error = new Error('send failed');
    (sendMagicLink as jest.Mock).mockRejectedValue(error);
    (mapFirebaseError as jest.Mock).mockReturnValue('Unable to send link');

    render(<LoginForm />);

    const formData = new FormData();
    formData.set('email', 'person@example.com');

    await expect(submitAction!({ success: false }, formData)).resolves.toEqual({
      success: false,
      error: 'Unable to send link',
    });
    expect(mapFirebaseError).toHaveBeenCalledWith(error);
  });

  it('shows mapped Google auth error when popup flow fails', async () => {
    const googleError = new Error('popup blocked');
    (signInWithGoogle as jest.Mock).mockRejectedValue(googleError);
    (mapFirebaseError as jest.Mock).mockReturnValue('Google sign-in failed');

    render(<LoginForm />);
    fireEvent.click(screen.getByRole('button', { name: 'Continue with Google' }));

    await waitFor(() => {
      expect(screen.getByText('Google sign-in failed')).toBeInTheDocument();
    });
    expect(mapFirebaseError).toHaveBeenCalledWith(googleError);
  });
});
