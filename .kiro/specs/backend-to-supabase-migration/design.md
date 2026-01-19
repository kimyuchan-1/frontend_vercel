# Design Document: Backend to Supabase Migration

## Overview

This design outlines the migration strategy for replacing all Spring Boot backend API routes with Supabase-based Next.js API routes. The migration will transform the application from a two-tier architecture (Next.js frontend + Spring Boot backend) to a single-tier architecture (Next.js with Supabase), enabling standalone deployment on Vercel.

The migration follows a systematic approach:
1. Replace `backendClient` HTTP calls with direct Supabase queries
2. Migrate cookie-based authentication to Supabase Auth JWT tokens
3. Transform data between Supabase schema and existing API contracts
4. Preserve all existing functionality including filtering, pagination, sorting, and caching

## Architecture

### Current Architecture

```
Browser → Next.js API Routes → backendClient (axios) → Spring Boot Backend → PostgreSQL
                                                                           → Redis (sessions)
```

### Target Architecture

```
Browser → Next.js API Routes → Supabase Client → Supabase (PostgreSQL + Auth + Storage)
```

### Key Architectural Changes

1. **Authentication Layer**: Cookie-based sessions → Supabase Auth JWT tokens
2. **Data Access**: HTTP REST calls → Direct PostgreSQL queries via Supabase client
3. **Authorization**: Backend middleware → Supabase Row Level Security (RLS) policies
4. **Session Management**: Redis sessions → Supabase Auth session management
5. **Business Logic**: Backend services → API route handlers + database functions

## Components and Interfaces

### 1. Supabase Client Module

**Location**: `src/lib/supabase/server.ts`

**Purpose**: Provides a configured Supabase client for server-side API routes

**Interface**:
```typescript
function getSupabaseServerClient(): SupabaseClient
```

**Implementation Details**:
- Uses service role key for admin operations
- Disables session persistence (stateless)
- Configured with environment variables:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`

### 2. Authentication Module

**Location**: `src/lib/supabase/auth.ts` (new)

**Purpose**: Handles Supabase Auth operations and session validation

**Interface**:
```typescript
// Sign in with email/password
async function signIn(email: string, password: string): Promise<AuthResult>

// Sign up with email/password
async function signUp(email: string, password: string, name: string): Promise<AuthResult>

// Sign out
async function signOut(): Promise<void>

// Get current user from session
async function getCurrentUser(request: Request): Promise<User | null>

// Validate session token
async function validateSession(token: string): Promise<Session | null>

// Change password
async function changePassword(userId: string, newPassword: string): Promise<void>

// OAuth flow initiation
async function initiateOAuth(provider: string, redirectTo: string): Promise<{ url: string }>

// OAuth callback handling (handled by Supabase automatically)
// No custom implementation needed - Supabase handles the callback

type AuthResult = {
  user: User;
  session: Session;
}

type User = {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

type Session = {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}
```

**Implementation Details**:
- Uses Supabase Auth SDK methods
- Stores session tokens in HTTP-only cookies
- Validates JWT tokens on each authenticated request
- Handles token refresh automatically

**OAuth Implementation with Supabase:**

Supabase provides built-in OAuth support. The implementation is much simpler than custom backend OAuth:

1. **OAuth Start (`/api/oauth2/start/[provider]`):**
```typescript
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! // Use anon key for client-side auth
  );

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider as any, // 'google', 'github', 'kakao', 'naver', etc.
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth2/callback`,
      scopes: 'email profile', // Optional: specify scopes
    },
  });

  if (error) {
    return NextResponse.redirect(new URL('/signin?error=oauth_failed', request.url));
  }

  // Redirect to OAuth provider
  return NextResponse.redirect(data.url);
}
```

2. **OAuth Callback (`/api/oauth2/callback`):**
```typescript
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(new URL('/signin?error=no_code', url));
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Exchange code for session
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(new URL('/signin?error=oauth_callback_failed', url));
  }

  // Set session cookies
  const response = NextResponse.redirect(new URL('/', url));
  
  const cookieStore = await cookies();
  cookieStore.set('sb-access-token', data.session.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  cookieStore.set('sb-refresh-token', data.session.refresh_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return response;
}
```

