'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { SessionResult } from '@/types';
import {
  mapFirebaseError,
  sendMagicLink,
  signInWithGoogle,
} from '@/lib/firebase/auth';
import styles from './LoginForm.module.css';
import Button from '@/ui/components/Button';
import Form from '@/ui/components/Form';
import Input from '@/ui/components/Input';
import Link from 'next/link';

const initialState: SessionResult = {
  success: false,
  uid: undefined,
  error: undefined,
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type='submit' disabled={pending} variant='ok' fill size='lg'>
      {pending ? 'Loading...' : 'Continue'}
    </Button>
  );
}

const LoginForm = () => {
  const [googleError, setGoogleError] = useState<string | null>();

  async function handleSubmit(
    _prevState: SessionResult,
    formData: FormData,
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
        error: mapFirebaseError(error),
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
      <Form action={formAction}>
        <Input
          type='email'
          name='email'
          id='email'
          placeholder='email@example.com'
          required
        />

        {errorMessage && <p>{errorMessage}</p>}

        {state.success === true ? (
          <Button type='submit' disabled={true} variant='ok' fill size='lg'>
            Magic Link has been sent!
          </Button>
        ) : (
          <SubmitButton />
        )}
      </Form>

      <span className={styles.or}>- or -</span>

      <Button type='button' fill size='lg' onClick={handleGoogle}>
        Continue with Google
      </Button>

      <Button type='button' disabled fill size='lg' onClick={handleGoogle}>
        Continue with GitHub
      </Button>

      <p className={styles.privacyPolicyText}>
        By creating an account, you agree to our{' '}
        <Link href={'/privacy-policy'}>Privacy Policy</Link>.
      </p>
    </div>
  );
};

export default LoginForm;
