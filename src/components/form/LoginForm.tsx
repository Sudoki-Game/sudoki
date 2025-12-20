'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { SessionResult } from '@/types';
import { mapFirebaseError, sendMagicLink, signInWithGoogle } from '@/lib/firebase/auth';
import styles from './LoginForm.module.css';
import Button from '../ui/Button';
import Form from '../ui/Form';
import Input from '../ui/Input';

const initialState: SessionResult = {
  success: false,
  uid: undefined,
  error: undefined
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type='submit' disabled={pending} variant='warning' fill size='lg'>
      {pending ? 'Loading...' : 'Sign In'}
    </Button>
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
    <div className={styles.wrapper}>
      <h1>Sign In</h1>

      <Form action={formAction}>
        <Input type='email' name='email' id='email' placeholder='Email' required />

        {errorMessage && <p>{errorMessage}</p>}

        <SubmitButton />
      </Form>

      <span style={{ fontSize: '1.25rem' }}>- or -</span>

      <Button type='button' fill size='lg' onClick={handleGoogle}>
        Continue with Google
      </Button>
    </div>
  );
};

export default LoginForm;
