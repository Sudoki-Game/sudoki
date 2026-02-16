import { fireEvent, render, screen } from '@testing-library/react';
import ReportBugModal from '../ReportBugModal';
import { useModalRouter } from '@/game/context/ModalRouterContext';

jest.mock('@/game/context/ModalRouterContext', () => ({
  useModalRouter: jest.fn(),
}));

jest.mock('../../BugReport', () => ({
  __esModule: true,
  default: () => <div data-testid='bug-report-form'>Bug Form</div>,
}));

describe('ReportBugModal', () => {
  const goBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useModalRouter as jest.Mock).mockReturnValue({ goBack });
  });

  it('renders bug report content and navigates back', () => {
    render(<ReportBugModal />);

    expect(screen.getByText('Report a Bug')).toBeInTheDocument();
    expect(screen.getByTestId('bug-report-form')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Go Back' }));
    expect(goBack).toHaveBeenCalledTimes(1);
  });
});
