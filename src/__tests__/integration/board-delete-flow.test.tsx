/**
 * Integration Test: Board Delete Flow
 * Feature: board-sort-cache-fix
 * 
 * Tests the end-to-end flow: click delete → API call → cache invalidation → redirect → fresh list
 * Validates Requirements: 2.1, 2.3, 2.4, 4.1
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SuggestionDetailClient from '@/app/(main)/board/[id]/SuggestionDetailClient';
import BoardList from '@/components/board/BoardList';
import type { Suggestion } from '@/features/board/types';

// Mock Next.js router
const mockPush = vi.fn();
const mockRefresh = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

// Mock dynamic imports
vi.mock('next/dynamic', () => ({
  default: (fn: any) => {
    const Component = () => <div data-testid="dynamic-component">Dynamic Component</div>;
    return Component;
  },
}));

// Mock Next.js Link
vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

// Mock SuggestionCard
vi.mock('@/app/(main)/board/SuggestionCard', () => ({
  default: ({ suggestion }: { suggestion: Suggestion }) => (
    <div data-testid={`suggestion-${suggestion.id}`}>
      <h3>{suggestion.title}</h3>
    </div>
  ),
}));

describe('Integration Test: Board Delete Flow', () => {
  let fetchMock: any;
  let confirmMock: any;
  let alertMock: any;

  const mockSuggestion: Suggestion = {
    id: 1,
    title: 'Test Suggestion',
    content: 'Test Content',
    location_lat: 37.5,
    location_lon: 127.0,
    address: '서울특별시 강남구 테스트동',
    sido: '서울특별시',
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
    user: { id: 1, name: 'Test User' },
    is_liked: false,
  };

  const mockSuggestionsList: Suggestion[] = [
    mockSuggestion,
    {
      id: 2,
      title: 'Another Suggestion',
      content: 'Another Content',
      location_lat: 37.5,
      location_lon: 127.0,
      address: '서울특별시 서초구 테스트동',
      sido: '서울특별시',
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
      user: { id: 2, name: 'Another User' },
      is_liked: false,
    },
  ];

  beforeEach(() => {
    fetchMock = vi.fn();
    global.fetch = fetchMock;
    
    confirmMock = vi.fn();
    global.confirm = confirmMock;
    
    alertMock = vi.fn();
    global.alert = alertMock;
    
    mockPush.mockClear();
    mockRefresh.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Test 1: Successful Delete Flow', () => {
    it('should delete suggestion and redirect to board with cache-busting parameter', async () => {
      // Setup: Mock successful delete
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: '건의사항이 삭제되었습니다.' }),
      });

      // Mock user confirmation
      confirmMock.mockReturnValue(true);

      // Render detail page
      render(<SuggestionDetailClient suggestion={mockSuggestion} />);

      // Find and click delete button
      const deleteButton = screen.getByText('삭제');
      fireEvent.click(deleteButton);

      // Verify confirmation dialog was shown
      expect(confirmMock).toHaveBeenCalledWith('정말 이 건의사항을 삭제하시겠습니까?');

      // Verify DELETE API call
      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(
          '/api/suggestions/1',
          expect.objectContaining({
            method: 'DELETE',
            credentials: 'include',
          })
        );
      });

      // Verify success alert
      expect(alertMock).toHaveBeenCalledWith('건의사항이 삭제되었습니다.');

      // Verify redirect with cache-busting parameter
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(expect.stringMatching(/^\/board\?refresh=\d+$/));
      });
    });

    it('should show updated list without deleted suggestion after redirect', async () => {
      // Simulate the list after deletion (suggestion 1 removed)
      const listAfterDeletion = mockSuggestionsList.filter(s => s.id !== 1);

      render(<BoardList suggestions={listAfterDeletion} />);

      // Verify deleted suggestion is not in the list
      expect(screen.queryByTestId('suggestion-1')).not.toBeInTheDocument();

      // Verify remaining suggestion is still there
      expect(screen.getByTestId('suggestion-2')).toBeInTheDocument();
      expect(screen.getByText('Another Suggestion')).toBeInTheDocument();
    });
  });

  describe('Test 2: Delete Cancellation', () => {
    it('should not delete when user cancels confirmation', async () => {
      // Mock user cancellation
      confirmMock.mockReturnValue(false);

      // Render detail page
      render(<SuggestionDetailClient suggestion={mockSuggestion} />);

      // Find and click delete button
      const deleteButton = screen.getByText('삭제');
      fireEvent.click(deleteButton);

      // Verify confirmation dialog was shown
      expect(confirmMock).toHaveBeenCalledWith('정말 이 건의사항을 삭제하시겠습니까?');

      // Verify NO API call was made
      expect(fetchMock).not.toHaveBeenCalled();

      // Verify NO redirect
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('Test 3: Delete Error Handling', () => {
    it('should show error message when delete fails', async () => {
      // Setup: Mock failed delete
      fetchMock.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: '삭제 권한이 없습니다.' }),
      });

      // Mock user confirmation
      confirmMock.mockReturnValue(true);

      // Render detail page
      render(<SuggestionDetailClient suggestion={mockSuggestion} />);

      // Find and click delete button
      const deleteButton = screen.getByText('삭제');
      fireEvent.click(deleteButton);

      // Verify DELETE API call
      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(
          '/api/suggestions/1',
          expect.objectContaining({
            method: 'DELETE',
          })
        );
      });

      // Verify error alert
      await waitFor(() => {
        expect(alertMock).toHaveBeenCalledWith('삭제 권한이 없습니다.');
      });

      // Verify NO redirect on error
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should handle network error during delete', async () => {
      // Setup: Mock network error
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      // Mock user confirmation
      confirmMock.mockReturnValue(true);

      // Render detail page
      render(<SuggestionDetailClient suggestion={mockSuggestion} />);

      // Find and click delete button
      const deleteButton = screen.getByText('삭제');
      fireEvent.click(deleteButton);

      // Verify error alert
      await waitFor(() => {
        expect(alertMock).toHaveBeenCalledWith('삭제 중 오류가 발생했습니다.');
      });

      // Verify NO redirect on error
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('Test 4: Cache Invalidation Verification', () => {
    it('should use cache-busting parameter in redirect URL', async () => {
      // Setup: Mock successful delete
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: '건의사항이 삭제되었습니다.' }),
      });

      // Mock user confirmation
      confirmMock.mockReturnValue(true);

      // Render detail page
      render(<SuggestionDetailClient suggestion={mockSuggestion} />);

      // Find and click delete button
      const deleteButton = screen.getByText('삭제');
      fireEvent.click(deleteButton);

      // Verify redirect includes timestamp for cache-busting
      await waitFor(() => {
        const callArg = mockPush.mock.calls[0]?.[0];
        expect(callArg).toMatch(/^\/board\?refresh=\d+$/);
        
        // Extract timestamp and verify it's recent
        const timestamp = parseInt(callArg.split('=')[1]);
        const now = Date.now();
        expect(timestamp).toBeGreaterThan(now - 5000); // Within last 5 seconds
        expect(timestamp).toBeLessThanOrEqual(now);
      });
    });
  });

  describe('Test 5: Multiple Deletions', () => {
    it('should handle sequential deletions correctly', async () => {
      // First deletion
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: '건의사항이 삭제되었습니다.' }),
      });

      confirmMock.mockReturnValue(true);

      const { unmount } = render(<SuggestionDetailClient suggestion={mockSuggestion} />);

      const deleteButton = screen.getByText('삭제');
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledTimes(1);
      });

      unmount();

      // Second deletion (different suggestion)
      const secondSuggestion = { ...mockSuggestionsList[1] };
      
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: '건의사항이 삭제되었습니다.' }),
      });

      render(<SuggestionDetailClient suggestion={secondSuggestion} />);

      const deleteButton2 = screen.getByText('삭제');
      fireEvent.click(deleteButton2);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledTimes(2);
      });

      // Verify both redirects used cache-busting
      expect(mockPush.mock.calls[0][0]).toMatch(/^\/board\?refresh=\d+$/);
      expect(mockPush.mock.calls[1][0]).toMatch(/^\/board\?refresh=\d+$/);
    });
  });

  describe('Test 6: Delete with Active Filters', () => {
    it('should redirect to board root regardless of previous filters', async () => {
      // Setup: Mock successful delete
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: '건의사항이 삭제되었습니다.' }),
      });

      confirmMock.mockReturnValue(true);

      // Render detail page
      render(<SuggestionDetailClient suggestion={mockSuggestion} />);

      // Find and click delete button
      const deleteButton = screen.getByText('삭제');
      fireEvent.click(deleteButton);

      // Verify redirect goes to /board (not preserving filters)
      await waitFor(() => {
        const callArg = mockPush.mock.calls[0]?.[0];
        expect(callArg).toMatch(/^\/board\?refresh=\d+$/);
        // Should NOT contain other filter parameters
        expect(callArg).not.toContain('status=');
        expect(callArg).not.toContain('type=');
        expect(callArg).not.toContain('sortBy=');
      });
    });
  });
});
