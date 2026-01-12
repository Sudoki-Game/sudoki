import React from 'react';
import clsx from 'clsx';
import styles from './Textarea.module.css';

export type TextareaProps = React.ComponentPropsWithRef<'textarea'>;

const Textarea = ({ className, ref, ...props }: TextareaProps) => {
  return (
    <textarea
      ref={ref}
      {...props}
      className={clsx(styles.textarea, className)}
    />
  );
};

export default Textarea;
