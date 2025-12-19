'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { SessionResult } from '@/types';
import { mapFirebaseError, sendMagicLink, signInWithGoogle } from '@/lib/firebase/auth';
import Link from 'next/link';
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
      {pending ? 'Loading...' : 'Sign In'}
    </button>
  );
}

const LoginForm = () => {
  const [googleError, setGoogleError] = useState<string | null>();

  async function handleSubmit(
    _prevState: SessionResult,
    formData: FormData
  ): Promise<SessionResult> {
    setGoogleError(null);

    const rawEmail = formData.get('email');

    if (typeof rawEmail !== 'string') {
      return { success: false, error: 'Invalid form submission' };
    }

    const email = rawEmail.trim().toLowerCase();

    if (!email) {
      return { success: false, error: 'Email and password are required' };
    }

    try {
      await sendMagicLink(email);
    } catch (error) {
      return {
        success: false,
        error: mapFirebaseError(error)
      };
    }

    return { success: true };
  }

  async function handleGoogle() {
    setGoogleError(null);

    try {
      await signInWithGoogle();
    } catch (error) {
      setGoogleError(mapFirebaseError(error));
    }
  }

  const [state, formAction] = useActionState(handleSubmit, initialState);

  const errorMessage = state.error || googleError || null;

  return (
    <div className='auth-form__wrapper'>
      <h1 className='auth-form__heading'>Sign In</h1>

      <form className='form auth-form' action={formAction}>
        <input
          className='form__input'
          type='email'
          name='email'
          id='email'
          placeholder='Email'
          required
        />

        {errorMessage && <p className='form__message form__message--error'>{errorMessage}</p>}

        <SubmitButton />
      </form>

      <span style={{ fontSize: '1.25rem' }}>or</span>

      <button
        type='button'
        className='form__submit button button--fill button--lg'
        onClick={handleGoogle}
      >
        Continue with Google
      </button>
    </div>
  );
};

export default LoginForm;
