# Implementation Plan: Board Post Edit Cache Invalidation

## Overview

This implementation plan addresses the cache invalidation issue by adding server-side cache invalidation using `revalidatePath` in the API route and client-side cache refresh using `router.refresh()` in the edit page. The changes are minimal and focused on ensuring users see their edits immediately while maintaining ISR performance benefits.

## Tasks

- [x] 1. Add server-side cache invalidation to API route
  - Modify the PUT handler in `/api/suggestions/[id]/route.ts`
  - Import `revalidatePath` from 'next/cache'
  - Call `revalidatePath` for both the detail page and board list after successful update
  - Wrap revalidation in try-catch to handle errors gracefully
  - Add logging for successful and failed cache invalidation
  - _Requirements: 1.1, 2.1, 2.2, 5.1, 5.3_

- [ ]* 1.1 Write unit tests for API route cache invalidation
  - Test that revalidatePath is called with correct paths
  - **Property 1: Cache Invalidation Paths**
  - **Validates: Requirements 1.1, 2.1, 2.2**

- [ ]* 1.2 Write unit tests for cache invalidation error handling
  - Test that errors are caught and logged
  - Test that PUT succeeds even when cache invalidation fails
  - **Property 2: Cache Invalidation Error Handling**
  - **Validates: Requirements 1.4, 5.1**

- [ ]* 1.3 Write unit tests for cache invalidation logging
  - Test that successful operations are logged
  - **Property 6: Successful Cache Invalidation Logging**
  - **Validates: Requirements 5.3**

- [x] 2. Add client-side cache refresh to edit page
  - Modify the handleSubmit function in `/board/[id]/edit/page.tsx`
  - Call `router.refresh()` after successful PUT response
  - Add a small delay (100ms) to ensure refresh completes
  - Ensure navigation happens after refresh
  - Add error handling to proceed with navigation even if refresh fails
  - _Requirements: 3.1, 3.4, 5.4_

- [ ]* 2.1 Write unit tests for router refresh sequence
  - Test that router.refresh() is called before router.push()
  - Test that delay is applied between refresh and navigation
  - **Property 3: Router Refresh Before Navigation**
  - **Validates: Requirements 3.1, 3.4**

- [ ]* 2.2 Write unit tests for router refresh error handling
  - Test that navigation proceeds even if refresh fails
  - **Property 4: Router Refresh Error Resilience**
  - **Validates: Requirements 5.4**

- [x] 3. Verify ISR configuration preservation
  - Confirm that `/board/[id]/page.tsx` still exports `revalidate = 60`
  - Confirm that the fetch call includes `next: { revalidate: 60 }`
  - Ensure no changes were made to the detail page component
  - _Requirements: 4.1_

- [ ]* 3.1 Write unit tests for ISR configuration
  - Test that revalidate export is set to 60
  - **Property 5: ISR Configuration Preservation**
  - **Validates: Requirements 4.1**

- [x] 4. Checkpoint - Test the cache invalidation flow
  - Manually test editing a post and verifying immediate updates
  - Test that other posts' caches are not affected
  - Test error scenarios (cache invalidation failures)
  - Ensure all unit tests pass
  - Ask the user if questions arise

- [ ]* 5. Write integration tests for end-to-end flow
  - Test complete edit flow from form submission to detail page display
  - Test that cache is invalidated for both detail page and board list
  - Test error scenarios and fallback behavior
  - _Requirements: 1.1, 1.2, 1.3, 3.1, 3.2_

- [x] 6. Final checkpoint - Verify all requirements
  - Run all tests and ensure they pass
  - Perform manual testing checklist
  - Verify metadata updates correctly
  - Ensure error handling works as expected
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster implementation
- The core changes are minimal: adding revalidatePath to API route and router.refresh() to edit page
- Error handling ensures the edit operation succeeds even if cache invalidation fails
- ISR configuration remains unchanged to maintain performance benefits
- Integration tests verify the complete flow but are optional for initial implementation
