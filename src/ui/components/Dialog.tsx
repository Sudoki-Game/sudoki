import React from 'react';
import styles from './Dialog.module.css';
import Button from './Button';

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
  if (!open) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isLoading) {
      onClose();
    }
  };

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div className={styles.dialog} role="dialog" aria-modal="true">
        <h3 className={styles.title}>{title}</h3>
        {description && <p className={styles.description}>{description}</p>}
        <div className={styles.actions}>
          <Button
            fill
            size="lg"
            variant={variant}
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? loadingText : confirmText}
          </Button>
          {cancelText && (
            <Button
              fill
              size="lg"
              type="button"
              onClick={onClose}
              disabled={isLoading}
            >
              {cancelText}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dialog;
