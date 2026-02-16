import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { DialogProvider, useDialog } from '../DialogContext';

jest.useFakeTimers();

function DialogConsumer() {
  const { showDialog, hideDialog } = useDialog();

  return (
    <div>
      <button
        type='button'
        onClick={() =>
          showDialog({
            title: 'Confirm reset',
            description: 'Reset progress?',
            confirmText: 'Yes',
            cancelText: 'No',
            onConfirm: async () => undefined,
          })
        }
      >
        open-dialog
      </button>
      <button type='button' onClick={hideDialog}>
        close-dialog
      </button>
    </div>
  );
}

describe('DialogContext', () => {
  beforeEach(() => {
    Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
      configurable: true,
      value: jest.fn(),
    });

    Object.defineProperty(HTMLDialogElement.prototype, 'close', {
      configurable: true,
      value: jest.fn(),
    });
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  it('throws when useDialog is used outside provider', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() => render(<DialogConsumer />)).toThrow(
      'useDialog must be used within a DialogProvider',
    );

    spy.mockRestore();
  });

  it('shows dialog config content via showDialog', () => {
    render(
      <DialogProvider>
        <DialogConsumer />
      </DialogProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'open-dialog' }));

    expect(screen.getByText('Confirm reset')).toBeInTheDocument();
    expect(screen.getByText('Reset progress?')).toBeInTheDocument();
    expect(screen.getByText('Yes').closest('button')).toBeInTheDocument();
    expect(screen.getByText('No').closest('button')).toBeInTheDocument();
  });

  it('clears dialog config after hideDialog timeout', async () => {
    render(
      <DialogProvider>
        <DialogConsumer />
      </DialogProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'open-dialog' }));
    expect(screen.getByText('Confirm reset')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'close-dialog' }));

    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(screen.queryByText('Confirm reset')).not.toBeInTheDocument();
    });
  });

  it('handles async confirm action and toggles loading text', async () => {
    let resolveConfirm: (() => void) | null = null;

    function AsyncConsumer() {
      const { showDialog } = useDialog();
      return (
        <button
          type='button'
          onClick={() =>
            showDialog({
              title: 'Async confirm',
              confirmText: 'Run',
              loadingText: 'Running...',
              onConfirm: () =>
                new Promise<void>((resolve) => {
                  resolveConfirm = resolve;
                }),
            })
          }
        >
          open-async
        </button>
      );
    }

    render(
      <DialogProvider>
        <AsyncConsumer />
      </DialogProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'open-async' }));

    fireEvent.click(screen.getByText('Run').closest('button') as HTMLButtonElement);

    const runningButton = screen
      .getByText('Running...')
      .closest('button') as HTMLButtonElement;
    expect(runningButton).toBeDisabled();

    await act(async () => {
      resolveConfirm?.();
    });

    await waitFor(() => {
      expect(screen.getByText('Run').closest('button')).toBeInTheDocument();
    });
  });
});
