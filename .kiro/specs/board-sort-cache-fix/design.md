# Design Document: Board Sort and Cache Fix

## Overview

This design addresses two critical issues in the Next.js board/suggestions feature:

1. **Sorting UI not updating**: When users change sort order, the backend processes the request correctly (Hibernate SQL shows proper sorting), but the frontend UI doesn't reflect the changes
2. **Stale data after deletion**: When users delete posts, the deletion succeeds on the backend, but the board list continues to show the deleted post until manual refresh

The root causes are:
- **ISR caching**: The board page uses `revalidate: 60` which caches responses for 60 seconds
- **Missing cache invalidation**: The DELETE endpoint doesn't call `revalidatePath` to invalidate cached pages
- **Client-side navigation**: Using `router.push('/board')` after deletion may serve cached content
- **Sort parameter handling**: The sort dropdown updates URL params, but the server component doesn't re-fetch due to ISR cache

Our solution uses Next.js cache invalidation APIs (`revalidatePath`, `revalidateTag`) combined with proper router navigation patterns to ensure users always see fresh data after mutations.

## Architecture

### Current Architecture

```
User Action (Sort/Delete)
    ↓
Client Component (BoardFilters/SuggestionDetailClient)
    ↓
Next.js API Route (/api/suggestions/*)
    ↓
SpringBoot Backend
    ↓
Database (Hibernate)
```

**Problem**: After backend updates, Next.js serves cached pages for up to 60 seconds.

### Proposed Architecture

```
User Action (Sort/Delete)
    ↓
Client Component
    ↓
Next.js API Route
    ↓
SpringBoot Backend
    ↓
Database
    ↓
Cache Invalidation (revalidatePath)
    ↓
Fresh Data on Next Navigation
```

**Solution**: Add cache invalidation after mutations and ensure proper navigation.

### Key Changes

1. **DELETE endpoint**: Add `revalidatePath('/board')` and `revalidatePath('/board/[id]')` after successful deletion
2. **Navigation strategy**: Use `router.push('/board')` with proper cache invalidation, or use `router.refresh()` to force re-fetch
3. **Sort handling**: Ensure URL parameter changes trigger server component re-renders with fresh data
4. **Error handling**: Wrap cache invalidation in try-catch to prevent blocking user operations

## Components and Interfaces

### 1. API Route: `/api/suggestions/[id]/route.ts` (DELETE handler)

**Current Implementation**:
```typescript
export async function DELETE(request, { params }) {
  // ... authentication and backend call ...
  await backendClient.delete(`/api/suggestions/${suggestionId}`, {
    headers: { Cookie: cookieHeader },
  });
  
  return NextResponse.json({ message: "건의사항이 삭제되었습니다." });
}
```

**Problem**: No cache invalidation after deletion.

**Proposed Implementation**:
```typescript
import { revalidatePath } from "next/cache";

export async function DELETE(request, { params }) {
  // ... authentication and backend call ...
  await backendClient.delete(`/api/suggestions/${suggestionId}`, {
    headers: { Cookie: cookieHeader },
  });
  
  // Invalidate cache for board list and detail page
  try {
    revalidatePath('/board', 'page');
    revalidatePath(`/board/${suggestionId}`, 'page');
    console.log(`Cache invalidated for /board and /board/${suggestionId}`);
  } catch (revalidateError) {
    console.error('Cache revalidation error:', revalidateError);
    // Don't fail the request if cache invalidation fails
  }
  
  return NextResponse.json({ message: "건의사항이 삭제되었습니다." });
}
```

**Changes**:
- Import `revalidatePath` from `next/cache`
- Call `revalidatePath('/board', 'page')` to invalidate the board list cache
- Call `revalidatePath('/board/[id]', 'page')` to invalidate the detail page cache
- Wrap in try-catch to handle errors gracefully
- Log success/failure for debugging

### 2. Client Component: `SuggestionDetailClient.tsx` (Delete handler)

**Current Implementation**:
```typescript
const handleDeleteSuggestion = async () => {
  if (!confirm('정말 이 건의사항을 삭제하시겠습니까?')) return;
  
  const response = await fetch(`/api/suggestions/${suggestion.id}`, {
    method: 'DELETE',
    credentials: 'include'
  });
  
  if (response.ok) {
    alert('건의사항이 삭제되었습니다.');
    router.push('/board');
  }
};
```

