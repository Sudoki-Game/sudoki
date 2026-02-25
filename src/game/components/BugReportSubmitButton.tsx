'use client';

import { useFormStatus } from 'react-dom';
import Button from '@/ui/components/Button';

const BugReportSubmitButton = () => {
  const { pending } = useFormStatus();

  return (
    <Button type='submit' disabled={pending} variant='warning' fill size='lg'>
      {pending ? 'Sending…' : 'Report Bug'}
    </Button>
  );
};

export default BugReportSubmitButton;
