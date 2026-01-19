# Implementation Tasks: Backend to Supabase Migration

## Phase 1: Database Setup and Helper Functions

### 1. Database Functions Setup
- [ ] 1.1 Create `inc_suggestion_comment_count` function in Supabase
- [ ] 1.2 Create `dec_suggestion_comment_count` function in Supabase
- [ ] 1.3 Create `toggle_suggestion_like` function in Supabase
- [ ] 1.4 Verify `inc_suggestion_view_count` function exists and works

### 2. Helper Modules (Optional - create as needed)
- [ ] 2.1 Create `src/lib/supabase/auth.ts` with authentication helpers
- [ ] 2.2 Create `src/lib/supabase/transforms.ts` with data transformation utilities
- [ ] 2.3 Create `src/lib/supabase/queries.ts` with query builder utilities

## Phase 2: Direct File Replacement (Simple Routes)

### 3. Dashboard Routes Migration
- [ ] 3.1 Copy `reference/api/dashboard/kpi/route.ts` → `src/app/api/dashboard/kpi/route.ts`
- [ ] 3.2 Copy `reference/api/dashboard/provinces/route.ts` → `src/app/api/dashboard/provinces/route.ts`
- [ ] 3.3 Copy `reference/api/dashboard/cities/route.ts` → `src/app/api/dashboard/cities/route.ts`
- [ ] 3.4 Test dashboard routes work correctly

### 4. Map Routes Migration
- [ ] 4.1 Copy `reference/api/map/crosswalks/route.ts` → `src/app/api/map/crosswalks/route.ts`
- [ ] 4.2 Copy `reference/api/map/acc_hotspots/route.ts` → `src/app/api/map/acc_hotspots/route.ts`
- [ ] 4.3 Test map routes with bounds parameters

### 5. District Routes Migration
- [ ] 5.1 Copy `reference/api/district/provinces/route.ts` → `src/app/api/district/provinces/route.ts`
- [ ] 5.2 Copy `reference/api/district/cities/route.ts` → `src/app/api/district/cities/route.ts`
- [ ] 5.3 Test district routes work correctly

### 6. Pedestrian Accident Routes Migration
- [ ] 6.1 Copy `reference/api/pedacc/summary/route.ts` → `src/app/api/pedacc/summary/route.ts`
- [ ] 6.2 Test pedacc summary route with region parameters

### 7. Suggestions Routes Migration (Partial)
- [ ] 7.1 Copy `reference/api/suggestions/route.ts` → `src/app/api/suggestions/route.ts` (GET, POST)
- [ ] 7.2 Add `revalidatePath('/board', 'page')` to POST method for cache invalidation
- [ ] 7.3 Copy `reference/api/suggestions/[id]/route.ts` → `src/app/api/suggestions/[id]/route.ts` (GET, PUT, DELETE)
- [ ] 7.4 Add cache invalidation to PUT and DELETE methods
- [ ] 7.5 Copy `reference/api/suggestions/my/route.ts` → `src/app/api/suggestions/my/route.ts` (GET)
- [ ] 7.6 Test suggestions CRUD operations

## Phase 3: Routes Requiring New Implementation

### 8. Comments Routes - Add Count Logic
- [ ] 8.1 Copy `reference/api/suggestions/[id]/comments/route.ts` → `src/app/api/suggestions/[id]/comments/route.ts` (GET, POST)
- [ ] 8.2 Add `inc_suggestion_comment_count` RPC call to POST method
- [ ] 8.3 Implement PUT method for comment update (convert from backend version)
  - [ ] 8.3.1 Get commentId from query params
  - [ ] 8.3.2 Validate user owns the comment
  - [ ] 8.3.3 Update comment in Supabase
  - [ ] 8.3.4 Return updated comment with user info
- [ ] 8.4 Implement DELETE method for comment deletion (convert from backend version)
  - [ ] 8.4.1 Get commentId from query params
  - [ ] 8.4.2 Validate user owns the comment
  - [ ] 8.4.3 Delete comment from Supabase
  - [ ] 8.4.4 Call `dec_suggestion_comment_count` RPC
  - [ ] 8.4.5 Return success message
- [ ] 8.5 Test comment CRUD operations and count updates

### 9. Like Route Implementation
- [ ] 9.1 Implement POST `/api/suggestions/[id]/like/route.ts` with Supabase
  - [ ] 9.1.1 Get current user from session
  - [ ] 9.1.2 Call `toggle_suggestion_like` RPC function
  - [ ] 9.1.3 Return liked status and new like count
- [ ] 9.2 Test like/unlike toggle functionality
- [ ] 9.3 Verify like_count updates correctly

### 10. Regions Route Implementation
- [ ] 10.1 Implement GET `/api/suggestions/regions/route.ts` with Supabase
  - [ ] 10.1.1 Query District table for available regions
  - [ ] 10.1.2 Filter by available = 1
  - [ ] 10.1.3 Return region list in same format as backend
- [ ] 10.2 Test regions route returns correct data

## Phase 4: Authentication Routes

### 11. Basic Auth Routes (Email/Password)
- [ ] 11.1 Implement POST `/api/signin/route.ts` with Supabase Auth
  - [ ] 11.1.1 Call `supabase.auth.signInWithPassword()`
  - [ ] 11.1.2 Set session cookies (access_token, refresh_token)
  - [ ] 11.1.3 Return user data
