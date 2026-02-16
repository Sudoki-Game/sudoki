import { render, screen } from '@testing-library/react';
import Modal from '../Modal';
import ModalRouter from '../ModalRouter';
import { useModalRouter } from '@/game/context/ModalRouterContext';

jest.mock('@/game/context/ModalRouterContext', () => ({
  useModalRouter: jest.fn(),
}));

jest.mock('../SettingsModal', () => ({
  __esModule: true,
  default: () => <div data-testid='modal-settings'>Settings</div>,
}));

jest.mock('../GameOverModal', () => ({
  __esModule: true,
  default: () => <div data-testid='modal-gameover'>GameOver</div>,
}));

jest.mock('../SolutionModal', () => ({
  __esModule: true,
  default: () => <div data-testid='modal-solution'>Solution</div>,
}));

jest.mock('../ReportBugModal', () => ({
  __esModule: true,
  default: () => <div data-testid='modal-bug-report'>BugReport</div>,
}));

jest.mock('../LeaderboardModal', () => ({
  __esModule: true,
  default: () => <div data-testid='modal-leaderboard'>Leaderboard</div>,
}));

jest.mock('../HowToPlayModal', () => ({
  __esModule: true,
  default: () => <div data-testid='modal-how-to-play'>HowToPlay</div>,
}));

describe('Modal', () => {
  it('renders dialog container with aria-modal', () => {
    render(
      <Modal data-testid='modal-shell'>
        <span>Content</span>
      </Modal>,
    );

    const dialog = screen.getByTestId('modal-shell');
    expect(dialog.tagName).toBe('DIALOG');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('open');
    expect(screen.getByText('Content')).toBeInTheDocument();
  });
});

describe('ModalRouter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders null when there is no active modal', () => {
    (useModalRouter as jest.Mock).mockReturnValue({ activeModal: null });

    const { container } = render(<ModalRouter />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the active modal component', () => {
    (useModalRouter as jest.Mock).mockReturnValue({ activeModal: 'leaderboard' });

    render(<ModalRouter />);

    expect(screen.getByTestId('modal-leaderboard')).toBeInTheDocument();
  });
});
