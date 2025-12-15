import clsx from 'clsx';
import './Modal.css';

type ModalProps = React.ComponentProps<'dialog'>;

const Modal = ({ children, className, ...props }: ModalProps) => {
  return (
    <dialog className={clsx('modal', className)} aria-modal='true' open {...props}>
      {children}
    </dialog>
  );
};

export default Modal;
