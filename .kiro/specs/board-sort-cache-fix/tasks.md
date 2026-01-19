# Implementation Plan: Board Sort and Cache Fix

## Overview

This implementation plan addresses cache invalidation and UI update issues in the Next.js board/suggestions feature. The approach focuses on:

1. Adding proper cache invalidation after mutations (delete, update)
2. Ensuring sort parameter changes trigger fresh data fetches
3. Implementing cache-busting navigation strategies
4. Adding comprehensive tests for cache behavior and sorting

The implementation is organized to fix the most critical issues first (deletion cache invalidation), then sorting, then comprehensive testing.

## Tasks

- [x] 1. Fix cache invalidation for DELETE operations
  - [x] 1.1 Add revalidatePath to DELETE endpoint
    - Import `revalidatePath` from `next/cache` in `/api/suggestions/[id]/route.ts`
    - Call `revalidatePath('/board', 'page')` after successful deletion
    - Call `revalidatePath('/board/[id]', 'page')` with the deleted suggestion ID
    - Wrap cache invalidation in try-catch block to handle errors gracefully
    - Add console logging for success and error cases
    - _Requirements: 2.1, 2.5, 6.1, 6.2_
  
  - [x] 1.2 Update client-side delete handler with cache-busting navigation
    - Modify `handleDeleteSuggestion` in `SuggestionDetailClient.tsx`
    - Change `router.push('/board')` to `router.push('/board?refresh=' + Date.now())`
    - Add comment explaining cache-busting strategy
    - _Requirements: 4.1, 8.1_
  
  - [ ]* 1.3 Write unit tests for DELETE cache invalidation
    - Test that revalidatePath is called with correct paths after deletion
    - Test that cache invalidation errors are caught and logged
    - Test that API returns success even if cache invalidation fails
    - _Requirements: 2.1, 6.1, 6.2_

- [x] 2. Fix cache invalidation for UPDATE operations
  - [x] 2.1 Add revalidatePath to PUT endpoint
    - Verify `revalidatePath` is already imported in `/api/suggestions/[id]/route.ts`
    - Ensure revalidatePath is called for both `/board` and `/board/[id]` after updates
    - Verify try-catch error handling is in place
    - _Requirements: 3.1_
  
  - [ ]* 2.2 Write unit tests for UPDATE cache invalidation
    - Test that revalidatePath is called with correct paths after update
    - Test error handling for cache invalidation failures
    - _Requirements: 3.1_

- [x] 3. Enhance server-side data fetching with cache tags
  - [x] 3.1 Add cache tags to board page data fetching
    - Modify `getSuggestions` function in `board/page.tsx`
    - Add `tags: ['suggestions-list']` to the fetch options
    - Ensure all URL parameters are included in the fetch URL (verify existing implementation)
    - Add comments explaining ISR caching strategy
    - _Requirements: 1.2, 4.2_
  
  - [ ]* 3.2 Write property test for URL parameters in fetch
    - **Property 5: URL parameters used in data fetching**
    - **Validates: Requirements 1.2, 4.2**
    - Generate random combinations of URL parameters
    - Verify all parameters are included in the fetch URL
    - Use fast-check with minimum 100 iterations

- [x] 4. Implement and test sort parameter handling
  - [x] 4.1 Create sort parameter transformation utility
    - Create `src/lib/sortTransform.ts` with `transformSortParameter` function
    - Map frontend sort values to Spring Data format:
      - latest → createdAt,desc
      - popular → likeCount,desc
      - priority → priorityScore,desc
      - status → status,asc
    - Export function for use in API route
    - _Requirements: 1.3_
  
  - [x] 4.2 Update API route to use sort transformation utility
    - Import `transformSortParameter` in `/api/suggestions/route.ts`
    - Replace inline sort transformation with utility function call
    - Maintain backward compatibility with existing sort logic
    - _Requirements: 1.3_
  
  - [ ]* 4.3 Write property test for sort parameter transformation
    - **Property 2: Sort parameter transformation**
    - **Validates: Requirements 1.3**
    - Test all sort values (latest, popular, priority, status)
    - Verify correct Spring Data format is produced
    - Use fast-check with minimum 100 iterations
  
  - [ ]* 4.4 Write property test for sort URL synchronization
    - **Property 1: Sort parameter URL synchronization**
    - **Validates: Requirements 1.1**
    - Test that dropdown changes update URL with correct sortBy parameter
    - Test all sort options
    - Use fast-check with minimum 100 iterations
  
  - [ ]* 4.5 Write property test for pagination reset on sort change
    - **Property 4: Pagination reset on sort change**
    - **Validates: Requirements 1.5**
    - Test that changing sort resets page parameter to 1
    - Test across all sort option changes
    - Use fast-check with minimum 100 iterations

