/**
 * Tests for WarningBanner Component
 * 
 * Tests the warning banner display, retry button, and dismiss functionality.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import WarningBanner from './WarningBanner';

// Mock Button component
vi.mock('@/components/ui/Button', () => ({
  Button: ({ children, onClick, loading, disabled, className }: any) => (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={className}
      data-testid="retry-button"
    >
      {loading ? 'Loading...' : children}
    </button>
  ),
}));

describe('WarningBanner Component', () => {
  let mockOnRetry: any;

  beforeEach(() => {
    mockOnRetry = vi.fn();
  });

  describe('Test 1: Banner Display', () => {
    it('should render warning banner with appropriate message', () => {
      render(<WarningBanner onRetry={mockOnRetry} />);

      // Verify banner is displayed
      expect(screen.getByText('Data Unavailable')).toBeInTheDocument();
      expect(screen.getByText(/Unable to load KPI data from the server/i)).toBeInTheDocument();
      expect(screen.getByText(/Displaying default values/i)).toBeInTheDocument();
    });

    it('should display retry button', () => {
      render(<WarningBanner onRetry={mockOnRetry} />);

      const retryButton = screen.getByTestId('retry-button');
      expect(retryButton).toBeInTheDocument();
      expect(retryButton).toHaveTextContent('Retry');
    });

    it('should display dismiss button', () => {
      render(<WarningBanner onRetry={mockOnRetry} />);

      const dismissButton = screen.getByLabelText('Dismiss warning');
      expect(dismissButton).toBeInTheDocument();
    });
  });

  describe('Test 2: Retry Functionality', () => {
    it('should call onRetry when retry button is clicked', () => {
      render(<WarningBanner onRetry={mockOnRetry} />);

      const retryButton = screen.getByTestId('retry-button');
      fireEvent.click(retryButton);

      expect(mockOnRetry).toHaveBeenCalledTimes(1);
    });

    it('should show loading state during retry', () => {
      render(<WarningBanner onRetry={mockOnRetry} isRetrying={true} />);

      const retryButton = screen.getByTestId('retry-button');
      expect(retryButton).toHaveTextContent('Loading...');
      expect(retryButton).toBeDisabled();
    });

    it('should disable retry button during retry', () => {
      render(<WarningBanner onRetry={mockOnRetry} isRetrying={true} />);

      const retryButton = screen.getByTestId('retry-button');
      expect(retryButton).toBeDisabled();
    });
  });

  describe('Test 3: Dismiss Functionality', () => {
    it('should hide banner when dismiss button is clicked', () => {
      render(<WarningBanner onRetry={mockOnRetry} />);

      // Verify banner is initially visible
      expect(screen.getByText('Data Unavailable')).toBeInTheDocument();

      // Click dismiss button
      const dismissButton = screen.getByLabelText('Dismiss warning');
      fireEvent.click(dismissButton);

      // Verify banner is hidden
      expect(screen.queryByText('Data Unavailable')).not.toBeInTheDocument();
    });

    it('should not call onRetry when dismissed', () => {
      render(<WarningBanner onRetry={mockOnRetry} />);

      const dismissButton = screen.getByLabelText('Dismiss warning');
      fireEvent.click(dismissButton);

      expect(mockOnRetry).not.toHaveBeenCalled();
    });
  });

  describe('Test 4: Visual Elements', () => {
    it('should display warning SVG elements', () => {
      const { container } = render(<WarningBanner onRetry={mockOnRetry} />);

      // Check for SVG warning icon
      const svgs = container.querySelectorAll('svg');
      expect(svgs.length).toBeGreaterThan(0);
    });

    it('should have appropriate styling classes', () => {
      const { container } = render(<WarningBanner onRetry={mockOnRetry} />);

      // Check for yellow warning styling
      const banner = container.querySelector('.bg-yellow-50');
      expect(banner).toBeInTheDocument();

      const border = container.querySelector('.border-yellow-400');
      expect(border).toBeInTheDocument();
    });
  });
});
