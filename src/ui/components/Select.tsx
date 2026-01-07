import React from 'react';
import clsx from 'clsx';
import styles from './Select.module.css';

export type SelectProps = React.ComponentPropsWithRef<'select'>;

const Select = ({ className, ref, ...props }: SelectProps) => {
  return <select ref={ref} {...props} className={clsx(styles.select, className)} />;
};

export type SelectOptionProps = React.ComponentPropsWithRef<'option'>;

export const SelectOption = ({ className, ref, ...props }: SelectOptionProps) => {
  return <option ref={ref} {...props} className={className} />;
};

export default Select;
