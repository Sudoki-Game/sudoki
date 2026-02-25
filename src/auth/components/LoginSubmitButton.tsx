'use client';

import { useFormStatus } from 'react-dom';
import Button from '@/ui/components/Button';

const LoginSubmitButton = () => {
  const { pending } = useFormStatus();

  return (
    <Button type='submit' disabled={pending} variant='ok' fill size='lg'>
      {pending ? 'Loading...' : 'Continue'}
    </Button>
  );
};

export default LoginSubmitButton;
