# Requirements Document: Backend to Supabase Migration

## Introduction

This specification defines the requirements for migrating all backend API routes from a Spring Boot backend server to Supabase-based routes. The migration will eliminate the dependency on the separate backend server, allowing the Next.js application to run standalone on Vercel using Supabase as the primary data and authentication layer.

## Glossary

- **Backend_Server**: The existing Spring Boot server that currently handles API requests
- **Supabase**: The Backend-as-a-Service platform providing database, authentication, and storage services
- **API_Route**: A Next.js API route handler in the `src/app/api` directory
- **Supabase_Client**: The server-side Supabase client created via `getSupabaseServerClient()`
- **RLS**: Row Level Security policies in Supabase that control data access
- **Backend_Client**: The axios client (`backendClient`) used to communicate with the Backend_Server
- **Authentication_Token**: JWT token used for user authentication (currently cookie-based, will migrate to Supabase Auth)
- **Cache_Invalidation**: The process of clearing Next.js cache using `revalidatePath()`
- **API_Contract**: The request/response format that the frontend expects from API routes

## Requirements

### Requirement 1: Authentication Migration

**User Story:** As a developer, I want to migrate authentication from cookie-based backend auth to Supabase Auth, so that the application can authenticate users without the Backend_Server.

#### Acceptance Criteria

1. WHEN a user signs in with email and password, THE System SHALL authenticate via Supabase Auth and return a session token
2. WHEN a user signs up with email and password, THE System SHALL create a new user in Supabase Auth and return a session token
3. WHEN a user signs out, THE System SHALL invalidate the Supabase session
4. WHEN an authenticated request is made, THE System SHALL validate the Supabase session token
5. WHEN a user requests their profile via `/api/me`, THE System SHALL retrieve user data from Supabase using the authenticated session
6. WHEN a user updates their profile via `/api/me`, THE System SHALL update user data in Supabase using the authenticated session
7. WHEN a user changes their password, THE System SHALL update the password in Supabase Auth
8. IF a session token is invalid or expired, THEN THE System SHALL return a 401 Unauthorized response

### Requirement 2: Dashboard API Migration

**User Story:** As a user, I want to view dashboard KPI data, so that I can see summary statistics about the system.

#### Acceptance Criteria

1. WHEN `/api/dashboard/kpi` is requested, THE System SHALL query Supabase for KPI summary data and return it
2. WHEN `/api/dashboard/provinces` is requested, THE System SHALL query Supabase for the list of provinces and return it
3. WHEN `/api/dashboard/cities` is requested with a province parameter, THE System SHALL query Supabase for cities in that province and return them
4. THE System SHALL return KPI data in the same format as the Backend_Server response
5. THE System SHALL return province and city data in the same format as the Backend_Server response

### Requirement 3: Suggestions API Migration

**User Story:** As a user, I want to create, read, update, and delete suggestions, so that I can participate in the community feedback system.

#### Acceptance Criteria

1. WHEN `/api/suggestions` GET is requested, THE System SHALL query Supabase with filters, pagination, sorting, and search parameters
2. WHEN `/api/suggestions` POST is requested, THE System SHALL insert a new suggestion into Supabase with the authenticated user's ID
3. WHEN `/api/suggestions/[id]` GET is requested, THE System SHALL retrieve the suggestion from Supabase including user information
4. WHEN `/api/suggestions/[id]` PUT is requested, THE System SHALL update the suggestion in Supabase if the authenticated user owns it
5. WHEN `/api/suggestions/[id]` DELETE is requested, THE System SHALL delete the suggestion from Supabase if the authenticated user owns it
6. WHEN `/api/suggestions/[id]/like` POST is requested, THE System SHALL toggle the like status for the authenticated user
7. WHEN `/api/suggestions/[id]/comments` GET is requested, THE System SHALL retrieve all comments for the suggestion from Supabase
8. WHEN `/api/suggestions/[id]/comments` POST is requested, THE System SHALL create a new comment in Supabase with the authenticated user's ID
9. WHEN `/api/suggestions/my` GET is requested, THE System SHALL retrieve all suggestions created by the authenticated user
10. WHEN `/api/suggestions/regions` GET is requested, THE System SHALL retrieve available regions from Supabase
11. THE System SHALL maintain the same response format for all suggestions endpoints as the Backend_Server
12. THE System SHALL support filtering by status, type, and region
13. THE System SHALL support sorting by latest, popular, and status
14. THE System SHALL support pagination with page and size parameters
15. THE System SHALL support search across title, content, and address fields

### Requirement 4: Map API Migration

**User Story:** As a user, I want to view map data for crosswalks and accident hotspots, so that I can visualize safety information geographically.

#### Acceptance Criteria

1. WHEN `/api/map/crosswalks` GET is requested with bounds parameters, THE System SHALL query Supabase for crosswalk data within the specified geographic bounds
2. WHEN `/api/map/acc_hotspots` GET is requested with bounds parameters, THE System SHALL query Supabase for accident hotspot data within the specified geographic bounds
3. THE System SHALL return crosswalk data in the same format as the Backend_Server response
4. THE System SHALL return accident hotspot data in the same format as the Backend_Server response
5. THE System SHALL filter results based on latitude and longitude bounds

### Requirement 5: District API Migration

**User Story:** As a user, I want to retrieve district information, so that I can filter data by geographic region.

#### Acceptance Criteria

