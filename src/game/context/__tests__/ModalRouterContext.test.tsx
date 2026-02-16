import { act, fireEvent, render, screen } from '@testing-library/react';
import {
  ModalRouterProvider,
  useModalRouter,
} from '../ModalRouterContext';

function ModalRouterConsumer() {
  const { activeModal, openModal, closeModal, goBack } = useModalRouter();

  return (
    <div>
      <div data-testid='active-modal'>{activeModal ?? 'none'}</div>
      <button type='button' onClick={() => openModal('settings')}>
        open-settings
      </button>
      <button type='button' onClick={() => openModal('leaderboard')}>
        open-leaderboard
      </button>
      <button type='button' onClick={goBack}>
        go-back
      </button>
      <button type='button' onClick={closeModal}>
        close
      </button>
    </div>
  );
}

describe('ModalRouterContext', () => {
  it('throws when used outside provider', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() => render(<ModalRouterConsumer />)).toThrow(
      'useModalRouter must be used within an ModalRouterProvider',
    );

    spy.mockRestore();
  });

  it('opens modal, ignores duplicate open, and resets on close', () => {
    render(
      <ModalRouterProvider>
        <ModalRouterConsumer />
      </ModalRouterProvider>,
    );

    expect(screen.getByTestId('active-modal')).toHaveTextContent('none');

    fireEvent.click(screen.getByRole('button', { name: 'open-settings' }));
    expect(screen.getByTestId('active-modal')).toHaveTextContent('settings');

    fireEvent.click(screen.getByRole('button', { name: 'open-settings' }));
    expect(screen.getByTestId('active-modal')).toHaveTextContent('settings');

    fireEvent.click(screen.getByRole('button', { name: 'close' }));
    expect(screen.getByTestId('active-modal')).toHaveTextContent('none');
  });

  it('navigates modal history with goBack and clears when at root', () => {
    render(
      <ModalRouterProvider>
        <ModalRouterConsumer />
      </ModalRouterProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'open-settings' }));
    fireEvent.click(screen.getByRole('button', { name: 'open-leaderboard' }));
    expect(screen.getByTestId('active-modal')).toHaveTextContent('leaderboard');

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'go-back' }));
    });
    expect(screen.getByTestId('active-modal')).toHaveTextContent('settings');

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'go-back' }));
    });
    expect(screen.getByTestId('active-modal')).toHaveTextContent('none');
  });
});
