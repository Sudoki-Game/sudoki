'use client';

import { useFormStatus } from 'react-dom';
import { reportBug } from '@/app/actions/reportBug';
import { useActionState } from 'react';
import Button from '../../ui/components/Button';
import Select, { SelectOption } from '../../ui/components/Select';
import Form, { FormField } from '../../ui/components/Form';
import Label from '../../ui/components/Label';
import Textarea from '../../ui/components/Textarea';
import Input from '../../ui/components/Input';

const initialState = {
  success: false,
  message: '',
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type='submit' disabled={pending} variant='warning' fill size='lg'>
      {pending ? 'Sending…' : 'Report Bug'}
    </Button>
  );
}

const BugReport = () => {
  const [state, formAction] = useActionState(reportBug, initialState);

  return (
    <Form action={formAction}>
      <FormField>
        <Label htmlFor='email'>Email (SelectOptional)</Label>
        <Input
          type='email'
          name='email'
          id='email'
          placeholder='you@example.com'
        />
      </FormField>

      <FormField>
        <Label htmlFor='category'>Bug Category</Label>
        <Select name='category' id='category' required>
          <SelectOption value=''>Select a category</SelectOption>
          <SelectOption value='gameplay'>Gameplay issue</SelectOption>
          <SelectOption value='ui'>UI / visual bug</SelectOption>
          <SelectOption value='logic'>
            Sudoku logic / incorrect solution
          </SelectOption>
          <SelectOption value='performance'>
            Performance / freezing
          </SelectOption>
          <SelectOption value='crash'>Crash or error</SelectOption>
          <SelectOption value='other'>Other</SelectOption>
        </Select>
      </FormField>

      <FormField>
        <Label htmlFor='description'>Bug Description</Label>
        <Textarea name='description' id='description' rows={6} required />
      </FormField>

      <FormField>
        <Label htmlFor='steps'>Steps to Reproduce</Label>
        <Textarea name='steps' id='steps' rows={6} />
      </FormField>

      <SubmitButton />

      {state.message && <p>{state.message}</p>}
    </Form>
  );
};

export default BugReport;
