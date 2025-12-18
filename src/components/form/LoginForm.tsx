'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { FirebaseError } from 'firebase/app';
import { SessionResult } from '@/types';
import { signInWithEmail, signInWithGoogle } from '@/lib/firebase/auth';
import './AuthForm.css';

const initialState: SessionResult = {
  success: false,
  uid: undefined,
  error: undefined
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type='submit'
      disabled={pending}
      className='form__submit button button--fill button--lg button--warning'
    >
      {pending ? 'Loading...' : 'Continue'}
    </button>
  );
}

/**
 * Centralized Firebase error mapping
 */
function mapFirebaseError(error: unknown): string {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
        return 'Incorrect password';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists';
      case 'auth/invalid-email':
        return 'Invalid email address';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please try again later';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection';
      default:
        return 'Authentication failed';
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Authentication failed';
}

const LoginForm = () => {
  async function handleSubmit(
    _prevState: SessionResult,
    formData: FormData
  ): Promise<SessionResult> {
    const rawEmail = formData.get('email');
    const rawPassword = formData.get('password');

    if (typeof rawEmail !== 'string' || typeof rawPassword !== 'string') {
      return { success: false, error: 'Invalid form submission' };
    }

    const email = rawEmail.trim().toLowerCase();
    const password = rawPassword;

    if (!email || !password) {
      return { success: false, error: 'Email and password are required' };
    }

    if (password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters' };
    }

    try {
      await signInWithEmail(email, password);
    } catch (error) {
      return {
        success: false,
        error: mapFirebaseError(error)
      };
    }

    return { success: true };
  }

  const [state, formAction] = useActionState(handleSubmit, initialState);

  return (
    <div className='auth-form__wrapper'>
      <h1>Sign In</h1>

      <form className='form' action={formAction}>
        <div className='form__field'>
          <label className='form__label' htmlFor='email'>
            Email
          </label>
          <input
            className='form__input'
            type='email'
            name='email'
            id='email'
            placeholder='Email'
            required
          />
        </div>

        <div className='form__field'>
          <label className='form__label' htmlFor='password'>
            Password
          </label>
          <input
            className='form__input'
            type='password'
            name='password'
            id='password'
            placeholder='Password'
            required
            minLength={6}
          />
        </div>

        {state.error && <p className='form__message form__message--error'>{state.error}</p>}

        <SubmitButton />
      </form>

      <span style={{ fontSize: '1.5rem' }}>or</span>

      <button
        type='submit'
        className='form__submit button button--fill button--lg'
        onClick={signInWithGoogle}
      >
        Sign in with Google
      </button>
    </div>
  );
};

export default LoginForm;