**Problem**: `router.push('/board')` may serve cached content even after `revalidatePath` is called.

**Proposed Implementation**:
```typescript
const handleDeleteSuggestion = async () => {
  if (!confirm('정말 이 건의사항을 삭제하시겠습니까?')) return;
  
  const response = await fetch(`/api/suggestions/${suggestion.id}`, {
    method: 'DELETE',
    credentials: 'include'
  });
  
  if (response.ok) {
    alert('건의사항이 삭제되었습니다.');
    // Use router.push with a timestamp to bust client-side cache
    router.push('/board?refresh=' + Date.now());
  }
};
```

**Alternative Implementation** (if timestamp approach doesn't work):
```typescript
const handleDeleteSuggestion = async () => {
  if (!confirm('정말 이 건의사항을 삭제하시겠습니까?')) return;
  
  const response = await fetch(`/api/suggestions/${suggestion.id}`, {
    method: 'DELETE',
    credentials: 'include'
  });
  
  if (response.ok) {
    alert('건의사항이 삭제되었습니다.');
    // Force a hard navigation to bypass router cache
    window.location.href = '/board';
  }
};
```

**Changes**:
- Add cache-busting query parameter to force fresh fetch
- Alternative: Use `window.location.href` for hard navigation (bypasses all Next.js caching)

### 3. Server Component: `board/page.tsx` (Sort handling)

**Current Implementation**:
```typescript
async function getSuggestions(params) {
  const response = await fetch(`${baseUrl}/api/suggestions?${searchParams}`, {
    next: { revalidate: 60 },
    headers: { 'Content-Type': 'application/json' },
  });
  // ...
}
```

**Problem**: The 60-second ISR cache means sort changes may not be reflected immediately.

**Proposed Implementation**:
```typescript
async function getSuggestions(params) {
  // Include all params in cache key by using them in the URL
  const searchParams = new URLSearchParams({
    page: params.page || '1',
    size: '10',
    search: params.search || '',
    status: params.status && params.status !== 'ALL' ? params.status : '',
    type: params.type && params.type !== 'ALL' ? params.type : '',
    region: params.region && params.region !== 'ALL' ? params.region : '',
    sortBy: params.sortBy || 'latest'
  });
  
  // Remove empty params
  Array.from(searchParams.keys()).forEach(key => {
    if (!searchParams.get(key)) {
      searchParams.delete(key);
    }
  });
  
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  
  // Use cache tags for more granular invalidation
  const response = await fetch(`${baseUrl}/api/suggestions?${searchParams}`, {
    next: { 
      revalidate: 60,
      tags: ['suggestions-list']
    },
    headers: { 'Content-Type': 'application/json' },
  });
  // ...
}
```

**Changes**:
- Add cache tags for more granular invalidation
- Ensure all URL parameters are included in the fetch URL (they already are)
- The ISR cache will automatically create separate cache entries for different parameter combinations

### 4. Client Component: `BoardFilters.tsx` (Sort dropdown)

**Current Implementation**:
```typescript
const handleFilterChange = (key: keyof FilterState, value: string) => {
  const newFilters = { ...filters, [key]: value };
  setFilters(newFilters);
  updateURL({ [key]: value });
};

const updateURL = (updates) => {
  const params = new URLSearchParams(searchParams);
  Object.entries(updates).forEach(([key, value]) => {
    if (value && value !== 'ALL') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
  });
  if (!updates.page) {
    params.delete('page');
  }
  router.push(`/board?${params.toString()}`);
};
```

**Analysis**: This implementation is actually correct. The issue is not with the client-side code, but with the server-side caching.

**Proposed Enhancement**:
```typescript
const handleFilterChange = (key: keyof FilterState, value: string) => {
  const newFilters = { ...filters, [key]: value };
  setFilters(newFilters);
  updateURL({ [key]: value });
};

const updateURL = (updates) => {
  const params = new URLSearchParams(searchParams);
  Object.entries(updates).forEach(([key, value]) => {
    if (value && value !== 'ALL') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
  });
  if (!updates.page) {
    params.delete('page');
  }
  
  // Use router.push which will trigger server component re-render
  // The server component will fetch with new params
  router.push(`/board?${params.toString()}`);
};
```

**Changes**: No changes needed. The component already works correctly. The fix is on the server side (ensuring ISR creates separate cache entries per parameter combination).

## Data Models

No new data models are required. We're working with existing types:

```typescript
interface Suggestion {
  id: number;
  title: string;
  content: string;
  location_lat: number;
  location_lon: number;
  address: string;
  sido: string;
  sigungu: string;
  suggestion_type: string;
  status: string;
  priority_score: number;
  like_count: number;
  view_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
  user_id: number;
  user?: {
    id: number;
    name: string;
    picture: string | null;
  };
}

interface FilterState {
  status: string;
  type: string;
  region: string;
  sortBy: string;
}
```


## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property Reflection

After analyzing all acceptance criteria, I identified the following redundancies:
- Properties 1.1 and 5.1 are identical (both test URL parameter updates on sort selection) - keeping 1.1
- Properties 1.2 and 4.2 overlap significantly (both test that URL params are used in fetch) - combining into one comprehensive property
- Properties 3.2 and 3.3 are very similar (both test updated content display) - combining into one property
- Several properties test Next.js internal behavior (2.2, 4.3, 8.2, 8.3) which cannot be directly tested - excluding these
- Properties 2.1, 3.1, 6.1, 6.2, 6.4, 7.1-7.4, 8.1 are specific examples rather than universal properties - will be covered by unit tests

### Universal Properties

Property 1: Sort parameter URL synchronization
*For any* sort option selection (latest, popular, priority, status), when a user changes the sort dropdown, the URL search parameters should be updated with the corresponding sortBy value
**Validates: Requirements 1.1**

Property 2: Sort parameter transformation
*For any* sortBy parameter value (latest, popular, priority, status), when the API route receives it, the transformation to Spring Data sort format should produce the correct sort string (createdAt,desc | likeCount,desc | priorityScore,desc | status,asc)
**Validates: Requirements 1.3**

Property 3: Sorted data display order
*For any* sortBy parameter, when suggestions are fetched and rendered, the displayed list should be ordered according to the sort criterion (latest: newest first, popular: highest likes first, priority: highest score first, status: alphabetical)
**Validates: Requirements 1.4**

Property 4: Pagination reset on sort change
*For any* sort parameter change, when the sort option is modified, the page parameter should be reset to 1
**Validates: Requirements 1.5**

Property 5: URL parameters used in data fetching
*For any* combination of URL search parameters (page, search, status, type, region, sortBy), when the board page loads, all parameters should be included in the fetch request to the API
**Validates: Requirements 1.2, 4.2**

Property 6: Deleted suggestion not in list
*For any* suggestion that has been successfully deleted, when the board list is rendered after deletion, the deleted suggestion ID should not appear in the displayed list
**Validates: Requirements 2.4**

Property 7: Updated content displayed
*For any* suggestion that has been successfully updated, when the board list or detail page is rendered after the update, the displayed content should match the updated values
**Validates: Requirements 3.2, 3.3**

Property 8: Sort dropdown reflects URL parameter
*For any* sortBy value in the URL (latest, popular, priority, status), when the BoardFilters component renders, the dropdown should display the corresponding option as selected
**Validates: Requirements 5.2, 5.3**

### Edge Cases and Examples

The following are specific examples and edge cases that will be covered by unit tests rather than property-based tests:

- **Example 1**: When no sortBy parameter exists in URL, default to "latest" (Requirement 5.4)
- **Example 2**: When revalidatePath is called after deletion, verify it's called with '/board' and '/board/[id]' (Requirement 2.1)
- **Example 3**: When revalidatePath throws an error, verify error is caught and logged (Requirement 6.1)
- **Example 4**: When cache invalidation fails, verify API still returns success if backend operation succeeded (Requirement 6.2)
- **Example 5**: When user deletes a suggestion, verify router.push is called with cache-busting parameter (Requirement 8.1)
- **Example 6**: Optimistic UI updates for like button, comments, and deletions (Requirement 7.1-7.4)

## Error Handling

### Cache Invalidation Errors

**Strategy**: Graceful degradation - cache errors should never block user operations.

```typescript
try {
  revalidatePath('/board', 'page');
  revalidatePath(`/board/${suggestionId}`, 'page');
  console.log(`Cache invalidated for /board and /board/${suggestionId}`);
} catch (revalidateError) {
  console.error('Cache revalidation error:', revalidateError);
  // Don't fail the request - user operation succeeded
}
```

**Rationale**: If cache invalidation fails, the worst case is that users see stale data for up to 60 seconds (ISR revalidation period). This is acceptable compared to blocking the user's delete/update operation.

### API Call Failures

**Strategy**: Display user-friendly error messages and maintain UI consistency.

```typescript
try {
  const response = await fetch(`/api/suggestions/${id}`, { method: 'DELETE' });
  if (!response.ok) {
    const errorData = await response.json();
    alert(errorData.error || 'Operation failed');
    return;
  }
  // Success path
} catch (error) {
  console.error('Operation failed:', error);
  alert('An error occurred. Please try again.');
}
```

### Optimistic Update Rollback

**Strategy**: Revert UI state if API call fails.

```typescript
const [likeCount, setLikeCount] = useState(suggestion.like_count);

const handleLike = async () => {
  const previousCount = likeCount;
  setLikeCount(prev => prev + 1); // Optimistic update
  
  try {
    const response = await fetch(`/api/suggestions/${id}/like`, { method: 'POST' });
    if (!response.ok) {
      setLikeCount(previousCount); // Rollback
      alert('Failed to like post');
    }
  } catch (error) {
    setLikeCount(previousCount); // Rollback
    console.error('Like failed:', error);
  }
};
```

## Testing Strategy

### Dual Testing Approach

We will use both unit tests and property-based tests to ensure comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, and error conditions
- **Property tests**: Verify universal properties across all inputs

Both are complementary and necessary for comprehensive coverage. Unit tests catch concrete bugs in specific scenarios, while property tests verify general correctness across many inputs.

### Unit Testing Focus

Unit tests should focus on:
- Specific examples that demonstrate correct behavior (e.g., default sort value)
- Integration points between components (e.g., API route calling revalidatePath)
- Edge cases and error conditions (e.g., cache invalidation failures)
- Optimistic UI updates and rollback behavior

**Important**: Avoid writing too many unit tests for scenarios that property tests can cover. Property tests handle comprehensive input coverage through randomization.

### Property-Based Testing

**Library**: We'll use **fast-check** for TypeScript/JavaScript property-based testing.

**Configuration**:
- Minimum 100 iterations per property test (due to randomization)
- Each property test must reference its design document property
- Tag format: `// Feature: board-sort-cache-fix, Property {number}: {property_text}`

**Example Property Test**:
```typescript
import fc from 'fast-check';

// Feature: board-sort-cache-fix, Property 2: Sort parameter transformation
test('sortBy parameter transforms correctly to Spring Data format', () => {
  fc.assert(
    fc.property(
      fc.constantFrom('latest', 'popular', 'priority', 'status'),
      (sortBy) => {
        const expected = {
          latest: 'createdAt,desc',
          popular: 'likeCount,desc',
          priority: 'priorityScore,desc',
          status: 'status,asc'
        };
        
        const result = transformSortParameter(sortBy);
        expect(result).toBe(expected[sortBy]);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Test Coverage Requirements

1. **Property Tests** (8 properties):
   - Sort parameter URL synchronization
   - Sort parameter transformation
   - Sorted data display order
   - Pagination reset on sort change
   - URL parameters used in data fetching
   - Deleted suggestion not in list
   - Updated content displayed
   - Sort dropdown reflects URL parameter

2. **Unit Tests** (6 examples):
   - Default sort value when no parameter
   - revalidatePath called after deletion
   - Cache error handling
   - Cache failure doesn't block operations
   - Router navigation with cache-busting
   - Optimistic updates and rollback

3. **Integration Tests**:
   - End-to-end sort flow (select dropdown → URL update → fetch → render)
   - End-to-end delete flow (click delete → API call → cache invalidation → redirect → fresh list)
   - End-to-end update flow (edit suggestion → save → cache invalidation → view updated content)

### Testing Tools

- **Jest**: Test runner and assertion library
- **React Testing Library**: Component testing
- **fast-check**: Property-based testing
- **MSW (Mock Service Worker)**: API mocking for integration tests

### Test Organization

```
src/
  __tests__/
    unit/
      api/
        suggestions-delete.test.ts
        suggestions-sort.test.ts
      components/
        BoardFilters.test.tsx
        SuggestionDetailClient.test.tsx
    property/
      sort-properties.test.ts
      cache-properties.test.ts
    integration/
      board-sort-flow.test.tsx
      board-delete-flow.test.tsx
```
