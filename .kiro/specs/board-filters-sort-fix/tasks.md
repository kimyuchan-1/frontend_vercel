# Implementation Plan: Board Filters Sort Fix

## Overview

This implementation plan fixes the parameter name mismatch in the board filters sorting functionality by standardizing on `sortBy` as the parameter name throughout the codebase. Since the FilterState interface and BoardFilters component already use `sortBy`, we will update the Board page component to read from `sortBy` URL parameter and pass it to the API with the correct parameter name.

## Tasks

- [x] 1. Update Board page component PageProps interface
  - Modify `src/app/(main)/board/page.tsx` PageProps interface to use `sortBy` instead of `sort`
  - Change `sort?: string;` to `sortBy?: string;` in the searchParams type
  - _Requirements: 1.1, 1.4_

- [x] 2. Update getSuggestions function parameter type
  - [x] 2.1 Update function parameter interface to use `sortBy`
    - Change `sort?: string;` to `sortBy?: string;` in the params type
    - _Requirements: 1.5_
  
  - [x] 2.2 Update API request construction to use `sortBy` parameter
    - Change `sort: params.sort || 'latest'` to `sortBy: params.sortBy || 'latest'`
    - This ensures the API receives the correct parameter name
    - _Requirements: 1.5_
  
  - [ ]* 2.3 Write unit test for default sort behavior
    - Test that when no sortBy parameter is provided, the system defaults to 'latest'
    - _Requirements: 2.3_

- [x] 3. Update initialFilters prop in BoardFilters component
  - [x] 3.1 Update the sortBy property to read from correct URL parameter
    - Change `sortBy: params.sort || 'latest'` to `sortBy: params.sortBy || 'latest'`
    - _Requirements: 1.2, 1.3, 1.4_
  
  - [ ]* 3.2 Write integration test for filter combinations
    - **Property 3: Filter Integration Preservation**
    - **Validates: Requirements 3.1**
    - Test that sortBy works correctly with other filters (status, type, region, search)

- [x] 4. Checkpoint - Verify basic functionality
  - Test the sorting functionality manually in the browser
  - Verify URL updates with `sortBy` parameter when sort option is changed
  - Ensure all tests pass, ask the user if questions arise.

- [ ]* 5. Write property-based tests for sorting behavior
  - [ ]* 5.1 Write property test for sortBy parameter URL updates
    - **Property 1: Sort Parameter URL Updates**
    - **Validates: Requirements 2.1**
    - Generate random sort values and verify URL updates correctly with `sortBy` parameter
  
  - [ ]* 5.2 Write property test for sort ordering correctness
    - **Property 2: Sort Values Produce Correct Ordering**
    - **Validates: Requirements 2.2, 2.4**
    - Generate random sortBy values and verify results are correctly ordered
  
  - [ ]* 5.3 Write property test for pagination integration
    - **Property 4: Pagination Integration Preservation**
    - **Validates: Requirements 3.2**
    - Generate random page numbers with sortBy and verify pagination works
  
  - [ ]* 5.4 Write property test for page reset behavior
    - **Property 5: Page Reset on Filter Change**
    - **Validates: Requirements 3.3**
    - Generate random filter changes from non-first pages and verify page reset

- [x] 6. Final checkpoint - Ensure all tests pass
  - Run all tests and verify they pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster implementation
- The core fix involves updating the Board page component to use `sortBy` consistently
- FilterState interface and BoardFilters component already use `sortBy` correctly - no changes needed
- The main changes are in `src/app/(main)/board/page.tsx`:
  1. PageProps interface: `sort` → `sortBy`
  2. getSuggestions params: `sort` → `sortBy`
  3. API request construction: `sort: params.sort` → `sortBy: params.sortBy`
  4. initialFilters prop: `sortBy: params.sort` → `sortBy: params.sortBy`
- Property-based tests provide comprehensive validation but are optional
- All changes maintain backward compatibility with existing functionality
