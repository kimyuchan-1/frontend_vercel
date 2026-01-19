# Requirements Document

## Introduction

This document specifies the requirements for fixing the dashboard KPI data fetching error. The current implementation has reliability issues where the server component fetches KPI data during SSR by calling its own API route, which then proxies to the backend. This architecture can fail due to network issues, backend unavailability, or cookie forwarding problems. The fix will improve error handling, provide better user feedback, and ensure graceful degradation when the backend is unavailable.

## Glossary

- **Server_Component**: The Next.js server component (page.tsx) that renders during Server-Side Rendering (SSR)
- **API_Route**: The Next.js API route handler (/api/dashboard/kpi) that proxies requests to the backend
- **Backend_API**: The external backend service that provides KPI data, accessed via NEXT_PUBLIC_BASE_URL
- **Client_Component**: The React client component (DashboardClient.tsx) that displays KPI data in the browser
- **KPI_Data**: Key Performance Indicator data including totalCrosswalks, signalInstallationRate, riskIndex, accidentReductionRate, and safetyIndex
- **Fallback_Data**: Default KPI data with zero values used when fetching fails
- **Error_State**: A UI state that displays error information to users
- **Loading_State**: A UI state that indicates data is being fetched

## Requirements

### Requirement 1: Direct Backend Communication

**User Story:** As a developer, I want the server component to communicate directly with the backend API, so that we eliminate unnecessary network hops and reduce failure points.

#### Acceptance Criteria

1. WHEN the Server_Component fetches KPI data, THE Server_Component SHALL call the Backend_API directly without using the API_Route
2. WHEN the Server_Component makes a backend request, THE Server_Component SHALL include appropriate timeout configuration
3. WHEN the Server_Component makes a backend request, THE Server_Component SHALL forward authentication cookies to the Backend_API
4. THE Server_Component SHALL use NEXT_PUBLIC_BASE_URL environment variable as the base URL for backend requests

### Requirement 2: Comprehensive Error Handling

**User Story:** As a user, I want to see clear error messages when KPI data fails to load, so that I understand what went wrong and what actions I can take.

#### Acceptance Criteria

1. WHEN the Backend_API request fails with a network error, THE Server_Component SHALL log the error details and return Fallback_Data
2. WHEN the Backend_API request fails with a timeout, THE Server_Component SHALL log the timeout and return Fallback_Data
3. WHEN the Backend_API returns a non-200 status code, THE Server_Component SHALL log the status code and error message
4. WHEN the Backend_API returns invalid JSON, THE Server_Component SHALL log the parsing error and return Fallback_Data
5. IF KPI data fetching fails, THEN THE Client_Component SHALL display an Error_State with a user-friendly message

### Requirement 3: User Feedback for Data Availability

**User Story:** As a user, I want to know when I'm viewing fallback data instead of real KPI data, so that I can make informed decisions about the information displayed.

#### Acceptance Criteria

1. WHEN Fallback_Data is displayed, THE Client_Component SHALL show a warning banner indicating data is unavailable
2. WHEN Fallback_Data is displayed, THE warning banner SHALL include a "Retry" button
3. WHEN the user clicks the "Retry" button, THE Client_Component SHALL trigger a page refresh to attempt fetching data again
4. WHEN real KPI_Data is successfully loaded, THE Client_Component SHALL NOT display any warning banner

### Requirement 4: Graceful Degradation

**User Story:** As a user, I want the dashboard to remain functional even when KPI data is unavailable, so that I can still use other dashboard features like the map.

#### Acceptance Criteria

1. WHEN KPI data fetching fails, THE Server_Component SHALL return Fallback_Data instead of throwing an error
2. WHEN Fallback_Data is displayed, THE Client_Component SHALL render all KPI cards with zero values
3. WHEN Fallback_Data is displayed, THE map and other dashboard features SHALL remain fully functional
4. THE Server_Component SHALL NOT trigger Next.js error boundaries when KPI fetching fails

### Requirement 5: Improved Logging and Debugging

**User Story:** As a developer, I want detailed error logs when KPI fetching fails, so that I can diagnose and fix issues quickly.

#### Acceptance Criteria

1. WHEN a backend request fails, THE Server_Component SHALL log the error type (network, timeout, HTTP error, parsing error)
2. WHEN a backend request fails, THE Server_Component SHALL log the Backend_API URL being called
3. WHEN a backend request fails, THE Server_Component SHALL log the HTTP status code if available
4. WHEN a backend request fails, THE Server_Component SHALL log the error message from the Backend_API if available
5. THE Server_Component SHALL include timestamps in all error logs

### Requirement 6: Client-Side Retry Mechanism

**User Story:** As a user, I want the ability to retry loading KPI data without refreshing the entire page, so that I can recover from temporary network issues quickly.

#### Acceptance Criteria

1. WHEN the Client_Component detects Fallback_Data, THE Client_Component SHALL provide a retry mechanism
2. WHEN the user triggers a retry, THE Client_Component SHALL fetch KPI data from the API_Route
3. WHEN a client-side retry is in progress, THE Client_Component SHALL display a Loading_State
4. WHEN a client-side retry succeeds, THE Client_Component SHALL update the displayed KPI_Data
5. WHEN a client-side retry fails, THE Client_Component SHALL display an error message and keep the Fallback_Data

### Requirement 7: Environment Configuration Validation

**User Story:** As a developer, I want the system to validate that required environment variables are configured, so that I can catch configuration errors early.

#### Acceptance Criteria

1. WHEN the Server_Component initializes, THE Server_Component SHALL verify that NEXT_PUBLIC_BASE_URL environment variable is set
2. IF NEXT_PUBLIC_BASE_URL is not set, THEN THE Server_Component SHALL log a configuration error
3. IF NEXT_PUBLIC_BASE_URL is not set, THEN THE Server_Component SHALL return Fallback_Data
4. THE Server_Component SHALL validate that NEXT_PUBLIC_BASE_URL is a valid URL format

### Requirement 8: Response Data Validation

**User Story:** As a developer, I want to validate KPI data received from the backend, so that invalid data doesn't cause runtime errors in the UI.

#### Acceptance Criteria

1. WHEN the Backend_API returns data, THE Server_Component SHALL validate that all required KPI fields are present
2. WHEN the Backend_API returns data, THE Server_Component SHALL validate that numeric fields contain valid numbers
3. IF any KPI field is missing or invalid, THEN THE Server_Component SHALL use the fallback value for that field
4. THE Server_Component SHALL use the existing normalizeKpiPayload function for data validation
5. THE Server_Component SHALL log warnings when data normalization replaces invalid values
