import { fireEvent, render, screen } from '@testing-library/react';
import HowToPlayModal from '../HowToPlayModal';
import { useModalRouter } from '@/game/context/ModalRouterContext';

jest.mock('@/game/context/ModalRouterContext', () => ({
  useModalRouter: jest.fn(),
}));

describe('HowToPlayModal', () => {
  const goBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useModalRouter as jest.Mock).mockReturnValue({ goBack });
    localStorage.clear();
  });

  it('renders tutorial content and dismisses with persistence flag', () => {
    render(<HowToPlayModal />);

    expect(screen.getByText('How to Play')).toBeInTheDocument();
    expect(screen.getByText('Goal')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Got It!' }));

    expect(localStorage.getItem('sudoki_tutorial_seen')).toBe('true');
    expect(goBack).toHaveBeenCalledTimes(1);
  });
});
