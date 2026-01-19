# Requirements Document

## Introduction

This specification addresses the cache invalidation issue that occurs when editing board posts in the Next.js application. Currently, after editing a board post and redirecting to the detail page, users see stale cached data instead of the updated content. This happens because the Next.js ISR (Incremental Static Regeneration) cache is not invalidated after successful edits.

The solution must ensure that users immediately see their changes after editing a post, while maintaining the performance benefits of ISR for other users viewing the content.

## Glossary

- **ISR (Incremental Static Regeneration)**: Next.js feature that allows pages to be statically generated and cached with periodic revalidation
- **Cache_Invalidation**: The process of removing or updating stale cached data
- **Detail_Page**: The server-rendered page displaying a single board post at `/board/[id]`
- **Edit_Page**: The client-side page for editing a board post at `/board/[id]/edit`
- **API_Route**: The Next.js API endpoint at `/api/suggestions/[id]` that handles PUT requests
- **revalidatePath**: Next.js function to invalidate cache for a specific path
- **revalidateTag**: Next.js function to invalidate cache using tags
- **Router_Cache**: Client-side cache maintained by Next.js App Router

## Requirements

### Requirement 1: Cache Invalidation After Edit

**User Story:** As a user, I want to see my changes immediately after editing a board post, so that I can verify my edits were successful.

#### Acceptance Criteria

1. WHEN a board post is successfully updated via PUT request, THE API_Route SHALL invalidate the cache for the detail page
2. WHEN the cache is invalidated, THE Detail_Page SHALL fetch fresh data on the next request
3. WHEN a user is redirected to the detail page after editing, THE Detail_Page SHALL display the updated content immediately
4. WHEN cache invalidation fails, THE API_Route SHALL log the error and still return a successful response

### Requirement 2: Server-Side Cache Invalidation

**User Story:** As a developer, I want to use Next.js revalidatePath to invalidate server-side cache, so that the ISR cache is properly cleared.

#### Acceptance Criteria

1. THE API_Route SHALL call revalidatePath for the specific detail page path after successful PUT operation
2. THE API_Route SHALL invalidate both the detail page path and any related paths (e.g., board list)
3. WHEN revalidatePath is called, THE Next.js server SHALL mark the cached page as stale
4. THE API_Route SHALL use the correct path format matching the Next.js routing structure

### Requirement 3: Client-Side Cache Invalidation

**User Story:** As a user, I want the browser cache to be cleared after editing, so that I don't see stale data from client-side navigation.

#### Acceptance Criteria

1. WHEN redirecting after a successful edit, THE Edit_Page SHALL use router.refresh() before router.push()
2. THE Edit_Page SHALL clear any client-side cached data for the detail page
3. WHEN router.refresh() is called, THE Router_Cache SHALL be invalidated for the current route
4. THE Edit_Page SHALL ensure the redirect happens after cache refresh completes

### Requirement 4: Maintain ISR Performance Benefits

**User Story:** As a system administrator, I want ISR to continue working for other users, so that the application maintains good performance.

#### Acceptance Criteria

1. THE Detail_Page SHALL continue using ISR with 60-second revalidation for normal page loads
2. WHEN cache is invalidated for one user's edit, THE system SHALL not affect cached pages for other users viewing different posts
3. THE Detail_Page SHALL regenerate the page on-demand after cache invalidation
4. THE system SHALL maintain the existing revalidate configuration in the Detail_Page

### Requirement 5: Error Handling and Logging

**User Story:** As a developer, I want proper error handling for cache invalidation, so that I can debug issues and ensure the edit operation still succeeds even if cache invalidation fails.

#### Acceptance Criteria

1. WHEN revalidatePath throws an error, THE API_Route SHALL catch the error and log it
2. WHEN cache invalidation fails, THE API_Route SHALL still return a successful response for the PUT operation
3. THE API_Route SHALL log successful cache invalidation operations for monitoring
4. WHEN router.refresh() fails, THE Edit_Page SHALL still proceed with the redirect

### Requirement 6: Metadata Cache Invalidation

**User Story:** As a user, I want updated metadata (title, description) to be reflected immediately, so that shared links show current information.

#### Acceptance Criteria

1. WHEN a post title or content is updated, THE system SHALL invalidate the metadata cache
2. THE generateMetadata function SHALL receive fresh data after cache invalidation
3. WHEN the detail page is regenerated, THE system SHALL update OpenGraph and JSON-LD structured data
4. THE system SHALL ensure metadata revalidation happens as part of the page revalidation
