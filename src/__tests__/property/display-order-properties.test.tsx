/**
 * Property-Based Tests for Display Order
 * Feature: board-sort-cache-fix
 * 
 * Tests universal properties about how suggestions are displayed after sorting,
 * deletion, and updates.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import fc from 'fast-check';
import type { Suggestion } from '@/features/board/types';
import BoardList from '@/components/board/BoardList';

// Mock Next.js Link component
vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

// Mock child components to simplify testing
vi.mock('@/app/(main)/board/SuggestionCard', () => ({
  default: ({ suggestion }: { suggestion: Suggestion }) => (
    <div data-testid={`suggestion-${suggestion.id}`} data-title={suggestion.title}>
      <h3>{suggestion.title}</h3>
      <span data-testid={`like-count-${suggestion.id}`}>{suggestion.like_count}</span>
      <span data-testid={`priority-${suggestion.id}`}>{suggestion.priority_score}</span>
      <span data-testid={`status-${suggestion.id}`}>{suggestion.status}</span>
      <span data-testid={`created-${suggestion.id}`}>{suggestion.created_at}</span>
    </div>
  ),
}));

// Helper to generate suggestion arbitrary with unique IDs
const suggestionArbitrary = () => fc.record({
  title: fc.string({ minLength: 5, maxLength: 50 }).filter(s => s.trim().length > 0),
  content: fc.string({ minLength: 10, maxLength: 200 }).filter(s => s.trim().length > 0),
  location_lat: fc.double({ min: 33, max: 38 }),
  location_lon: fc.double({ min: 126, max: 130 }),
  address: fc.string({ minLength: 10, maxLength: 100 }),
  sido: fc.constantFrom('서울', '경기', '부산', '대구'),
  sigungu: fc.string({ minLength: 3, maxLength: 20 }),
  suggestion_type: fc.constantFrom('SIGNAL', 'CROSSWALK', 'FACILITY'),
  status: fc.constantFrom('PENDING', 'REVIEWING', 'APPROVED', 'REJECTED', 'COMPLETED'),
  priority_score: fc.integer({ min: 0, max: 100 }),
  like_count: fc.integer({ min: 0, max: 1000 }),
  view_count: fc.integer({ min: 0, max: 5000 }),
  created_at: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2025-12-31').getTime() }).map(t => new Date(t).toISOString()),
  updated_at: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2025-12-31').getTime() }).map(t => new Date(t).toISOString()),
  user_id: fc.integer({ min: 1, max: 1000 }),
  user: fc.record({
    id: fc.integer({ min: 1, max: 1000 }),
    name: fc.string({ minLength: 2, maxLength: 20 }),
  }),
  comment_count: fc.integer({ min: 0, max: 100 }),
});

// Helper to generate array of suggestions with unique sequential IDs
const suggestionsWithUniqueIds = (minLength: number, maxLength: number) =>
  fc.array(suggestionArbitrary(), { minLength, maxLength }).map((suggestions) =>
    suggestions.map((suggestion, i) => ({ ...suggestion, id: i + 1 }))
  );

describe('Display Order Properties', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Feature: board-sort-cache-fix, Property 3: Sorted data display order
  describe('Property 3: Sorted data display order', () => {
    it('should display suggestions in descending order by creation date for "latest" sort', () => {
      fc.assert(
        fc.property(
          suggestionsWithUniqueIds(2, 10),
          (suggestions) => {
            // Sort by created_at descending (latest first)
            const sorted = [...suggestions].sort((a, b) => 
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );

            const { container } = render(<BoardList suggestions={sorted} />);

            // Get all rendered suggestion elements in order
            const renderedIds = Array.from(container.querySelectorAll('[data-testid^="suggestion-"]'))
              .map(el => parseInt(el.getAttribute('data-testid')!.replace('suggestion-', '')));

            // Verify the order matches the sorted order
            const expectedIds = sorted.map(s => s.id);
            expect(renderedIds).toEqual(expectedIds);

            // Verify dates are in descending order
            for (let i = 0; i < sorted.length - 1; i++) {
              const current = new Date(sorted[i].created_at).getTime();
              const next = new Date(sorted[i + 1].created_at).getTime();
              expect(current).toBeGreaterThanOrEqual(next);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should display suggestions in descending order by like count for "popular" sort', () => {
      fc.assert(
        fc.property(
          suggestionsWithUniqueIds(2, 10),
          (suggestions) => {
            // Sort by like_count descending (popular first)
            const sorted = [...suggestions].sort((a, b) => b.like_count - a.like_count);

            const { container } = render(<BoardList suggestions={sorted} />);

            // Get all rendered suggestion elements in order
            const renderedIds = Array.from(container.querySelectorAll('[data-testid^="suggestion-"]'))
              .map(el => parseInt(el.getAttribute('data-testid')!.replace('suggestion-', '')));

            // Verify the order matches the sorted order
            const expectedIds = sorted.map(s => s.id);
            expect(renderedIds).toEqual(expectedIds);

            // Verify like counts are in descending order
            for (let i = 0; i < sorted.length - 1; i++) {
              expect(sorted[i].like_count).toBeGreaterThanOrEqual(sorted[i + 1].like_count);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should display suggestions in descending order by priority score for "priority" sort', () => {
      fc.assert(
        fc.property(
          suggestionsWithUniqueIds(2, 10),
          (suggestions) => {
            // Sort by priority_score descending (highest priority first)
            const sorted = [...suggestions].sort((a, b) => b.priority_score - a.priority_score);

            const { container } = render(<BoardList suggestions={sorted} />);

            // Get all rendered suggestion elements in order
            const renderedIds = Array.from(container.querySelectorAll('[data-testid^="suggestion-"]'))
              .map(el => parseInt(el.getAttribute('data-testid')!.replace('suggestion-', '')));

            // Verify the order matches the sorted order
            const expectedIds = sorted.map(s => s.id);
            expect(renderedIds).toEqual(expectedIds);

            // Verify priority scores are in descending order
            for (let i = 0; i < sorted.length - 1; i++) {
              expect(sorted[i].priority_score).toBeGreaterThanOrEqual(sorted[i + 1].priority_score);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should display suggestions in alphabetical order by status for "status" sort', () => {
      fc.assert(
        fc.property(
          suggestionsWithUniqueIds(2, 10),
          (suggestions) => {
            // Sort by status alphabetically ascending
            const sorted = [...suggestions].sort((a, b) => a.status.localeCompare(b.status));

            const { container } = render(<BoardList suggestions={sorted} />);

            // Get all rendered suggestion elements in order
            const renderedIds = Array.from(container.querySelectorAll('[data-testid^="suggestion-"]'))
              .map(el => parseInt(el.getAttribute('data-testid')!.replace('suggestion-', '')));

            // Verify the order matches the sorted order
            const expectedIds = sorted.map(s => s.id);
            expect(renderedIds).toEqual(expectedIds);

            // Verify statuses are in alphabetical order
            for (let i = 0; i < sorted.length - 1; i++) {
              expect(sorted[i].status.localeCompare(sorted[i + 1].status)).toBeLessThanOrEqual(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

  // Feature: board-sort-cache-fix, Property 6: Deleted suggestion not in list
  describe('Property 6: Deleted suggestion not in list', () => {
    it('should not display a deleted suggestion in the rendered list', () => {
      fc.assert(
        fc.property(
          suggestionsWithUniqueIds(3, 10),
          fc.integer({ min: 0, max: 9 }),
          (suggestions, deleteIndex) => {
            // Ensure we have a valid index
            const actualIndex = deleteIndex % suggestions.length;
            const deletedId = suggestions[actualIndex].id;

            // Simulate deletion by filtering out the deleted suggestion
            const remainingSuggestions = suggestions.filter(s => s.id !== deletedId);

            const { container } = render(<BoardList suggestions={remainingSuggestions} />);

            // Get all rendered suggestion IDs
            const renderedIds = Array.from(container.querySelectorAll('[data-testid^="suggestion-"]'))
              .map(el => parseInt(el.getAttribute('data-testid')!.replace('suggestion-', '')));

            // Verify the deleted ID is not in the rendered list
            expect(renderedIds).not.toContain(deletedId);

            // Verify all remaining suggestions are rendered
            const expectedIds = remainingSuggestions.map(s => s.id);
            expect(renderedIds).toEqual(expectedIds);

            // Verify the count is correct
            expect(renderedIds.length).toBe(suggestions.length - 1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle deletion of multiple suggestions', () => {
      fc.assert(
        fc.property(
          suggestionsWithUniqueIds(5, 10),
          fc.array(fc.integer({ min: 0, max: 9 }), { minLength: 1, maxLength: 3 }),
          (suggestions, deleteIndices) => {
            // Get unique valid indices
            const validIndices = [...new Set(deleteIndices.map(i => i % suggestions.length))];
            const deletedIds = validIndices.map(i => suggestions[i].id);

            // Simulate deletion by filtering out deleted suggestions
            const remainingSuggestions = suggestions.filter(s => !deletedIds.includes(s.id));

            const { container } = render(<BoardList suggestions={remainingSuggestions} />);

            // Get all rendered suggestion IDs
            const renderedIds = Array.from(container.querySelectorAll('[data-testid^="suggestion-"]'))
              .map(el => parseInt(el.getAttribute('data-testid')!.replace('suggestion-', '')));

            // Verify none of the deleted IDs are in the rendered list
            deletedIds.forEach(deletedId => {
              expect(renderedIds).not.toContain(deletedId);
            });

            // Verify all remaining suggestions are rendered
            const expectedIds = remainingSuggestions.map(s => s.id);
            expect(renderedIds).toEqual(expectedIds);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: board-sort-cache-fix, Property 7: Updated content displayed
  describe('Property 7: Updated content displayed', () => {
    it('should display updated title and content for a suggestion', () => {
      fc.assert(
        fc.property(
          suggestionsWithUniqueIds(3, 10),
          fc.integer({ min: 0, max: 9 }),
          fc.string({ minLength: 5, maxLength: 50 }).filter(s => s.trim().length > 0),
          fc.string({ minLength: 10, maxLength: 200 }).filter(s => s.trim().length > 0),
          (suggestions, updateIndex, newTitle, newContent) => {
            // Ensure we have a valid index
            const actualIndex = updateIndex % suggestions.length;
            const updatedId = suggestions[actualIndex].id;

            // Simulate update by modifying the suggestion
            const updatedSuggestions = suggestions.map((s, i) => 
              i === actualIndex 
                ? { ...s, title: newTitle, content: newContent }
                : s
            );

            const { container } = render(<BoardList suggestions={updatedSuggestions} />);

            // Find the updated suggestion element
            const updatedElement = container.querySelector(`[data-testid="suggestion-${updatedId}"]`);
            expect(updatedElement).toBeInTheDocument();

            // Verify the updated title is displayed (HTML normalizes whitespace)
            const titleElement = updatedElement?.querySelector('h3');
            const normalizedTitle = newTitle.replace(/\s+/g, ' ').trim();
            expect(titleElement?.textContent?.replace(/\s+/g, ' ').trim()).toBe(normalizedTitle);

            // Verify the updated content is in the data attribute
            expect(updatedElement?.getAttribute('data-title')).toBe(newTitle);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should display updated like count for a suggestion', () => {
      fc.assert(
        fc.property(
          suggestionsWithUniqueIds(3, 10),
          fc.integer({ min: 0, max: 9 }),
          fc.integer({ min: 0, max: 1000 }),
          (suggestions, updateIndex, newLikeCount) => {
            // Ensure we have a valid index
            const actualIndex = updateIndex % suggestions.length;
            const updatedId = suggestions[actualIndex].id;

            // Simulate update by modifying the like count
            const updatedSuggestions = suggestions.map((s, i) => 
              i === actualIndex 
                ? { ...s, like_count: newLikeCount }
                : s
            );

            const { container } = render(<BoardList suggestions={updatedSuggestions} />);

            // Find the like count element for the updated suggestion
            const likeCountElement = container.querySelector(`[data-testid="like-count-${updatedId}"]`);
            expect(likeCountElement).toBeInTheDocument();
            expect(likeCountElement).toHaveTextContent(newLikeCount.toString());
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should display updated priority score for a suggestion', () => {
      fc.assert(
        fc.property(
          suggestionsWithUniqueIds(3, 10),
          fc.integer({ min: 0, max: 9 }),
          fc.integer({ min: 0, max: 100 }),
          (suggestions, updateIndex, newPriorityScore) => {
            // Ensure we have a valid index
            const actualIndex = updateIndex % suggestions.length;
            const updatedId = suggestions[actualIndex].id;

            // Simulate update by modifying the priority score
            const updatedSuggestions = suggestions.map((s, i) => 
              i === actualIndex 
                ? { ...s, priority_score: newPriorityScore }
                : s
            );

            const { container } = render(<BoardList suggestions={updatedSuggestions} />);

            // Find the priority score element for the updated suggestion
            const priorityElement = container.querySelector(`[data-testid="priority-${updatedId}"]`);
            expect(priorityElement).toBeInTheDocument();
            expect(priorityElement).toHaveTextContent(newPriorityScore.toString());
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should display updated status for a suggestion', () => {
      fc.assert(
        fc.property(
          suggestionsWithUniqueIds(3, 10),
          fc.integer({ min: 0, max: 9 }),
          fc.constantFrom('PENDING', 'REVIEWING', 'APPROVED', 'REJECTED', 'COMPLETED'),
          (suggestions, updateIndex, newStatus) => {
            // Ensure we have a valid index
            const actualIndex = updateIndex % suggestions.length;
            const updatedId = suggestions[actualIndex].id;

            // Simulate update by modifying the status
            const updatedSuggestions = suggestions.map((s, i) => 
              i === actualIndex 
                ? { ...s, status: newStatus }
                : s
            );

            const { container } = render(<BoardList suggestions={updatedSuggestions} />);

            // Find the status element for the updated suggestion
            const statusElement = container.querySelector(`[data-testid="status-${updatedId}"]`);
            expect(statusElement).toBeInTheDocument();
            expect(statusElement).toHaveTextContent(newStatus);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should display multiple updated fields simultaneously', () => {
      fc.assert(
        fc.property(
          suggestionsWithUniqueIds(3, 10),
          fc.integer({ min: 0, max: 9 }),
          fc.record({
            title: fc.string({ minLength: 5, maxLength: 50 }).filter(s => s.trim().length > 0),
            content: fc.string({ minLength: 10, maxLength: 200 }).filter(s => s.trim().length > 0),
            like_count: fc.integer({ min: 0, max: 1000 }),
            priority_score: fc.integer({ min: 0, max: 100 }),
            status: fc.constantFrom('PENDING', 'REVIEWING', 'APPROVED', 'REJECTED', 'COMPLETED'),
          }),
          (suggestions, updateIndex, updates) => {
            // Ensure we have a valid index
            const actualIndex = updateIndex % suggestions.length;
            const updatedId = suggestions[actualIndex].id;

            // Simulate update by modifying multiple fields
            const updatedSuggestions = suggestions.map((s, i) => 
              i === actualIndex 
                ? { ...s, ...updates }
                : s
            );

            const { container } = render(<BoardList suggestions={updatedSuggestions} />);

            // Verify all updated fields are displayed correctly
            const updatedElement = container.querySelector(`[data-testid="suggestion-${updatedId}"]`);
            expect(updatedElement).toBeInTheDocument();

            // Check title (HTML normalizes whitespace)
            const titleElement = updatedElement?.querySelector('h3');
            const normalizedTitle = updates.title.replace(/\s+/g, ' ').trim();
            expect(titleElement?.textContent?.replace(/\s+/g, ' ').trim()).toBe(normalizedTitle);

            // Check like count
            const likeCountElement = container.querySelector(`[data-testid="like-count-${updatedId}"]`);
            expect(likeCountElement).toHaveTextContent(updates.like_count.toString());

            // Check priority score
            const priorityElement = container.querySelector(`[data-testid="priority-${updatedId}"]`);
            expect(priorityElement).toHaveTextContent(updates.priority_score.toString());

            // Check status
            const statusElement = container.querySelector(`[data-testid="status-${updatedId}"]`);
            expect(statusElement).toHaveTextContent(updates.status);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
