import { render, screen } from '@testing-library/react';
import Copyright from '../Copyright';

describe('Copyright', () => {
  beforeEach(() => {
    // Mock Date.getFullYear to ensure consistent test results
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-01'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should render copyright link with current year', () => {
    render(<Copyright />);

    const link = screen.getByRole('link', { name: /@2024 Dylan Almond/i });

    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://dylanalmond.net');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('should render with correct copyright text format', () => {
    render(<Copyright />);

    const link = screen.getByRole('link');

    expect(link.textContent).toBe('@2024 Dylan Almond');
  });

  it('should use current year dynamically', () => {
    // Update mock time to different year
    jest.setSystemTime(new Date('2026-06-15'));

    render(<Copyright />);

    const link = screen.getByRole('link', { name: /@2026 Dylan Almond/i });

    expect(link).toBeInTheDocument();
  });

  it('should open link in new tab with security attributes', () => {
    render(<Copyright />);

    const link = screen.getByRole('link');

    // Verify security attributes for external link
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
