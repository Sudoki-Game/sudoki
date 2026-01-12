import React from 'react';
import clsx from 'clsx';
import styles from './Input.module.css';

export type InputProps = React.ComponentPropsWithRef<'input'>;

export default function Input({ className, ref, ...props }: InputProps) {
  return (
    <input ref={ref} {...props} className={clsx(styles.input, className)} />
  );
}