- [ ] 11.2 Implement POST `/api/signup/route.ts` with Supabase Auth
  - [ ] 11.2.1 Call `supabase.auth.signUp()`
  - [ ] 11.2.2 Create user record in users table
  - [ ] 11.2.3 Set session cookies
  - [ ] 11.2.4 Return user data
- [ ] 11.3 Implement POST `/api/signout/route.ts` with Supabase Auth
  - [ ] 11.3.1 Call `supabase.auth.signOut()`
  - [ ] 11.3.2 Clear session cookies
  - [ ] 11.3.3 Redirect to home
- [ ] 11.4 Test signin, signup, signout flows

### 12. User Profile Routes
- [ ] 12.1 Implement GET `/api/me/route.ts` with Supabase
  - [ ] 12.1.1 Get current user from session
  - [ ] 12.1.2 Query users table for user data
  - [ ] 12.1.3 Return user profile
- [ ] 12.2 Implement PATCH `/api/me/route.ts` with Supabase
  - [ ] 12.2.1 Get current user from session
  - [ ] 12.2.2 Update users table
  - [ ] 12.2.3 Return updated profile
- [ ] 12.3 Test profile retrieval and update

### 13. Password Management Routes
- [ ] 13.1 Implement POST `/api/auth/change-password/route.ts` with Supabase Auth
  - [ ] 13.1.1 Get current user from session
  - [ ] 13.1.2 Call `supabase.auth.updateUser({ password: newPassword })`
  - [ ] 13.1.3 Return success message
- [ ] 13.2 Implement POST `/api/auth/refresh/route.ts` with Supabase Auth
  - [ ] 13.2.1 Get refresh_token from cookies
  - [ ] 13.2.2 Call `supabase.auth.refreshSession()`
  - [ ] 13.2.3 Update session cookies
  - [ ] 13.2.4 Return success
- [ ] 13.3 Test password change and token refresh

## Phase 5: OAuth Routes

### 14. OAuth Configuration
- [ ] 14.1 Configure OAuth providers in Supabase Dashboard
  - [ ] 14.1.1 Enable Google OAuth
  - [ ] 14.1.2 Enable GitHub OAuth (if needed)
  - [ ] 14.1.3 Enable Kakao OAuth (if needed)
  - [ ] 14.1.4 Enable Naver OAuth (if needed)
- [ ] 14.2 Set redirect URLs in OAuth provider settings

### 15. OAuth Routes Implementation
- [ ] 15.1 Implement GET `/api/oauth2/start/[provider]/route.ts`
  - [ ] 15.1.1 Call `supabase.auth.signInWithOAuth()`
  - [ ] 15.1.2 Set redirectTo to callback URL
  - [ ] 15.1.3 Redirect to OAuth provider
- [ ] 15.2 Implement GET `/api/oauth2/callback/route.ts`
  - [ ] 15.2.1 Get code from query params
  - [ ] 15.2.2 Call `supabase.auth.exchangeCodeForSession()`
  - [ ] 15.2.3 Set session cookies
  - [ ] 15.2.4 Redirect to home
- [ ] 15.3 Test OAuth flow with each provider

## Phase 6: Testing and Validation

### 16. Route Testing
- [ ] 16.1 Test all dashboard routes return correct data
- [ ] 16.2 Test all map routes with various bounds
- [ ] 16.3 Test all district routes
- [ ] 16.4 Test suggestions CRUD with filters, pagination, sorting
- [ ] 16.5 Test comments CRUD and count updates
- [ ] 16.6 Test like toggle and count updates
- [ ] 16.7 Test view count increments on suggestion detail view

### 17. Authentication Testing
- [ ] 17.1 Test email/password signup and signin
- [ ] 17.2 Test signout clears session
- [ ] 17.3 Test profile retrieval and update
- [ ] 17.4 Test password change
- [ ] 17.5 Test token refresh
- [ ] 17.6 Test OAuth flow for each provider
- [ ] 17.7 Test unauthorized access returns 401

### 18. Integration Testing
- [ ] 18.1 Test complete suggestion lifecycle (create → read → update → delete)
- [ ] 18.2 Test complete comment lifecycle (create → read → update → delete)
- [ ] 18.3 Test like toggle multiple times
- [ ] 18.4 Test cache invalidation after mutations
- [ ] 18.5 Test user can only modify their own content

## Phase 7: Cleanup and Optimization

### 19. Code Cleanup
- [ ] 19.1 Remove all `backendClient` imports from migrated routes
- [ ] 19.2 Remove `BACKEND_URL` environment variable references
- [ ] 19.3 Remove unused backend-related utility functions
- [ ] 19.4 Update environment variable documentation

### 20. Performance Optimization
- [ ] 20.1 Review and optimize Supabase queries
- [ ] 20.2 Add database indexes if needed
- [ ] 20.3 Test response times vs backend
- [ ] 20.4 Optimize data transformations

### 21. Documentation
- [ ] 21.1 Update API documentation
- [ ] 21.2 Document Supabase setup steps
- [ ] 21.3 Document OAuth configuration
- [ ] 21.4 Update deployment guide for Vercel

### 22. Final Validation
- [ ] 22.1 Run full test suite
- [ ] 22.2 Verify all frontend functionality works
- [ ] 22.3 Test deployment to Vercel
- [ ] 22.4 Monitor for errors in production
- [ ] 22.5 Verify application runs standalone without backend server

## Notes

- Each task should be tested individually before moving to the next
- Keep original backend routes as backup during migration
- Use git commits after each major phase for easy rollback
- Monitor Supabase logs for any query errors
- Test with real data to ensure data transformations are correct
