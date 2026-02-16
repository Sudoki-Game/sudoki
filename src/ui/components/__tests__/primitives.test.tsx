import React from 'react';
import { render, screen } from '@testing-library/react';
import Form, { FormField } from '../Form';
import Input from '../Input';
import Label from '../Label';
import Select, { SelectOption } from '../Select';
import Textarea from '../Textarea';

describe('UI primitives', () => {
  it('renders Form and forwards props', () => {
    render(
      <Form aria-label='auth-form' className='custom-form'>
        <button type='submit'>Submit</button>
      </Form>,
    );

    const form = screen.getByRole('form', { name: 'auth-form' });
    expect(form).toHaveClass('custom-form');
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
  });

  it('renders FormField and forwards custom attributes', () => {
    render(
      <FormField data-testid='field' className='field-class'>
        content
      </FormField>,
    );

    const field = screen.getByTestId('field');
    expect(field).toHaveTextContent('content');
    expect(field).toHaveClass('field-class');
  });

  it('renders Input with provided props', () => {
    render(<Input aria-label='email' value='a@b.com' readOnly />);

    const input = screen.getByRole('textbox', { name: 'email' });
    expect(input).toHaveValue('a@b.com');
  });

  it('renders Label associated with control', () => {
    render(
      <>
        <Label htmlFor='username'>Username</Label>
        <Input id='username' aria-label='username-input' />
      </>,
    );

    expect(screen.getByText('Username').tagName).toBe('LABEL');
    expect(screen.getByRole('textbox', { name: 'username-input' })).toBeInTheDocument();
  });

  it('renders Select and SelectOption children', () => {
    render(
      <Select aria-label='difficulty' defaultValue='medium'>
        <SelectOption value='easy'>Easy</SelectOption>
        <SelectOption value='medium'>Medium</SelectOption>
      </Select>,
    );

    const select = screen.getByRole('combobox', { name: 'difficulty' });
    expect(select).toHaveValue('medium');
    expect(screen.getByRole('option', { name: 'Easy' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Medium' })).toBeInTheDocument();
  });

  it('renders Textarea with provided props', () => {
    render(<Textarea aria-label='notes' defaultValue='hello' rows={5} />);

    const textarea = screen.getByRole('textbox', { name: 'notes' });
    expect(textarea).toHaveValue('hello');
    expect(textarea).toHaveAttribute('rows', '5');
  });
});
