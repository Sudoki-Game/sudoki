import React from 'react';
import clsx from 'clsx';
import styles from './Form.module.css';

/**
 * Shared props for form wrapper components.
 */
export type FormProps = React.ComponentPropsWithRef<'form'>;

/**
 * Styled form container used across auth and modal flows.
 */
const Form = ({ children, className, ref, ...props }: FormProps) => {
  return (
    <form ref={ref} className={clsx(styles.form, className)} {...props}>
      {children}
    </form>
  );
};

export type FormFieldProps = React.ComponentPropsWithRef<'div'>;

/**
 * Styled field wrapper for grouping labels and inputs.
 */
export const FormField = ({
  children,
  className,
  ref,
  ...props
}: FormFieldProps) => {
  return (
    <div ref={ref} className={clsx(styles.formField, className)} {...props}>
      {children}
    </div>
  );
};

export default Form;
