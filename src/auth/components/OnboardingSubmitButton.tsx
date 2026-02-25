'use client';

import { useFormStatus } from 'react-dom';
import Button from '@/ui/components/Button';

const OnboardingSubmitButton = () => {
  const { pending } = useFormStatus();

  return (
    <Button type='submit' disabled={pending} variant='ok' fill size='lg'>
      {pending ? 'Setting up...' : 'Start Playing!'}
    </Button>
  );
};

export default OnboardingSubmitButton;
