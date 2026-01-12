import React from 'react';
import clsx from 'clsx';
import { cva, VariantProps } from 'class-variance-authority';
import styles from './Button.module.css';

const buttonVariants = cva(styles.button, {
  variants: {
    variant: {
      default: '',
      warning: styles.variantWarning,
      ok: styles.variantOk,
      danger: styles.variantDanger,
    },
    size: {
      sm: styles.sizeSm,
      md: '',
      lg: styles.sizeLg,
      icon: styles.icon,
    },
    fill: {
      true: styles.fill,
    },
    disabled: {
      true: styles.disabled,
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'md',
  },
});

export type ButtonProps = React.ComponentPropsWithRef<'button'> &
  VariantProps<typeof buttonVariants>;

const Button = ({
  children,
  variant,
  size,
  fill,
  className,
  disabled,
  ref,
  ...props
}: ButtonProps) => {
  return (
    <button
      ref={ref}
      className={clsx(
        buttonVariants({ variant, size, fill, disabled }),
        className,
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
