# Implementation Plan: Dashboard KPI Error Fix

## Overview

This implementation plan fixes the dashboard KPI data fetching error by simplifying the architecture to have the server component communicate directly with the backend API, implementing comprehensive error handling, and providing clear user feedback when data is unavailable. The key focus is on properly forwarding authentication cookies to resolve the current 401 Unauthorized errors.

## Tasks

- [x] 1. Update server component to fetch KPI data directly from backend
  - Modify `getKPIData()` function in `src/app/(main)/dashboard/page.tsx`
  - Add environment variable validation for NEXT_PUBLIC_BASE_URL
  - Retrieve cookies using Next.js `cookies()` function
  - Format cookies as Cookie header string
  - Create axios instance with proper configuration (baseURL, timeout, headers)
  - Make direct request to backend API at `/api/dashboard/kpi`
  - Handle all error types: network, timeout, HTTP (including 401), parsing
  - Log detailed error information with timestamps
  - Return fallback data on any error without throwing exceptions
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 4.1, 5.1, 5.2, 5.3, 5.4, 5.5, 7.1, 7.2, 7.3_

- [ ]* 1.1 Write property test for error resilience
  - **Property 1: Error Resilience**
  - **Validates: Requirements 2.1, 2.3, 2.4, 4.1**
  - Generate random error conditions (network, timeout, HTTP errors, parsing errors)
  - Verify fallback data is returned for all error types
  - Verify no exceptions are thrown
  - Run 100 iterations

- [ ]* 1.2 Write property test for comprehensive error logging
  - **Property 2: Comprehensive Error Logging**
  - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**
  - Generate various error scenarios
  - Verify logs include error type, URL, status code, message, and timestamp
  - Run 100 iterations

- [ ]* 1.3 Write unit tests for environment validation
  - Test valid NEXT_PUBLIC_BASE_URL is accepted
  - Test missing NEXT_PUBLIC_BASE_URL returns null and logs error
  - Test invalid URL format returns null
  - Test empty string returns null
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ]* 1.4 Write property test for URL validation
  - **Property 5: URL Validation**
  - **Validates: Requirements 7.4**
  - Generate various invalid URL formats
  - Verify validation correctly identifies valid vs invalid URLs
  - Run 100 iterations

- [x] 2. Enhance data validation and normalization
  - Ensure `normalizeKpiPayload()` validates all required fields
  - Add validation for numeric field types
  - Replace missing or invalid fields with fallback values (zero)
  - Add logging for each field normalization/replacement
  - _Requirements: 8.1, 8.2, 8.3, 8.5_

- [ ]* 2.1 Write property test for data validation
  - **Property 4: Data Validation and Normalization**
  - **Validates: Requirements 8.1, 8.2, 8.3, 8.5**
  - Generate payloads with missing fields, NaN, Infinity, wrong types
  - Verify all invalid values are replaced with fallback values
  - Verify warnings are logged for each replacement
  - Run 100 iterations

- [ ]* 2.2 Write unit tests for data normalization
  - Test valid data passes through unchanged
  - Test missing field defaults to 0
  - Test NaN value defaults to 0
  - Test Infinity value defaults to 0
  - Test string number converts to number
  - _Requirements: 8.1, 8.2, 8.3_

- [x] 3. Add warning banner component for fallback data
  - Create `WarningBanner` component in `src/components/dashboard/`
  - Display user-friendly message about data unavailability
  - Include "Retry" button
  - Make banner dismissible (but reappears on refresh if still failing)
  - Style with appropriate warning colors and icons
  - _Requirements: 3.1, 3.2_

- [ ]* 3.1 Write unit tests for warning banner
  - Test banner renders when fallback data is detected
  - Test banner includes retry button
  - Test banner is dismissible
  - _Requirements: 3.1, 3.2_

- [x] 4. Implement client-side retry mechanism
  - Add state management in `DashboardClient.tsx` for retry functionality
  - Add `isFallbackData()` function to detect when fallback data is shown
  - Add `handleRetry()` function to fetch from `/api/dashboard/kpi`
  - Show loading state during retry
  - Update KPI data state on successful retry
  - Show error message on failed retry while keeping fallback data
  - Hide warning banner when real data is loaded
  - _Requirements: 3.3, 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ]* 4.1 Write property test for warning banner consistency
  - **Property 3: Warning Banner Consistency**
  - **Validates: Requirements 2.5, 3.4**
  - Generate random KPI data (both fallback and real)
  - Verify warning banner visibility matches whether data is fallback
  - Run 100 iterations

- [ ]* 4.2 Write property test for retry state updates
  - **Property 6: Retry State Updates**
  - **Validates: Requirements 6.4**
  - Generate random valid KPI responses
  - Verify successful retry updates displayed values
  - Verify warning banner is hidden after successful retry
  - Run 100 iterations

- [ ]* 4.3 Write unit tests for client-side retry
  - Test fallback data detection (all zeros → true, any non-zero → false)
  - Test successful retry updates state
  - Test failed retry shows error message
  - Test loading state during retry
  - _Requirements: 6.2, 6.3, 6.4, 6.5_

- [x] 5. Checkpoint - Ensure all tests pass
  - Run all unit tests and property-based tests
  - Verify no TypeScript errors
  - Test manually with `npm run dev` to confirm 401 error is resolved
  - Verify warning banner appears when backend is unavailable
  - Verify retry functionality works correctly
  - Ask the user if questions arise

- [x] 6. Update error handling in DashboardClient
  - Integrate WarningBanner component into DashboardClient layout
  - Position banner above KPI cards
  - Pass retry handler to banner component
  - Ensure map and other features remain functional with fallback data
  - _Requirements: 2.5, 3.4, 4.2, 4.3_

- [ ]* 6.1 Write integration tests for graceful degradation
  - Test KPI cards render with fallback data (all zeros)
  - Test map remains functional with fallback data
  - Test other dashboard features work independently
  - _Requirements: 4.2, 4.3_

- [x] 7. Final checkpoint - End-to-end testing
  - Test complete flow: page load → error → fallback → warning → retry → success
  - Test with backend unavailable (network error)
  - Test with backend returning 401 (authentication error)
  - Test with backend returning 500 (server error)
  - Test with backend returning invalid JSON
  - Test with missing NEXT_PUBLIC_BASE_URL
  - Verify all error scenarios show appropriate user feedback
  - Ensure all tests pass
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property-based tests use fast-check library with 100 iterations minimum
- The critical fix is in Task 1: properly forwarding cookies to resolve 401 errors
- Warning banner provides user feedback when fallback data is displayed
- Client-side retry allows recovery without full page refresh