3. **Supabase OAuth Configuration:**

In Supabase Dashboard, configure OAuth providers:
- Go to Authentication > Providers
- Enable desired providers (Google, GitHub, Kakao, Naver, etc.)
- Add OAuth credentials (Client ID, Client Secret)
- Set redirect URL: `https://your-project.supabase.co/auth/v1/callback`

4. **Supported Providers:**
- Google
- GitHub
- GitLab
- Bitbucket
- Azure
- Facebook
- Twitter
- Discord
- Slack
- Spotify
- Twitch
- LinkedIn
- Kakao (Korean)
- Naver (Korean)
- And many more...

**Key Differences from Backend OAuth:**
- ✅ No need to manually handle OAuth flow
- ✅ No need to store OAuth tokens
- ✅ Supabase handles token refresh automatically
- ✅ Built-in support for many providers
- ✅ Automatic user creation in Supabase Auth
- ✅ Session management handled by Supabase

### 3. Data Transformation Module

**Location**: `src/lib/supabase/transforms.ts` (new)

**Purpose**: Transforms data between Supabase schema and API contract formats

**Interface**:
```typescript
// Transform suggestion from Supabase to API format
function transformSuggestion(row: SupabaseSuggestion): APISuggestion

// Transform user from Supabase to API format
function transformUser(row: SupabaseUser): APIUser

// Transform district from Supabase to API format
function transformDistrict(row: SupabaseDistrict): APIDistrict

// Parse region string to codes
async function resolveRegionCodes(
  region: string, 
  supabase: SupabaseClient
): Promise<{ sido_code: number | null; sigungu_code: number | null }>

// Convert district_id to codes
function districtIdToCodes(districtId: number): { sido_code: number; sigungu_code: number }
```

**Implementation Details**:
- Maps snake_case (Supabase) to camelCase (API) where needed
- Constructs nested objects (e.g., user within suggestion)
- Handles null/undefined values gracefully
- Performs type conversions (string to number, etc.)

### 4. Query Builder Module

**Location**: `src/lib/supabase/queries.ts` (new)

**Purpose**: Provides reusable query builders for common operations

**Interface**:
```typescript
// Build suggestions list query with filters
function buildSuggestionsQuery(
  supabase: SupabaseClient,
  filters: SuggestionFilters
): PostgrestFilterBuilder

// Build paginated query
function applyPagination<T>(
  query: PostgrestFilterBuilder<T>,
  page: number,
  size: number
): PostgrestFilterBuilder<T>

// Build sort query
function applySort<T>(
  query: PostgrestFilterBuilder<T>,
  sortKey: string,
  ascending: boolean
): PostgrestFilterBuilder<T>

type SuggestionFilters = {
  search?: string;
  status?: string;
  type?: string;
  sido_code?: number | null;
  sigungu_code?: number | null;
}
```

**Implementation Details**:
- Encapsulates common query patterns
- Handles filter combinations
- Supports method chaining
- Provides type safety

### 5. API Route Handlers

Each API route will be refactored to:
1. Extract request parameters
2. Validate authentication (if required)
3. Build Supabase query using query builders
4. Execute query
5. Transform results using transformation module
6. Return response with appropriate status code
7. Handle errors gracefully

