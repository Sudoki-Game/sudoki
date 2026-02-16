'use client';

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
  useCallback,
} from 'react';
import Dialog from '@/ui/components/Dialog';

/**
 * Runtime options for showing a confirmation dialog.
 */
export interface DialogConfig {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'danger' | 'warning' | 'ok';
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
  loadingText?: string;
}

/**
 * Dialog context API exposed to client components.
 */
interface DialogContextType {
  showDialog: (config: DialogConfig) => void;
  hideDialog: () => void;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

/**
 * Provides global dialog controls and hosts the dialog portal instance.
 */
export function DialogProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<DialogConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const showDialog = useCallback((newConfig: DialogConfig) => {
    setConfig(newConfig);
    setIsOpen(true);
    setIsLoading(false);
  }, []);

  const hideDialog = useCallback(() => {
    setIsOpen(false);
    setIsLoading(false);
    // Clear config after animation completes
    setTimeout(() => setConfig(null), 300);
  }, []);

  const handleConfirm = async () => {
    if (!config) return;

    setIsLoading(true);
    try {
      await config.onConfirm();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DialogContext.Provider value={{ showDialog, hideDialog }}>
      {children}
      {config && (
        <Dialog
          open={isOpen}
          onClose={hideDialog}
          title={config.title}
          description={config.description}
          confirmText={config.confirmText}
          cancelText={config.cancelText}
          variant={config.variant}
          onConfirm={handleConfirm}
          isLoading={config.isLoading ?? isLoading}
          loadingText={config.loadingText}
        />
      )}
    </DialogContext.Provider>
  );
}

/**
 * Access dialog controls from components inside `DialogProvider`.
 */
export function useDialog() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
}
