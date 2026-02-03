'use client';

import { useActionState, useEffect } from 'react';
import { uploadAllLocalMatches } from '@/match/lib/sync';
import { getAuth } from 'firebase/auth';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { completeOnboarding, OnboardingResult } from '@/app/actions/auth';
import Button from '@/ui/components/Button';
import Form from '@/ui/components/Form';
import Input from '@/ui/components/Input';
import styles from './OnboardingForm.module.css';

const initialState: OnboardingResult = {
  success: false,
  error: undefined,
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type='submit' disabled={pending} variant='ok' fill size='lg'>
      {pending ? 'Setting up...' : 'Start Playing!'}
    </Button>
  );
}

const OnboardingForm = () => {
  const router = useRouter();
  const [state, formAction] = useActionState(completeOnboarding, initialState);

  useEffect(() => {
    // Redirect after successful submission
    if (state.success) {
      router.replace('/');

      // Background sync: transfer local matches to server for new user
      (async () => {
        try {
          const auth = getAuth();
          const user = auth.currentUser;
          if (!user) {
            console.warn(
              '[OnboardingSync] No authenticated user found for sync.',
            );
            return;
          }
          // Use the dedicated sync method for onboarding
          const result = await uploadAllLocalMatches(user.uid);
          if (result.uploaded > 0) {
            console.log(
              `[OnboardingSync] Uploaded ${result.uploaded} matches to server during onboarding.`,
            );
          }
          if (result.failed > 0) {
            console.warn(
              `[OnboardingSync] Failed to upload ${result.failed} matches during onboarding.`,
            );
          }
        } catch (err) {
          console.warn('[OnboardingSync] Error during onboarding sync:', err);
        }
      })();
    }
  }, [state.success, router]);

  return (
    <div className={styles.wrapper}>
      <Form action={formAction}>
        <Input
          type='text'
          name='displayName'
          id='displayName'
          placeholder='Enter your display name'
          maxLength={30}
          required
        />

        {state.error && <p className={styles.error}>{state.error}</p>}

        <SubmitButton />
      </Form>

      <p className={styles.infoText}>
        You can change this later in your settings.
      </p>
    </div>
  );
};

export default OnboardingForm;
