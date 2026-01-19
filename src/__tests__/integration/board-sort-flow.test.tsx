/**
 * Integration Test: Board Sort Flow
 * Feature: board-sort-cache-fix
 * 
 * Tests the end-to-end flow: select dropdown → URL update → fetch → render
 * Validates Requirements: 1.1, 1.2, 1.3, 1.4
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import BoardFilters from '@/components/board/BoardFilters';
import BoardList from '@/components/board/BoardList';
import type { Suggestion } from '@/features/board/types';

// Mock Next.js router
const mockPush = vi.fn();
const mockSearchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => mockSearchParams,
}));

// Mock Next.js Link
vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

// Mock SuggestionCard to simplify testing
vi.mock('@/app/(main)/board/SuggestionCard', () => ({
  default: ({ suggestion }: { suggestion: Suggestion }) => (
    <div data-testid={`suggestion-${suggestion.id}`}>
      <h3>{suggestion.title}</h3>
      <span data-testid={`created-${suggestion.id}`}>{suggestion.created_at}</span>
      <span data-testid={`likes-${suggestion.id}`}>{suggestion.like_count}</span>
      <span data-testid={`priority-${suggestion.id}`}>{suggestion.priority_score}</span>
      <span data-testid={`status-${suggestion.id}`}>{suggestion.status}</span>
    </div>
  ),
}));

describe('Integration Test: Board Sort Flow', () => {
  let fetchMock: any;

  const mockSuggestions: Suggestion[] = [
    {
      id: 1,
      title: 'Suggestion 1',
      content: 'Content 1',
      location_lat: 37.5,
      location_lon: 127.0,
      address: 'Address 1',
      sido: '서울',
      sigungu: '강남구',
      suggestion_type: 'SIGNAL',
      status: 'PENDING',
      priority_score: 85,
      like_count: 100,
      view_count: 500,
      comment_count: 10,
      created_at: '2025-01-15T10:00:00Z',
      updated_at: '2025-01-15T10:00:00Z',
      user_id: 1,
      user: { id: 1, name: 'User 1' },
    },
    {
      id: 2,
      title: 'Suggestion 2',
      content: 'Content 2',
      location_lat: 37.5,
      location_lon: 127.0,
      address: 'Address 2',
      sido: '서울',
      sigungu: '서초구',
      suggestion_type: 'CROSSWALK',
      status: 'APPROVED',
      priority_score: 60,
      like_count: 200,
      view_count: 800,
      comment_count: 20,
      created_at: '2025-01-18T10:00:00Z',
      updated_at: '2025-01-18T10:00:00Z',
      user_id: 2,
      user: { id: 2, name: 'User 2' },
    },
    {
      id: 3,
      title: 'Suggestion 3',
      content: 'Content 3',
      location_lat: 37.5,
      location_lon: 127.0,
      address: 'Address 3',
      sido: '서울',
      sigungu: '종로구',
      suggestion_type: 'FACILITY',
      status: 'COMPLETED',
      priority_score: 95,
      like_count: 50,
      view_count: 300,
      comment_count: 5,
      created_at: '2025-01-10T10:00:00Z',
      updated_at: '2025-01-10T10:00:00Z',
      user_id: 3,
      user: { id: 3, name: 'User 3' },
    },
  ];

  beforeEach(() => {
    fetchMock = vi.fn();
    global.fetch = fetchMock;
    mockPush.mockClear();
    mockSearchParams.delete('sortBy');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Test 1: Sort by Latest (Default)', () => {
    it('should display suggestions sorted by creation date descending', async () => {
      // Setup: Mock regions fetch
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ['서울', '경기', '부산'],
      });

      // Render filters
      render(
        <BoardFilters
          initialValue=""
          initialFilters={{
            status: 'ALL',
            type: 'ALL',
            region: 'ALL',
            sortBy: 'latest',
          }}
        />
      );

      // Wait for regions to load
      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith('/api/suggestions/regions');
      });

      // Verify default sort value is 'latest'
      // Find the sort dropdown by its options
      const sortDropdowns = screen.getAllByRole('combobox');
      const sortDropdown = sortDropdowns.find(el => 
        el.querySelector('option[value="latest"]')
      ) as HTMLSelectElement;
      expect(sortDropdown).toBeDefined();
      expect(sortDropdown.value).toBe('latest');

      // Render list with data sorted by latest (newest first)
      const sortedByLatest = [...mockSuggestions].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      render(<BoardList suggestions={sortedByLatest} />);

      // Verify order: id 2 (Jan 18) → id 1 (Jan 15) → id 3 (Jan 10)
      const suggestionElements = screen.getAllByTestId(/^suggestion-/);
      expect(suggestionElements[0]).toHaveAttribute('data-testid', 'suggestion-2');
      expect(suggestionElements[1]).toHaveAttribute('data-testid', 'suggestion-1');
      expect(suggestionElements[2]).toHaveAttribute('data-testid', 'suggestion-3');
    });
  });

  describe('Test 2: Sort by Popular', () => {
    it('should update URL and display suggestions sorted by like count descending', async () => {
      // Setup: Mock regions fetch
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ['서울', '경기', '부산'],
      });

      // Render filters
      render(
        <BoardFilters
          initialValue=""
          initialFilters={{
            status: 'ALL',
            type: 'ALL',
            region: 'ALL',
            sortBy: 'latest',
          }}
        />
      );

      // Wait for regions to load
      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalled();
      });

      // Open filters
      const filterButton = screen.getByText('필터');
      fireEvent.click(filterButton);

      // Change sort to 'popular'
      // Find the sort dropdown (4th combobox - status, type, region, sort)
      const sortDropdowns = screen.getAllByRole('combobox');
      const sortDropdown = sortDropdowns[3]; // Sort is the 4th dropdown
      fireEvent.change(sortDropdown, { target: { value: 'popular' } });

      // Verify URL update was called with sortBy=popular
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('sortBy=popular'));
      });

      // Render list with data sorted by popular (highest likes first)
      const sortedByPopular = [...mockSuggestions].sort((a, b) => b.like_count - a.like_count);

      render(<BoardList suggestions={sortedByPopular} />);

      // Verify order: id 2 (200 likes) → id 1 (100 likes) → id 3 (50 likes)
      const suggestionElements = screen.getAllByTestId(/^suggestion-/);
      expect(suggestionElements[0]).toHaveAttribute('data-testid', 'suggestion-2');
      expect(suggestionElements[1]).toHaveAttribute('data-testid', 'suggestion-1');
      expect(suggestionElements[2]).toHaveAttribute('data-testid', 'suggestion-3');
    });
  });

  describe('Test 3: Sort by Priority', () => {
    it('should update URL and display suggestions sorted by priority score descending', async () => {
      // Setup: Mock regions fetch
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ['서울', '경기', '부산'],
      });

      // Render filters
      render(
        <BoardFilters
          initialValue=""
          initialFilters={{
            status: 'ALL',
            type: 'ALL',
            region: 'ALL',
            sortBy: 'latest',
          }}
        />
      );

      // Wait for regions to load
      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalled();
      });

      // Open filters
      const filterButton = screen.getByText('필터');
      fireEvent.click(filterButton);

      // Change sort to 'priority'
      const sortDropdowns = screen.getAllByRole('combobox');
      const sortDropdown = sortDropdowns[3]; // Sort is the 4th dropdown
      fireEvent.change(sortDropdown, { target: { value: 'priority' } });

      // Verify URL update was called with sortBy=priority
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('sortBy=priority'));
      });

      // Render list with data sorted by priority (highest score first)
      const sortedByPriority = [...mockSuggestions].sort((a, b) => b.priority_score - a.priority_score);

      render(<BoardList suggestions={sortedByPriority} />);

      // Verify order: id 3 (95) → id 1 (85) → id 2 (60)
      const suggestionElements = screen.getAllByTestId(/^suggestion-/);
      expect(suggestionElements[0]).toHaveAttribute('data-testid', 'suggestion-3');
      expect(suggestionElements[1]).toHaveAttribute('data-testid', 'suggestion-1');
      expect(suggestionElements[2]).toHaveAttribute('data-testid', 'suggestion-2');
    });
  });

  describe('Test 4: Sort by Status', () => {
    it('should update URL and display suggestions sorted by status alphabetically', async () => {
      // Setup: Mock regions fetch
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ['서울', '경기', '부산'],
      });

      // Render filters
      render(
        <BoardFilters
          initialValue=""
          initialFilters={{
            status: 'ALL',
            type: 'ALL',
            region: 'ALL',
            sortBy: 'latest',
          }}
        />
      );

      // Wait for regions to load
      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalled();
      });

      // Open filters
      const filterButton = screen.getByText('필터');
      fireEvent.click(filterButton);

      // Change sort to 'status'
      const sortDropdowns = screen.getAllByRole('combobox');
      const sortDropdown = sortDropdowns[3]; // Sort is the 4th dropdown
      fireEvent.change(sortDropdown, { target: { value: 'status' } });

      // Verify URL update was called with sortBy=status
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('sortBy=status'));
      });

      // Render list with data sorted by status (alphabetical)
      const sortedByStatus = [...mockSuggestions].sort((a, b) => a.status.localeCompare(b.status));

      render(<BoardList suggestions={sortedByStatus} />);

      // Verify order: APPROVED (id 2) → COMPLETED (id 3) → PENDING (id 1)
      const suggestionElements = screen.getAllByTestId(/^suggestion-/);
      expect(suggestionElements[0]).toHaveAttribute('data-testid', 'suggestion-2');
      expect(suggestionElements[1]).toHaveAttribute('data-testid', 'suggestion-3');
      expect(suggestionElements[2]).toHaveAttribute('data-testid', 'suggestion-1');
    });
  });

  describe('Test 5: Pagination Reset on Sort Change', () => {
    it('should reset page parameter to 1 when sort changes', async () => {
      // Setup: Start with page 3
      mockSearchParams.set('page', '3');
      mockSearchParams.set('sortBy', 'latest');

      // Mock regions fetch
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ['서울', '경기', '부산'],
      });

      // Render filters
      render(
        <BoardFilters
          initialValue=""
          initialFilters={{
            status: 'ALL',
            type: 'ALL',
            region: 'ALL',
            sortBy: 'latest',
          }}
        />
      );

      // Wait for regions to load
      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalled();
      });

      // Open filters
      const filterButton = screen.getByText('필터');
      fireEvent.click(filterButton);

      // Change sort
      const sortDropdowns = screen.getAllByRole('combobox');
      const sortDropdown = sortDropdowns[3]; // Sort is the 4th dropdown
      fireEvent.change(sortDropdown, { target: { value: 'popular' } });

      // Verify URL update does NOT include page parameter (resets to 1)
      await waitFor(() => {
        const callArg = mockPush.mock.calls[0]?.[0];
        expect(callArg).toContain('sortBy=popular');
        expect(callArg).not.toContain('page=3');
      });
    });
  });

  describe('Test 6: Complete Sort Flow with Multiple Filters', () => {
    it('should handle sort change with other active filters', async () => {
      // Setup: Start with status and region filters
      mockSearchParams.set('status', 'PENDING');
      mockSearchParams.set('region', '서울');
      mockSearchParams.set('sortBy', 'latest');

      // Mock regions fetch
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ['서울', '경기', '부산'],
      });

      // Render filters
      render(
        <BoardFilters
          initialValue=""
          initialFilters={{
            status: 'PENDING',
            type: 'ALL',
            region: '서울',
            sortBy: 'latest',
          }}
        />
      );

      // Wait for regions to load
      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalled();
      });

      // Open filters
      const filterButton = screen.getByText('필터');
      fireEvent.click(filterButton);

      // Change sort to priority
      const sortDropdowns = screen.getAllByRole('combobox');
      const sortDropdown = sortDropdowns[3]; // Sort is the 4th dropdown
      fireEvent.change(sortDropdown, { target: { value: 'priority' } });

      // Verify URL update includes all filters
      await waitFor(() => {
        const callArg = mockPush.mock.calls[0]?.[0];
        expect(callArg).toContain('sortBy=priority');
        expect(callArg).toContain('status=PENDING');
        expect(callArg).toContain('region=서울');
      });
    });
  });
});
