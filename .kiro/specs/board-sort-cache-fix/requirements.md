# Requirements Document

## Introduction

This specification addresses critical cache invalidation and UI update issues in the board/suggestions feature of a Next.js application with a SpringBoot backend. Currently, when users change sorting parameters or delete posts, the backend processes the requests correctly (as evidenced by Hibernate SQL logs), but the frontend UI does not reflect these changes immediately. This creates a poor user experience where users must manually refresh the page to see updated content.

The system uses Next.js 14+ with App Router, Server Components, and Incremental Static Regeneration (ISR) with a 60-second revalidation period. The backend is SpringBoot with Hibernate ORM.

## Glossary

- **Board_System**: The suggestions/board feature that displays community posts about pedestrian safety improvements
- **Sort_Controller**: The client-side component that handles sorting parameter changes
- **Cache_Manager**: Next.js caching system including ISR and revalidatePath functionality
- **API_Route**: Next.js API routes that proxy requests to the SpringBoot backend
- **UI_State**: The rendered list of suggestions displayed to users
- **Backend_API**: The SpringBoot REST API that manages suggestion data

## Requirements

### Requirement 1: Sort Parameter Handling

**User Story:** As a user, I want to change the sort order of the board list, so that I can view suggestions organized by latest, popularity, priority, or status.

#### Acceptance Criteria

1. WHEN a user selects a different sort option from the dropdown, THE Sort_Controller SHALL update the URL search parameters with the new sortBy value
2. WHEN the sortBy parameter changes in the URL, THE Board_System SHALL fetch suggestions from the API_Route with the updated sort parameter
3. WHEN the API_Route receives a sortBy parameter, THE API_Route SHALL transform it to the correct Spring Data sort format and pass it to the Backend_API
4. WHEN sorted data is returned from the Backend_API, THE UI_State SHALL display suggestions in the requested order within 2 seconds
5. WHEN the sort order changes, THE Board_System SHALL reset pagination to page 1

### Requirement 2: Cache Invalidation After Deletion

**User Story:** As a user, I want deleted posts to immediately disappear from the board list, so that I don't see stale content.

#### Acceptance Criteria

1. WHEN a user successfully deletes a suggestion, THE API_Route SHALL call revalidatePath for both the detail page and the board list page
2. WHEN revalidatePath is called, THE Cache_Manager SHALL invalidate all cached versions of the affected routes
3. WHEN the user is redirected to the board list after deletion, THE Board_System SHALL fetch fresh data from the Backend_API
4. WHEN fresh data is fetched, THE UI_State SHALL display the updated list without the deleted suggestion
5. IF cache invalidation fails, THE API_Route SHALL log the error but still return a successful deletion response

### Requirement 3: Cache Invalidation After Updates

**User Story:** As a user, I want edited posts to immediately show updated content, so that I see the current state of suggestions.

#### Acceptance Criteria

1. WHEN a user successfully updates a suggestion, THE API_Route SHALL call revalidatePath for both the detail page and the board list page
2. WHEN the user navigates back to the board list, THE UI_State SHALL display the updated suggestion content
3. WHEN viewing the detail page after an update, THE UI_State SHALL display the latest content without requiring a manual refresh

### Requirement 4: Client-Side Navigation and Cache Busting

**User Story:** As a user, I want the board to always show current data after mutations, so that I have confidence in the accuracy of what I'm viewing.

#### Acceptance Criteria

1. WHEN a user navigates to the board list using router.push after a mutation, THE Board_System SHALL bypass stale cached data
2. WHEN the board page loads, THE Board_System SHALL use the current URL search parameters to fetch data
3. WHEN ISR cache is stale, THE Board_System SHALL serve cached content and revalidate in the background
4. WHEN a user performs a mutation (create, update, delete), THE Board_System SHALL ensure the next page load fetches fresh data

### Requirement 5: Sort Parameter Persistence

**User Story:** As a user, I want my selected sort order to persist across page navigations, so that I don't have to re-select my preference repeatedly.

#### Acceptance Criteria

1. WHEN a user selects a sort option, THE Sort_Controller SHALL update the URL with the sortBy parameter
2. WHEN a user navigates away and returns to the board, THE Board_System SHALL read the sortBy parameter from the URL
3. WHEN the sortBy parameter exists in the URL, THE Sort_Controller SHALL display the correct selected option in the dropdown
4. WHEN no sortBy parameter exists, THE Board_System SHALL default to "latest" sorting

### Requirement 6: Error Handling for Cache Operations

**User Story:** As a developer, I want cache invalidation errors to be logged but not block user operations, so that users can complete their actions even if caching fails.

#### Acceptance Criteria

1. WHEN revalidatePath throws an error, THE API_Route SHALL catch the error and log it to the console
2. WHEN cache invalidation fails, THE API_Route SHALL still return a successful response to the client if the backend operation succeeded
3. WHEN cache operations fail, THE Board_System SHALL continue to function using standard ISR revalidation timing
4. WHEN cache errors occur, THE API_Route SHALL include sufficient context in error logs for debugging

### Requirement 7: Optimistic UI Updates

**User Story:** As a user, I want immediate visual feedback when I perform actions, so that the interface feels responsive.

#### Acceptance Criteria

1. WHEN a user clicks the like button, THE UI_State SHALL immediately update the like count before the API call completes
2. WHEN a user deletes a suggestion, THE Board_System SHALL show a loading state or redirect immediately
3. WHEN a user submits a comment, THE UI_State SHALL immediately add the comment to the list
4. IF an optimistic update fails, THE UI_State SHALL revert to the previous state and display an error message

### Requirement 8: Router Cache Management

**User Story:** As a developer, I want to properly manage Next.js router cache, so that navigation after mutations shows fresh data.

#### Acceptance Criteria

1. WHEN using router.push after a mutation, THE Board_System SHALL include cache-busting parameters if necessary
2. WHEN navigating to the board list, THE Board_System SHALL not serve stale router-cached data
3. WHEN revalidatePath is called, THE Cache_Manager SHALL clear both full route cache and router cache
4. WHEN a user performs multiple mutations in sequence, THE Board_System SHALL maintain cache coherence
