'use client';

import { useFormStatus } from 'react-dom';
import { reportBug } from '@/app/actions/reportBug';
import { useActionState } from 'react';

const initialState = {
  success: false,
  message: ''
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className='form__submit button button--fill button--lg button--warning'
      type='submit'
      disabled={pending}
    >
      {pending ? 'Sending…' : 'Report Bug'}
    </button>
  );
}

const BugReport = () => {
  const [state, formAction] = useActionState(reportBug, initialState);

  return (
    <form className='form' action={formAction}>
      <div className='form__field'>
        <label className='form__label' htmlFor='email'>
          Email (optional)
        </label>
        <input
          className='form__input'
          type='email'
          name='email'
          id='email'
          placeholder='you@example.com'
        />
      </div>

      <div className='form__field'>
        <label className='form__label' htmlFor='category'>
          Bug Category
        </label>
        <select className='form__select' name='category' id='category' required>
          <option value=''>Select a category</option>
          <option value='gameplay'>Gameplay issue</option>
          <option value='ui'>UI / visual bug</option>
          <option value='logic'>Sudoku logic / incorrect solution</option>
          <option value='performance'>Performance / freezing</option>
          <option value='crash'>Crash or error</option>
          <option value='other'>Other</option>
        </select>
      </div>

      <div className='form__field'>
        <label className='form__label' htmlFor='description'>
          Bug Description
        </label>
        <textarea
          className='form__textarea'
          name='description'
          id='description'
          rows={5}
          required
        />
      </div>

      <div className='form__field'>
        <label className='form__label' htmlFor='steps'>
          Steps to Reproduce
        </label>
        <textarea className='form__textarea' name='steps' id='steps' rows={4} />
      </div>

      <SubmitButton />

      {state.message && (
        <p
          className={`form__message ${
            state.success ? 'form__message--success' : 'form__message--error'
          }`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
};

export default BugReport;