1. WHEN `/api/district/provinces` GET is requested, THE System SHALL query Supabase for all available provinces
2. WHEN `/api/district/cities` GET is requested with a province parameter, THE System SHALL query Supabase for cities in that province
3. THE System SHALL return district data in the same format as the Backend_Server response
4. THE System SHALL filter cities by the `available` flag

### Requirement 6: Pedestrian Accident API Migration

**User Story:** As a user, I want to view pedestrian accident summary data, so that I can understand accident patterns by region.

#### Acceptance Criteria

1. WHEN `/api/pedacc/summary` GET is requested with region parameters, THE System SHALL query Supabase for accident summary data
2. THE System SHALL aggregate accident data by region
3. THE System SHALL return summary data in the same format as the Backend_Server response

### Requirement 7: Data Transformation Consistency

**User Story:** As a frontend developer, I want API responses to maintain the same format, so that I don't need to modify frontend code.

#### Acceptance Criteria

1. FOR ALL migrated API routes, THE System SHALL transform Supabase query results to match the Backend_Server response format
2. WHEN field names differ between Supabase and Backend_Server, THE System SHALL map field names correctly
3. WHEN nested objects are required, THE System SHALL perform joins and construct nested objects
4. WHEN date fields are returned, THE System SHALL format them consistently with the Backend_Server
5. WHEN numeric fields are returned, THE System SHALL ensure correct type conversion

### Requirement 8: Cache Invalidation Preservation

**User Story:** As a developer, I want cache invalidation to work correctly, so that users see updated data immediately.

#### Acceptance Criteria

1. WHEN a suggestion is created, THE System SHALL call `revalidatePath('/board', 'page')`
2. WHEN a suggestion is updated, THE System SHALL call `revalidatePath` for both the detail page and list page
3. WHEN a suggestion is deleted, THE System SHALL call `revalidatePath` for both the detail page and list page
4. IF cache invalidation fails, THEN THE System SHALL log the error but not fail the request
5. THE System SHALL maintain all existing cache invalidation strategies

### Requirement 9: Error Handling Consistency

**User Story:** As a user, I want to receive clear error messages, so that I understand what went wrong.

#### Acceptance Criteria

1. WHEN a Supabase query fails, THE System SHALL return an appropriate HTTP status code
2. WHEN authentication fails, THE System SHALL return a 401 status with a descriptive message
3. WHEN authorization fails, THE System SHALL return a 403 status with a descriptive message
4. WHEN a resource is not found, THE System SHALL return a 404 status with a descriptive message
5. WHEN validation fails, THE System SHALL return a 400 status with a descriptive message
6. WHEN an internal error occurs, THE System SHALL return a 500 status and log the error
7. THE System SHALL maintain the same error response format as the Backend_Server

### Requirement 10: Row Level Security Configuration

**User Story:** As a security administrator, I want RLS policies configured in Supabase, so that users can only access data they're authorized to see.

#### Acceptance Criteria

1. THE System SHALL enforce that users can only update or delete their own suggestions
2. THE System SHALL enforce that users can only update or delete their own comments
3. THE System SHALL allow all authenticated users to read public suggestions
4. THE System SHALL allow all authenticated users to create suggestions
5. THE System SHALL allow all authenticated users to create comments
6. THE System SHALL allow all users to read public dashboard and map data

### Requirement 11: OAuth Integration Migration

**User Story:** As a user, I want to sign in with OAuth providers, so that I can use my existing accounts.

#### Acceptance Criteria

1. WHEN `/api/oauth2/start/[provider]` GET is requested, THE System SHALL initiate OAuth flow via Supabase Auth
2. WHEN `/api/oauth2/callback` GET is requested, THE System SHALL handle OAuth callback via Supabase Auth
3. THE System SHALL support the same OAuth providers as the Backend_Server
4. WHEN OAuth authentication succeeds, THE System SHALL create or retrieve the user in Supabase
5. WHEN OAuth authentication fails, THE System SHALL return an appropriate error response

### Requirement 12: Backend Client Removal

**User Story:** As a developer, I want to remove all Backend_Client dependencies, so that the application is fully standalone.

#### Acceptance Criteria

1. WHEN all API routes are migrated, THE System SHALL not import or use `backendClient`
2. WHEN all API routes are migrated, THE System SHALL not make HTTP requests to the Backend_Server
3. THE System SHALL use only `getSupabaseServerClient()` for data access
4. THE System SHALL remove the `BACKEND_URL` environment variable requirement

### Requirement 13: Performance Optimization

**User Story:** As a user, I want API responses to be fast, so that the application feels responsive.

#### Acceptance Criteria

1. WHEN complex queries are needed, THE System SHALL use Supabase database views or functions
2. WHEN multiple related records are needed, THE System SHALL use Supabase joins instead of multiple queries
3. WHEN aggregations are needed, THE System SHALL perform them in the database rather than in application code
4. THE System SHALL use appropriate indexes on frequently queried fields
5. THE System SHALL maintain or improve response times compared to the Backend_Server

### Requirement 14: Testing and Validation

**User Story:** As a developer, I want comprehensive tests for migrated routes, so that I can verify correctness.

#### Acceptance Criteria

1. FOR ALL migrated API routes, THE System SHALL have unit tests that verify correct Supabase queries
2. FOR ALL migrated API routes, THE System SHALL have integration tests that verify end-to-end functionality
3. THE System SHALL have tests that verify authentication and authorization
4. THE System SHALL have tests that verify error handling
5. THE System SHALL have tests that verify data transformation
6. THE System SHALL have tests that verify cache invalidation