- [x] 5. Checkpoint - Ensure core functionality works
  - Manually test deletion flow: delete a post and verify it disappears from list
  - Manually test sorting: change sort order and verify list updates
  - Run all tests and ensure they pass
  - Ask the user if questions arise

- [x] 6. Implement sort dropdown state synchronization
  - [x] 6.1 Verify BoardFilters reflects URL parameters
    - Review `BoardFilters.tsx` to ensure dropdown value is set from `initialFilters.sortBy`
    - Verify that `initialFilters` comes from URL search params
    - Add default value handling for missing sortBy parameter
    - _Requirements: 5.2, 5.3, 5.4_
  
  - [ ]* 6.2 Write property test for dropdown reflecting URL
    - **Property 8: Sort dropdown reflects URL parameter**
    - **Validates: Requirements 5.2, 5.3**
    - Test that dropdown displays correct option for each sortBy URL value
    - Use fast-check with minimum 100 iterations
  
  - [ ]* 6.3 Write unit test for default sort value
    - Test that when no sortBy parameter exists, system defaults to "latest"
    - _Requirements: 5.4_

- [x] 7. Implement comprehensive display order testing
  - [x]* 7.1 Write property test for sorted data display order
    - **Property 3: Sorted data display order**
    - **Validates: Requirements 1.4**
    - Generate random suggestion lists
    - Apply each sort option
    - Verify displayed order matches sort criterion
    - Use fast-check with minimum 100 iterations
  
  - [x] 7.2 Write property test for deleted suggestion not in list

    - **Property 6: Deleted suggestion not in list**
    - **Validates: Requirements 2.4**
    - Generate random suggestion lists
    - Delete a random suggestion
    - Verify deleted ID is not in rendered list
    - Use fast-check with minimum 100 iterations
  
  - [x] 7.3 Write property test for updated content displayed

    - **Property 7: Updated content displayed**
    - **Validates: Requirements 3.2, 3.3**
    - Generate random suggestions
    - Update random fields
    - Verify displayed content matches updated values
    - Use fast-check with minimum 100 iterations

- [x] 8. Implement optimistic UI updates and error handling
  - [x] 8.1 Review and enhance like button optimistic update
    - Review existing optimistic update in `SuggestionCard.tsx`
    - Ensure rollback on error is implemented
    - Add error message display on failure
    - _Requirements: 7.1, 7.4_
  
  - [x] 8.2 Review and enhance comment optimistic updates
    - Review existing comment submission in `SuggestionDetailClient.tsx`
    - Ensure optimistic comment addition is implemented
    - Verify rollback on error
    - _Requirements: 7.3, 7.4_
  
  - [ ]* 8.3 Write unit tests for optimistic updates
    - Test like button optimistic update and rollback
    - Test comment optimistic update and rollback
    - Test error message display on failures
    - _Requirements: 7.1, 7.3, 7.4_

- [x] 9. Add integration tests for end-to-end flows
  - [x]* 9.1 Write integration test for sort flow
    - Test: select dropdown → URL update → fetch → render
    - Mock API responses with sorted data
    - Verify UI displays data in correct order
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  
  - [x]* 9.2 Write integration test for delete flow
    - Test: click delete → API call → cache invalidation → redirect → fresh list
    - Mock API responses
    - Verify deleted item not in list after redirect
    - _Requirements: 2.1, 2.3, 2.4, 4.1_
  
  - [x]* 9.3 Write integration test for update flow
    - Test: edit suggestion → save → cache invalidation → view updated content
    - Mock API responses
    - Verify updated content appears in list and detail page
    - _Requirements: 3.1, 3.2, 3.3_

- [x] 10. Final checkpoint and documentation
  - Run full test suite and ensure all tests pass
  - Verify manual testing of all flows (sort, delete, update)
  - Add inline code comments explaining cache strategies
  - Update any relevant documentation
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties with minimum 100 iterations
- Unit tests validate specific examples and edge cases
- Integration tests validate end-to-end user flows
- All property tests should include the tag: `// Feature: board-sort-cache-fix, Property {number}: {property_text}`