**Example Pattern**:
```typescript
export async function GET(request: NextRequest) {
  try {
    // 1. Extract parameters
    const { searchParams } = new URL(request.url);
    const page = parseIntSafe(searchParams.get("page"), 1);
    
    // 2. Validate authentication (if needed)
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // 3. Build query
    const supabase = getSupabaseServerClient();
    let query = buildSuggestionsQuery(supabase, filters);
    query = applyPagination(query, page, size);
    
    // 4. Execute query
    const { data, error, count } = await query;
    
    // 5. Transform results
    const content = data.map(transformSuggestion);
    
    // 6. Return response
    return NextResponse.json({ content, totalElements: count });
  } catch (error) {
    // 7. Handle errors
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

## Data Models

### Supabase Tables

#### users
```sql
- id: bigint (PK)
- email: text (unique)
- name: text
- picture: text (nullable)
- created_at: timestamp
- updated_at: timestamp
```

#### suggestions
```sql
- id: bigint (PK)
- title: text
- content: text
- location_lat: double precision
- location_lon: double precision
- address: text
- sido_code: integer (nullable)
- sigungu_code: integer (nullable)
- suggestion_type: text
- status: text (PENDING, IN_PROGRESS, COMPLETED, REJECTED)
- like_count: integer (default 0)
- view_count: integer (default 0)
- comment_count: text (should be integer)
- created_at: timestamp
- updated_at: timestamp
- user_id: bigint (FK → users.id)
```

#### comments
```sql
- id: bigint (PK)
- suggestion_id: bigint (FK → suggestions.id)
- user_id: bigint (FK → users.id)
- content: text
- created_at: timestamp
- updated_at: timestamp
```

#### likes
```sql
- id: bigint (PK)
- suggestion_id: bigint (FK → suggestions.id)
- user_id: bigint (FK → users.id)
- created_at: timestamp
- UNIQUE(suggestion_id, user_id)
```

#### District
```sql
- district_id: bigint (PK)
- district_name: text
- available: integer (0 or 1)
```

#### crosswalks
```sql
- id: bigint (PK)
- latitude: double precision
- longitude: double precision
- [other fields...]
```

#### accident_hotspots
```sql
- id: bigint (PK)
- latitude: double precision
- longitude: double precision
- severity: text
- [other fields...]
```

### Database Views

#### v_kpi_summary_json
```sql
- data: jsonb (contains KPI summary as JSON)
```

This view aggregates KPI data from multiple tables and returns it as a single JSON object.

### Database Functions

#### inc_suggestion_view_count
```sql
CREATE OR REPLACE FUNCTION inc_suggestion_view_count(sid bigint)
RETURNS void AS $$
BEGIN
  UPDATE suggestions 
  SET view_count = view_count + 1 
  WHERE id = sid;
END;
$$ LANGUAGE plpgsql;
```

Atomically increments the view count for a suggestion. **Already implemented and used in reference code.**

#### inc_suggestion_comment_count (NEW - needs creation)
```sql
CREATE OR REPLACE FUNCTION inc_suggestion_comment_count(sid bigint)
RETURNS void AS $
BEGIN
  UPDATE suggestions 
  SET comment_count = (CAST(comment_count AS INTEGER) + 1)::TEXT
  WHERE id = sid;
END;
$ LANGUAGE plpgsql;
```

Atomically increments the comment count. **Must be called in POST comments.**

#### dec_suggestion_comment_count (NEW - needs creation)
```sql
CREATE OR REPLACE FUNCTION dec_suggestion_comment_count(sid bigint)
RETURNS void AS $
BEGIN
  UPDATE suggestions 
  SET comment_count = GREATEST(0, CAST(comment_count AS INTEGER) - 1)::TEXT
  WHERE id = sid;
END;
$ LANGUAGE plpgsql;
```

Atomically decrements the comment count (minimum 0). **Must be called in DELETE comments.**

#### toggle_suggestion_like (NEW - needs creation)
```sql
CREATE OR REPLACE FUNCTION toggle_suggestion_like(sid bigint, uid bigint)
RETURNS TABLE(liked boolean, new_count integer) AS $
DECLARE
  existing_like_id bigint;
  new_like_count integer;
