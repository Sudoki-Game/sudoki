import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import Dialog from '../Dialog';

describe('Dialog', () => {
  let showModalMock: jest.Mock;
  let closeMock: jest.Mock;

  beforeEach(() => {
    showModalMock = jest.fn();
    closeMock = jest.fn();

    Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
      configurable: true,
      value: showModalMock,
    });

    Object.defineProperty(HTMLDialogElement.prototype, 'close', {
      configurable: true,
      value: closeMock,
    });

    Object.defineProperty(HTMLDialogElement.prototype, 'getBoundingClientRect', {
      configurable: true,
      value: jest.fn(() => ({
        top: 100,
        left: 100,
        right: 300,
        bottom: 300,
        width: 200,
        height: 200,
      })),
    });
  });

  it('opens dialog when open=true and closes when open=false', () => {
    const { rerender } = render(
      <Dialog open onClose={jest.fn()} title='Title' onConfirm={jest.fn()} />,
    );

    expect(showModalMock).toHaveBeenCalledTimes(1);

    rerender(
      <Dialog open={false} onClose={jest.fn()} title='Title' onConfirm={jest.fn()} />,
    );

    expect(closeMock).toHaveBeenCalled();
  });

  it('renders title/description and triggers confirm', () => {
    const onConfirm = jest.fn();

    render(
      <Dialog
        open
        onClose={jest.fn()}
        title='Delete game'
        description='This cannot be undone'
        onConfirm={onConfirm}
      />,
    );

    expect(screen.getByText('Delete game')).toBeInTheDocument();
    expect(screen.getByText('This cannot be undone')).toBeInTheDocument();

    const confirmButton = screen.getByText('Confirm').closest('button');
    expect(confirmButton).not.toBeNull();
    fireEvent.click(confirmButton as HTMLButtonElement);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('uses loading text and disables actions when loading', () => {
    const onClose = jest.fn();

    render(
      <Dialog
        open
        onClose={onClose}
        title='Delete game'
        onConfirm={jest.fn()}
        isLoading
        loadingText='Saving...'
      />,
    );

    const loadingButton = screen.getByText('Saving...').closest('button');
    const cancelButton = screen.getByText('Cancel').closest('button');

    expect(loadingButton).not.toBeNull();
    expect(cancelButton).not.toBeNull();
    expect(loadingButton as HTMLButtonElement).toBeDisabled();
    expect(cancelButton as HTMLButtonElement).toBeDisabled();

    fireEvent.click(cancelButton as HTMLButtonElement);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('calls onClose for ESC cancel event when not loading', () => {
    const onClose = jest.fn();

    render(<Dialog open onClose={onClose} title='Title' onConfirm={jest.fn()} />);

    const dialog = document.querySelector('dialog') as HTMLDialogElement;
    const event = new Event('cancel', { cancelable: true });
    fireEvent(dialog, event);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose on backdrop click outside dialog bounds', () => {
    const onClose = jest.fn();

    render(<Dialog open onClose={onClose} title='Title' onConfirm={jest.fn()} />);

    const dialog = document.querySelector('dialog') as HTMLDialogElement;
    fireEvent.click(dialog, { clientX: 20, clientY: 20 });

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
