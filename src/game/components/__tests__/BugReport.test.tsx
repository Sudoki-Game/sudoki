import { render, screen } from '@testing-library/react';
import BugReport from '../BugReport';
import { useFormStatus } from 'react-dom';
import { useActionState } from 'react';

jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  useFormStatus: jest.fn(),
}));

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useActionState: jest.fn(),
}));

jest.mock('@/game/lib/actionGateway', () => ({
  reportBug: jest.fn(),
}));

describe('BugReport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useFormStatus as jest.Mock).mockReturnValue({ pending: false });
    (useActionState as jest.Mock).mockReturnValue([
      { success: false, message: '' },
      jest.fn(),
    ]);
  });

  it('renders required report form fields and default submit text', () => {
    render(<BugReport />);

    expect(screen.getByLabelText('Email (Optional)')).toBeInTheDocument();
    expect(screen.getByLabelText('Bug Category')).toBeInTheDocument();
    expect(screen.getByLabelText('Bug Description')).toBeInTheDocument();
    expect(screen.getByLabelText('Steps to Reproduce')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Report Bug' })).toBeInTheDocument();
  });

  it('shows pending submit text while sending', () => {
    (useFormStatus as jest.Mock).mockReturnValue({ pending: true });

    render(<BugReport />);

    expect(screen.getByRole('button', { name: 'Sending…' })).toBeDisabled();
  });

  it('renders action message when present', () => {
    (useActionState as jest.Mock).mockReturnValue([
      { success: true, message: 'Thanks for the report!' },
      jest.fn(),
    ]);

    render(<BugReport />);

    expect(screen.getByText('Thanks for the report!')).toBeInTheDocument();
  });
});
