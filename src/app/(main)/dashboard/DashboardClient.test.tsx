/**
 * End-to-End Tests for DashboardClient Component
 * 
 * Tests the client-side retry mechanism, warning banner display,
 * and state management for KPI data.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import DashboardClient from './DashboardClient';
import type { KPIData } from './page';

// Mock dynamic imports
vi.mock('next/dynamic', () => ({
  default: (fn: any) => {
    const Component = () => <div data-testid="map-view">Map View</div>;
    return Component;
  },
}));

// Mock hooks
vi.mock('@/hooks/useCrosswalkDetails', () => ({
  useCrosswalkDetails: () => ({
    nearbyAccidents: [],
    loading: false,
    error: null,
  }),
  convertToEnhancedCrosswalk: (crosswalk: any) => crosswalk,
}));

// Mock child components
vi.mock('@/components/dashboard/KPICard', () => ({
  default: ({ title, content }: any) => (
    <div data-testid={`kpi-card-${title}`}>{content}</div>
  ),
}));

vi.mock('@/components/dashboard/DistrictSelectors', () => ({
  default: () => <div data-testid="district-selectors">District Selectors</div>,
}));

vi.mock('@/components/dashboard/WarningBanner', () => ({
  default: ({ onRetry, isRetrying }: any) => (
    <div data-testid="warning-banner">
      <button onClick={onRetry} disabled={isRetrying} data-testid="retry-button">
        {isRetrying ? 'Retrying...' : 'Retry'}
      </button>
    </div>
  ),
}));

vi.mock('@/components/dashboard/map/SelectedCrosswalkPanel', () => ({
  SelectedCrosswalkPanel: () => <div data-testid="crosswalk-panel">Crosswalk Panel</div>,
}));

vi.mock('@/components/ui/Button', () => ({
  Button: ({ children, onClick }: any) => (
    <button onClick={onClick} data-testid="info-button">{children}</button>
  ),
}));

vi.mock('@/components/ui/Modal', () => ({
  Modal: ({ children, isOpen }: any) => (
    isOpen ? <div data-testid="modal">{children}</div> : null
  ),
}));

vi.mock('./IndexExplain', () => ({
  default: () => <div data-testid="index-explain">Index Explanation</div>,
}));

describe('DashboardClient - End-to-End Tests', () => {
  const fallbackData: KPIData = {
    totalCrosswalks: 0,
    signalInstallationRate: 0,
    riskIndex: 0,
    safetyIndex: 0,
  };

  const realData: KPIData = {
    totalCrosswalks: 1500,
    signalInstallationRate: 75.5,
    riskIndex: 42.3,
    safetyIndex: 85.2,
  };

  let fetchMock: any;

  beforeEach(() => {
    // Mock fetch
    fetchMock = vi.fn();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Test 1: Warning Banner Display with Fallback Data', () => {
    it('should display warning banner when initialized with fallback data', () => {
      render(<DashboardClient initialKpiData={fallbackData} />);

      // Verify warning banner is displayed
      expect(screen.getByTestId('warning-banner')).toBeInTheDocument();
      expect(screen.getByTestId('retry-button')).toBeInTheDocument();
    });

    it('should NOT display warning banner when initialized with real data', () => {
      render(<DashboardClient initialKpiData={realData} />);

      // Verify warning banner is NOT displayed
      expect(screen.queryByTestId('warning-banner')).not.toBeInTheDocument();
    });
  });

  describe('Test 2: Successful Retry Flow', () => {
    it('should update KPI data and hide warning banner on successful retry', async () => {
      // Setup: Mock successful fetch
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => realData,
      });

      render(<DashboardClient initialKpiData={fallbackData} />);

      // Verify initial state: warning banner is shown
      expect(screen.getByTestId('warning-banner')).toBeInTheDocument();

      // Execute: Click retry button
      const retryButton = screen.getByTestId('retry-button');
      fireEvent.click(retryButton);

      // Verify: Loading state
      await waitFor(() => {
        expect(screen.getByText('Retrying...')).toBeInTheDocument();
      });

      // Verify: After successful retry, warning banner is hidden
      await waitFor(() => {
        expect(screen.queryByTestId('warning-banner')).not.toBeInTheDocument();
      });

      // Verify: KPI data is updated
      expect(screen.getByTestId('kpi-card-전체 횡단보도')).toHaveTextContent('1,500');
    });
  });

  describe('Test 3: Failed Retry Flow', () => {
    it('should show error message and keep fallback data on failed retry', async () => {
      // Setup: Mock failed fetch
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      render(<DashboardClient initialKpiData={fallbackData} />);

      // Verify initial state
      expect(screen.getByTestId('warning-banner')).toBeInTheDocument();

      // Execute: Click retry button
      const retryButton = screen.getByTestId('retry-button');
      fireEvent.click(retryButton);

      // Verify: Error message is displayed
      await waitFor(() => {
        expect(screen.getByText(/Retry Failed/i)).toBeInTheDocument();
      });

      // Verify: Warning banner is still shown (fallback data still active)
      expect(screen.getByTestId('warning-banner')).toBeInTheDocument();

      // Verify: KPI data remains as fallback (zeros)
      expect(screen.getByTestId('kpi-card-전체 횡단보도')).toHaveTextContent('0');
    });

    it('should handle network error during retry', async () => {
      // Setup: Mock network error
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      render(<DashboardClient initialKpiData={fallbackData} />);

      // Execute: Click retry button
      const retryButton = screen.getByTestId('retry-button');
      fireEvent.click(retryButton);

      // Verify: Error message is displayed
      await waitFor(() => {
        expect(screen.getByText(/Retry Failed/i)).toBeInTheDocument();
        expect(screen.getByText(/Network error/i)).toBeInTheDocument();
      });

      // Verify: Warning banner is still shown
      expect(screen.getByTestId('warning-banner')).toBeInTheDocument();
    });
  });

  describe('Test 4: Fallback Data Detection', () => {
    it('should correctly identify all-zero data as fallback', () => {
      render(<DashboardClient initialKpiData={fallbackData} />);
      expect(screen.getByTestId('warning-banner')).toBeInTheDocument();
    });

    it('should correctly identify partial data as NOT fallback', () => {
      const partialData: KPIData = {
        totalCrosswalks: 100,
        signalInstallationRate: 0,
        riskIndex: 0,
        safetyIndex: 0,
      };

      render(<DashboardClient initialKpiData={partialData} />);
      expect(screen.queryByTestId('warning-banner')).not.toBeInTheDocument();
    });
  });

  describe('Test 5: Complete Flow - Error to Success', () => {
    it('should handle complete flow: fallback → retry → success', async () => {
      // Setup: Mock successful fetch
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => realData,
      });

      render(<DashboardClient initialKpiData={fallbackData} />);

      // Step 1: Initial state with fallback data
      expect(screen.getByTestId('warning-banner')).toBeInTheDocument();
      expect(screen.getByTestId('kpi-card-전체 횡단보도')).toHaveTextContent('0');

      // Step 2: User clicks retry
      fireEvent.click(screen.getByTestId('retry-button'));

      // Step 3: Loading state
      await waitFor(() => {
        expect(screen.getByText('Retrying...')).toBeInTheDocument();
      });

      // Step 4: Success - data updated, warning hidden
      await waitFor(() => {
        expect(screen.queryByTestId('warning-banner')).not.toBeInTheDocument();
      });

      expect(screen.getByTestId('kpi-card-전체 횡단보도')).toHaveTextContent('1,500');
      expect(screen.getByTestId('kpi-card-신호등 설치율')).toHaveTextContent('75.5%');
    });
  });

  describe('Test 6: Dashboard Functionality with Fallback Data', () => {
    it('should render all dashboard features with fallback data', () => {
      render(<DashboardClient initialKpiData={fallbackData} />);

      // Verify all KPI cards are rendered
      expect(screen.getByTestId('kpi-card-전체 횡단보도')).toBeInTheDocument();
      expect(screen.getByTestId('kpi-card-신호등 설치율')).toBeInTheDocument();
      expect(screen.getByTestId('kpi-card-안전 지수')).toBeInTheDocument();
      expect(screen.getByTestId('kpi-card-위험 지수')).toBeInTheDocument();

      // Verify map is rendered
      expect(screen.getByTestId('map-view')).toBeInTheDocument();

      // Verify other features are functional
      expect(screen.getByTestId('district-selectors')).toBeInTheDocument();
      expect(screen.getByTestId('crosswalk-panel')).toBeInTheDocument();
    });
  });
});