BEGIN
  SELECT id INTO existing_like_id FROM likes WHERE suggestion_id = sid AND user_id = uid;
  IF existing_like_id IS NOT NULL THEN
    DELETE FROM likes WHERE id = existing_like_id;
    UPDATE suggestions SET like_count = GREATEST(0, like_count - 1) WHERE id = sid RETURNING like_count INTO new_like_count;
    RETURN QUERY SELECT false, new_like_count;
  ELSE
    INSERT INTO likes (suggestion_id, user_id, created_at) VALUES (sid, uid, NOW());
    UPDATE suggestions SET like_count = like_count + 1 WHERE id = sid RETURNING like_count INTO new_like_count;
    RETURN QUERY SELECT true, new_like_count;
  END IF;
END;
$ LANGUAGE plpgsql;
```

Atomically toggles like and updates like_count. **Must be called in POST like.**

### Row Level Security Policies

#### suggestions table policies
```sql
-- Allow all authenticated users to read suggestions
CREATE POLICY "suggestions_select" ON suggestions
  FOR SELECT USING (true);

-- Allow authenticated users to insert their own suggestions
CREATE POLICY "suggestions_insert" ON suggestions
  FOR INSERT WITH CHECK (auth.uid()::bigint = user_id);

-- Allow users to update only their own PENDING suggestions
CREATE POLICY "suggestions_update" ON suggestions
  FOR UPDATE USING (
    auth.uid()::bigint = user_id AND status = 'PENDING'
  );

-- Allow users to delete only their own PENDING suggestions
CREATE POLICY "suggestions_delete" ON suggestions
  FOR DELETE USING (
    auth.uid()::bigint = user_id AND status = 'PENDING'
  );
```

#### comments table policies
```sql
-- Allow all authenticated users to read comments
CREATE POLICY "comments_select" ON comments
  FOR SELECT USING (true);

-- Allow authenticated users to insert their own comments
CREATE POLICY "comments_insert" ON comments
  FOR INSERT WITH CHECK (auth.uid()::bigint = user_id);

-- Allow users to update only their own comments
CREATE POLICY "comments_update" ON comments
  FOR UPDATE USING (auth.uid()::bigint = user_id);

-- Allow users to delete only their own comments
CREATE POLICY "comments_delete" ON comments
  FOR DELETE USING (auth.uid()::bigint = user_id);
```

#### likes table policies
```sql
-- Allow all authenticated users to read likes
CREATE POLICY "likes_select" ON likes
  FOR SELECT USING (true);

-- Allow authenticated users to insert their own likes
CREATE POLICY "likes_insert" ON likes
  FOR INSERT WITH CHECK (auth.uid()::bigint = user_id);

-- Allow users to delete only their own likes
CREATE POLICY "likes_delete" ON likes
  FOR DELETE USING (auth.uid()::bigint = user_id);
