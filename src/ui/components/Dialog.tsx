import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import styles from './Dialog.module.css';
import Button from './Button';

/**
 * Configuration for the confirmation dialog component.
 */
export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  variant?: 'default' | 'danger' | 'warning' | 'ok';
  isLoading?: boolean;
  loadingText?: string;
}

/**
 * Modal confirmation dialog rendered through a portal.
 */
const Dialog = ({
  open,
  onClose,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  variant = 'default',
  isLoading = false,
  loadingText = 'Loading...',
}: DialogProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [open]);

  // Handle ESC key and backdrop click
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = (e: Event) => {
      e.preventDefault();
      if (!isLoading) {
        onClose();
      }
    };

    const handleClick = (e: MouseEvent) => {
      const rect = dialog.getBoundingClientRect();
      const isInDialog =
        rect.top <= e.clientY &&
        e.clientY <= rect.top + rect.height &&
        rect.left <= e.clientX &&
        e.clientX <= rect.left + rect.width;

      if (!isInDialog && !isLoading) {
        onClose();
      }
    };

    dialog.addEventListener('cancel', handleCancel);
    dialog.addEventListener('click', handleClick);

    return () => {
      dialog.removeEventListener('cancel', handleCancel);
      dialog.removeEventListener('click', handleClick);
    };
  }, [onClose, isLoading]);

  if (typeof window === 'undefined') return null;

  return createPortal(
    <dialog ref={dialogRef} className={styles.dialog}>
      <div className={styles.content}>
        <h3 className={styles.title}>{title}</h3>
        {description && <p className={styles.description}>{description}</p>}
        <div className={styles.actions}>
          <Button
            fill
            size='lg'
            variant={variant}
            type='button'
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? loadingText : confirmText}
          </Button>
          {cancelText && (
            <Button
              fill
              size='lg'
              type='button'
              onClick={onClose}
              disabled={isLoading}
            >
              {cancelText}
            </Button>
          )}
        </div>
      </div>
    </dialog>,
    document.body,
  );
};

export default Dialog;
