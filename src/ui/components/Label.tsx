import clsx from 'clsx';
import styles from './Label.module.css';

export type LabelProps = React.ComponentPropsWithRef<'label'>;

const Label = ({ children, className, ref, ...props }: LabelProps) => {
  return (
    <label ref={ref} className={clsx(styles.label, className)} {...props}>
      {children}
    </label>
  );
};

export default Label;
