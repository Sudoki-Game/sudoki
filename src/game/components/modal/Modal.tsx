import clsx from 'clsx';
import styles from './Modal.module.css';

type ModalProps = React.ComponentProps<'dialog'>;

const Modal = ({ children, className, ...props }: ModalProps) => {
  return (
    <dialog
      className={clsx(styles.modal, className)}
      aria-modal='true'
      open
      {...props}
    >
      {children}
    </dialog>
  );
};

export default Modal;