```

## Correctness Properties


*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Authentication Round Trip

*For any* valid email and password combination, signing in then retrieving the user profile should return the same user information that was used during signup.

**Validates: Requirements 1.1, 1.2, 1.5**

### Property 2: Session Invalidation

*For any* valid session, after signing out, any subsequent authenticated request using that session token should return a 401 Unauthorized response.

**Validates: Requirements 1.3, 1.4, 1.8**

### Property 3: Password Change Round Trip

*For any* authenticated user, after changing their password, they should be able to sign in with the new password and not with the old password.

**Validates: Requirements 1.7**

### Property 4: Profile Update Persistence

*For any* authenticated user and valid profile data, after updating their profile, retrieving the profile should return the updated data.

**Validates: Requirements 1.6**

### Property 5: Suggestion Creation Ownership

*For any* authenticated user creating a suggestion, the created suggestion should have the user_id field set to that user's ID.

**Validates: Requirements 3.2**

### Property 6: Suggestion Retrieval Completeness

*For any* created suggestion, retrieving it by ID should return all fields including nested user information.

**Validates: Requirements 3.3**

### Property 7: Suggestion Update Authorization

*For any* suggestion, only the user who created it should be able to update it, and only when the status is PENDING.

**Validates: Requirements 3.4, 10.1**

### Property 8: Suggestion Delete Authorization

*For any* suggestion, only the user who created it should be able to delete it, and only when the status is PENDING.

**Validates: Requirements 3.5, 10.1**

### Property 9: Like Toggle Idempotence

*For any* suggestion and authenticated user, toggling like twice should return to the original like state (liked → unliked → liked, or unliked → liked → unliked).

**Validates: Requirements 3.6**

### Property 10: Comment Creation Ownership

*For any* authenticated user creating a comment on a suggestion, the created comment should have the user_id field set to that user's ID.

**Validates: Requirements 3.8**

### Property 11: Comment Authorization

*For any* comment, only the user who created it should be able to update or delete it.

**Validates: Requirements 10.2**

### Property 12: User Suggestions Filtering

*For any* authenticated user, requesting their suggestions via `/api/suggestions/my` should return only suggestions where user_id matches their ID.

**Validates: Requirements 3.9**

### Property 13: Suggestion Filtering Correctness

*For any* combination of status, type, and region filters, all returned suggestions should match all specified filter criteria.

**Validates: Requirements 3.12**

### Property 14: Suggestion Sorting Correctness

*For any* sort key (latest, popular, status), the returned suggestions should be ordered according to that sort criterion.

**Validates: Requirements 3.13**

### Property 15: Pagination Boundaries

*For any* page number and page size, the returned results should contain at most `size` items, and the items should correspond to the correct page offset.

**Validates: Requirements 3.14**

### Property 16: Search Term Presence

*For any* search term, all returned suggestions should contain that search term in at least one of: title, content, or address fields.

**Validates: Requirements 3.15**

### Property 17: Geographic Bounds Filtering

*For any* geographic bounds (min/max latitude/longitude), all returned map data (crosswalks and accident hotspots) should have coordinates within those bounds.

**Validates: Requirements 4.1, 4.2**

### Property 18: District Filtering

*For any* province parameter, all returned cities should belong to that province.

**Validates: Requirements 2.3, 5.2**

### Property 19: Available District Filtering

*For any* district query, all returned districts should have the `available` flag set to 1.

**Validates: Requirements 5.4**

### Property 20: Region Aggregation Correctness

*For any* region parameter, the returned accident summary data should aggregate only accidents from that region.

**Validates: Requirements 6.1, 6.2**

### Property 21: API Contract Preservation

*For any* migrated API endpoint, the response structure (field names, nesting, types) should match the original Backend_Server response format.

**Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 3.11**

### Property 22: Cache Invalidation Resilience

*For any* data mutation operation (create, update, delete), if cache invalidation fails, the operation should still succeed and return the correct response.

**Validates: Requirements 8.4**

### Property 23: Error Response Correctness

*For any* error condition (authentication failure, authorization failure, not found, validation failure, internal error), the response should have the appropriate HTTP status code (401, 403, 404, 400, 500) and a descriptive error message.

**Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5, 9.6**

### Property 24: RLS Read Access

*For any* authenticated user, they should be able to read all public suggestions, comments, dashboard data, and map data.

**Validates: Requirements 10.3, 10.6**

### Property 25: RLS Create Access

*For any* authenticated user, they should be able to create suggestions and comments.

**Validates: Requirements 10.4, 10.5**

### Property 26: OAuth User Management

*For any* successful OAuth authentication, the system should either create a new user (if email doesn't exist) or retrieve the existing user (if email exists).

**Validates: Requirements 11.4**

### Property 27: OAuth Error Handling

*For any* OAuth authentication failure, the system should return an appropriate error response without creating a user.

**Validates: Requirements 11.5**

### Property 28: Suggestion List Query Efficiency

*For any* suggestions list request with filters, the system should execute a single Supabase query with joins rather than multiple separate queries.

**Validates: Requirements 13.2**

## Error Handling

### Error Categories

1. **Authentication Errors (401)**
   - Invalid or expired session token
   - Missing authentication credentials
   - Supabase Auth service unavailable

2. **Authorization Errors (403)**
   - User attempting to modify another user's content
   - User attempting to modify non-PENDING suggestions
   - RLS policy violations

3. **Validation Errors (400)**
   - Missing required fields
   - Invalid field formats
   - Invalid parameter values

4. **Not Found Errors (404)**
   - Requested resource doesn't exist
   - Invalid ID parameters

5. **Internal Errors (500)**
   - Supabase query failures
   - Database connection errors
   - Unexpected exceptions

### Error Response Format

All errors should follow this consistent format:

```typescript
{
  error: string;           // Human-readable error message
  details?: any;           // Optional additional error details
}
```

### Error Handling Strategy

1. **Catch all exceptions** at the API route level
2. **Log errors** with sufficient context for debugging
3. **Return appropriate status codes** based on error type
4. **Provide descriptive messages** without exposing sensitive information
5. **Gracefully degrade** when possible (e.g., cache invalidation failures)

### Example Error Handling Pattern

```typescript
export async function GET(request: NextRequest) {
  try {
    // Validate authentication
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    // Execute query
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("suggestions")
      .select("*")
      .eq("user_id", user.id);

    if (error) {
      console.error("Supabase query error:", error);
      return NextResponse.json(
        { error: "데이터 조회 중 오류가 발생했습니다.", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

## Testing Strategy

### Dual Testing Approach

The migration will use both unit tests and property-based tests to ensure comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, and error conditions
- **Property tests**: Verify universal properties across all inputs

Together, these provide comprehensive coverage where unit tests catch concrete bugs and property tests verify general correctness.

### Property-Based Testing

**Library**: We will use **fast-check** for TypeScript property-based testing.

**Configuration**:
- Minimum 100 iterations per property test
- Each property test must reference its design document property
- Tag format: `// Feature: backend-to-supabase-migration, Property {number}: {property_text}`

**Example Property Test**:

```typescript
import fc from 'fast-check';
import { describe, it, expect } from 'vitest';

describe('Suggestion Creation', () => {
  // Feature: backend-to-supabase-migration, Property 5: Suggestion Creation Ownership
  it('should set user_id to authenticated user for all created suggestions', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 100 }),
          content: fc.string({ minLength: 1, maxLength: 1000 }),
          suggestion_type: fc.constantFrom('CROSSWALK', 'TRAFFIC_LIGHT', 'SPEED_BUMP'),
          location_lat: fc.double({ min: -90, max: 90 }),
          location_lon: fc.double({ min: -180, max: 180 }),
          address: fc.string({ minLength: 1, maxLength: 200 }),
        }),
        fc.integer({ min: 1, max: 1000 }), // user_id
        async (suggestionData, userId) => {
          // Create suggestion as user
          const response = await createSuggestion(suggestionData, userId);
          
          // Verify user_id matches
          expect(response.user_id).toBe(userId);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Unit Testing

**Focus Areas**:
- Specific examples of each API endpoint
- Edge cases (empty strings, boundary values, null handling)
- Error conditions (invalid IDs, missing fields, unauthorized access)
- Data transformation correctness
- Cache invalidation calls

**Example Unit Test**:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { GET } from '@/app/api/suggestions/route';

describe('GET /api/suggestions', () => {
  it('should return suggestions list with default pagination', async () => {
    const request = new Request('http://localhost:3000/api/suggestions');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('content');
    expect(data).toHaveProperty('totalElements');
    expect(data).toHaveProperty('totalPages');
    expect(data).toHaveProperty('currentPage');
    expect(data).toHaveProperty('size');
    expect(Array.isArray(data.content)).toBe(true);
  });

  it('should filter suggestions by status', async () => {
    const request = new Request('http://localhost:3000/api/suggestions?status=PENDING');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    data.content.forEach((suggestion: any) => {
      expect(suggestion.status).toBe('PENDING');
    });
  });

  it('should return 401 for unauthenticated POST requests', async () => {
    const request = new Request('http://localhost:3000/api/suggestions', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Test',
        content: 'Test content',
        suggestion_type: 'CROSSWALK',
        location_lat: 37.5,
        location_lon: 127.0,
        address: 'Test address',
      }),
    });
    const response = await POST(request);

    expect(response.status).toBe(401);
  });
});
```

### Integration Testing

**Focus Areas**:
- End-to-end API flows (create → read → update → delete)
- Authentication and authorization flows
- Multi-step operations (like toggle, comment creation)
- Cache invalidation effects

**Example Integration Test**:

```typescript
import { describe, it, expect } from 'vitest';

describe('Suggestion Lifecycle', () => {
  it('should support full CRUD lifecycle', async () => {
    // Sign in
    const authResponse = await signIn('test@example.com', 'password');
    const token = authResponse.session.access_token;

    // Create suggestion
    const createResponse = await createSuggestion({
      title: 'Test Suggestion',
      content: 'Test content',
      suggestion_type: 'CROSSWALK',
      location_lat: 37.5,
      location_lon: 127.0,
      address: 'Test address',
    }, token);
    expect(createResponse.status).toBe(201);
    const suggestionId = createResponse.data.id;

    // Read suggestion
    const readResponse = await getSuggestion(suggestionId);
    expect(readResponse.status).toBe(200);
    expect(readResponse.data.title).toBe('Test Suggestion');

    // Update suggestion
    const updateResponse = await updateSuggestion(suggestionId, {
      title: 'Updated Suggestion',
    }, token);
    expect(updateResponse.status).toBe(200);
    expect(updateResponse.data.title).toBe('Updated Suggestion');

    // Delete suggestion
    const deleteResponse = await deleteSuggestion(suggestionId, token);
    expect(deleteResponse.status).toBe(200);

    // Verify deletion
    const verifyResponse = await getSuggestion(suggestionId);
    expect(verifyResponse.status).toBe(404);
  });
});
```

### Test Coverage Goals

- **API Routes**: 100% of migrated routes have tests
- **Authentication**: All auth flows tested
- **Authorization**: All RLS policies tested
- **Error Handling**: All error conditions tested
- **Data Transformation**: All transformation functions tested
- **Property Tests**: All correctness properties implemented

### Testing Database Setup

For testing, we will use:
1. **Supabase local development** with Docker for integration tests
2. **Test database seeding** with known data for predictable tests
3. **Transaction rollback** after each test to maintain isolation
4. **Mock Supabase client** for unit tests where appropriate

## Migration Strategy

### Implementation Approach

The migration is simplified because **reference implementations already exist** in the `reference/api/` folder. Most routes are already implemented with Supabase queries and can be copied directly to `src/app/api/`.

**Key Insight**: Instead of writing new code, we will:
1. Copy Supabase-based implementations from `reference/api/` to `src/app/api/`
2. Verify and adjust any differences in data transformation
3. Ensure authentication and authorization work correctly
4. Test each migrated route

### Phase 1: Direct File Replacement (Simple Routes)

These routes have complete Supabase implementations in `reference/api/` and can be copied directly:

**Dashboard Routes:**
- `reference/api/dashboard/kpi/route.ts` → `src/app/api/dashboard/kpi/route.ts`
- `reference/api/dashboard/provinces/route.ts` → `src/app/api/dashboard/provinces/route.ts`
- `reference/api/dashboard/cities/route.ts` → `src/app/api/dashboard/cities/route.ts`

**Map Routes:**
- `reference/api/map/crosswalks/route.ts` → `src/app/api/map/crosswalks/route.ts`
- `reference/api/map/acc_hotspots/route.ts` → `src/app/api/map/acc_hotspots/route.ts`

**District Routes:**
- `reference/api/district/provinces/route.ts` → `src/app/api/district/provinces/route.ts`
- `reference/api/district/cities/route.ts` → `src/app/api/district/cities/route.ts`

**Pedestrian Accident Routes:**
- `reference/api/pedacc/summary/route.ts` → `src/app/api/pedacc/summary/route.ts`

**Suggestions Routes:**
- `reference/api/suggestions/route.ts` → `src/app/api/suggestions/route.ts` (GET, POST)
- `reference/api/suggestions/[id]/route.ts` → `src/app/api/suggestions/[id]/route.ts` (GET, PUT, DELETE)
- `reference/api/suggestions/[id]/comments/route.ts` → `src/app/api/suggestions/[id]/comments/route.ts` (GET, POST only - **PUT/DELETE need implementation**)
- `reference/api/suggestions/my/route.ts` → `src/app/api/suggestions/my/route.ts` (GET)

### Phase 2: Routes Requiring Implementation or Adaptation

These routes need new code or modifications:

**Comment Update/Delete (Missing in reference):**
- `src/app/api/suggestions/[id]/comments/route.ts` - PUT and DELETE methods need Supabase implementation
  - Current backend implementation exists, need to convert to Supabase
  - PUT: Update comment by commentId (query param)
  - DELETE: Delete comment by commentId (query param)
  - **Important**: DELETE must call `dec_suggestion_comment_count` RPC
  - **Important**: POST must call `inc_suggestion_comment_count` RPC (currently missing)

**Like Route (Missing implementation):**
- `reference/api/suggestions/[id]/like/route.ts` - Currently uses dummy data, needs real Supabase implementation
  - Need to implement like/unlike toggle with `likes` table
  - Check if user already liked (SELECT from likes table)
  - If liked: DELETE from likes, decrement `like_count` in suggestions
  - If not liked: INSERT into likes, increment `like_count` in suggestions
  - **Recommended**: Use `toggle_suggestion_like` RPC function for atomic operation

**Regions Route (Missing in reference):**
- `src/app/api/suggestions/regions/route.ts` - No reference implementation, needs Supabase implementation
  - Current backend returns list of available regions
  - Need to query District table for available regions
  - Return region names or codes for filtering

**Authentication Routes (Still using backend):**
- `reference/api/signin/route.ts` - Still uses backendClient, needs Supabase Auth implementation
- `reference/api/signup/route.ts` - Still uses backendClient, needs Supabase Auth implementation
- `reference/api/signout/route.ts` - Still uses backendClient, needs Supabase Auth implementation
- `reference/api/me/route.ts` - Still uses backendClient, needs Supabase implementation (GET and PATCH)
- `src/app/api/auth/change-password/route.ts` - No reference, needs Supabase Auth implementation
- `src/app/api/auth/refresh/route.ts` - No reference, needs Supabase Auth implementation

**OAuth Routes (Missing in reference or different path):**
- `src/app/api/oauth2/start/[provider]/route.ts` - No reference (reference has `/oauth2/authorization/[provider]`), needs Supabase OAuth
- `src/app/api/oauth2/callback/route.ts` - No reference, needs Supabase OAuth callback implementation

### Phase 3: Helper Modules (Optional)

If needed during implementation, create helper modules:
- `src/lib/supabase/auth.ts` - Authentication helpers
- `src/lib/supabase/transforms.ts` - Data transformation utilities
- `src/lib/supabase/queries.ts` - Query builder utilities

### Phase 4: Testing and Validation

1. Test each migrated route individually
2. Verify data transformation matches expected format
3. Test authentication and authorization flows
4. Verify cache invalidation works correctly
5. Run integration tests for complete workflows

### Phase 5: Cleanup

1. Remove all `backendClient` imports
2. Remove `BACKEND_URL` environment variable
3. Remove unused backend-related code
4. Update documentation

### Rollback Strategy

If issues are discovered during migration:
1. Keep original files backed up (they're already in git history)
2. Test each route individually before moving to the next
3. Monitor error rates and performance metrics
4. Rollback individual routes if needed by reverting the file
5. Full rollback possible by reverting all changes

### Success Criteria

- All API routes migrated from reference folder
- All routes tested and working correctly
- No `backendClient` imports remaining in migrated routes
- Application runs standalone without backend server (for migrated routes)
- Performance equal to or better than backend-based approach
- Successful deployment to Vercel
- All existing frontend functionality works unchanged
