# Design Document: Board Filters Sort Fix

## Overview

This design addresses a parameter name mismatch between the BoardFilters component and the Board page that prevents sorting functionality from working correctly. The fix involves standardizing on the parameter name `sortBy` throughout the codebase to ensure consistency between the UI component, URL parameters, and API requests. Since the codebase already uses `sortBy` in the FilterState interface and component logic, we will update the URL parameter reading and API calls to use `sortBy` instead of `sort`.

## Architecture

The board filtering system follows a client-server architecture:

1. **Client Side (BoardFilters.tsx)**: React component that manages filter UI state and updates URL parameters
2. **Server Side (page.tsx)**: Next.js server component that reads URL parameters and fetches data from the API
3. **Type Definitions (types.ts)**: Shared TypeScript interfaces for type safety

The data flow is:
```
User Selection → BoardFilters → URL Update → Page Reload → Server Component → API Request → Rendered Results
```

## Components and Interfaces

### FilterState Interface (types.ts)

**Current Implementation:**
```typescript
export interface FilterState {
  status: string;
  type: string;
  region: string;
  sortBy: string;  // ✅ Already correct
}
```

**No changes needed** - The FilterState interface already uses `sortBy` which is the correct naming convention.

**Rationale:** The interface already uses `sortBy` consistently. We will update other parts of the codebase to match this naming.

### BoardFilters Component (BoardFilters.tsx)

**Changes Required:**

The component already uses `filters.sortBy` and `handleFilterChange('sortBy', ...)` correctly. No changes needed to the component logic itself. The component already matches the FilterState interface.

**Current Implementation (Already Correct):**
```typescript
// Filter state already uses sortBy
const [filters, setFilters] = useState<FilterState>(initialFilters);

// Sort dropdown already uses sortBy
<select
  value={filters.sortBy}  // ✅ Already correct
  onChange={(e) => handleFilterChange('sortBy', e.target.value)}  // ✅ Already correct
  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
>
  <option value="latest">최신순</option>
  <option value="popular">인기순</option>
  <option value="priority">우선순위순</option>
  <option value="status">상태순</option>
</select>
```

**Note:** The BoardFilters component implementation is already correct. No changes needed here.

### Board Page Component (page.tsx)

**Changes Required:**

1. **Update PageProps interface** to use `sortBy` instead of `sort`:

**Current:**
```typescript
interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    status?: string;
    type?: string;
    region?: string;
    sort?: string;  // ❌ Should be sortBy
  }>;
}
```

**Updated:**
```typescript
interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    status?: string;
    type?: string;
    region?: string;
    sortBy?: string;  // ✅ Consistent with FilterState
  }>;
}
```

2. **Update getSuggestions function parameter** to use `sortBy`:

**Current:**
```typescript
async function getSuggestions(params: {
  page?: string;
  search?: string;
  status?: string;
  type?: string;
  region?: string;
  sort?: string;  // ❌ Should be sortBy
}) {
  // ...
  const searchParams = new URLSearchParams({
    // ...
    sort: params.sort || 'latest'  // ❌ Should be sortBy
  });
```

**Updated:**
```typescript
async function getSuggestions(params: {
  page?: string;
  search?: string;
  status?: string;
  type?: string;
  region?: string;
  sortBy?: string;  // ✅ Consistent with FilterState
}) {
  // ...
  const searchParams = new URLSearchParams({
    // ...
    sortBy: params.sortBy || 'latest'  // ✅ Consistent parameter name
  });
```

3. **Update initialFilters prop** passed to BoardFilters:

**Current:**
```typescript
<BoardFilters
  initialValue={params.search || ''}
  initialFilters={{
    status: params.status || 'ALL',
    type: params.type || 'ALL',
    region: params.region || 'ALL',
    sortBy: params.sort || 'latest'  // ❌ Reading from wrong parameter
  }}
/>
```

**Updated:**
```typescript
<BoardFilters
  initialValue={params.search || ''}
  initialFilters={{
    status: params.status || 'ALL',
    type: params.type || 'ALL',
    region: params.region || 'ALL',
    sortBy: params.sortBy || 'latest'  // ✅ Reading from correct parameter
  }}
/>
```

## Data Models

No changes to data models are required. The FilterState interface already uses `sortBy` correctly. The fix only affects the URL parameter reading and API request construction in the page component.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Sort Parameter URL Updates

*For any* valid sort option selection ('latest', 'popular', 'priority', 'status'), when a user changes the sort dropdown, the URL SHALL be updated with the `sortBy` parameter containing the selected value.

**Validates: Requirements 2.1**

### Property 2: Sort Values Produce Correct Ordering

*For any* valid sort parameter value ('latest', 'popular', 'priority', 'status'), when that value is applied, the returned suggestions SHALL be ordered according to the specified sorting criterion.

**Validates: Requirements 2.2, 2.4**

### Property 3: Filter Integration Preservation

*For any* combination of filter parameters (status, type, region, search) applied together with the sort parameter, all filters SHALL work correctly and produce results that satisfy all filter criteria simultaneously.

**Validates: Requirements 3.1**

### Property 4: Pagination Integration Preservation

*For any* page number combined with a sort parameter, the pagination SHALL work correctly and display the appropriate page of sorted results.

**Validates: Requirements 3.2**

### Property 5: Page Reset on Filter Change

*For any* current page number greater than 1, when any filter (including sort) is changed, the page parameter SHALL be reset to page 1.

**Validates: Requirements 3.3**

## Error Handling

This fix does not introduce new error conditions. The existing error handling for invalid parameters and API failures remains unchanged:

- Invalid sort values will fall back to the default 'latest' sorting
- API errors are caught and logged, returning empty results
- Missing parameters default to sensible values ('ALL' for filters, 'latest' for sort)

## Testing Strategy

### Unit Tests

Unit tests should verify specific examples and edge cases:

1. **Default Sorting Behavior**: Verify that when no `sortBy` parameter is provided, the system defaults to 'latest' sorting (Requirements 2.3)
2. **Parameter Name Consistency**: Verify that the FilterState interface uses `sortBy` as the property name
3. **Component Integration**: Verify that BoardFilters correctly reads and writes the `sortBy` parameter
4. **API Request Construction**: Verify that the API request is constructed with the `sortBy` parameter

### Property-Based Tests

Property-based tests should verify universal properties across all inputs. Each test should run a minimum of 100 iterations to ensure comprehensive coverage.

1. **Property 1 Test**: Generate random sort option selections and verify URL updates with correct `sortBy` parameter
   - **Tag**: Feature: board-filters-sort-fix, Property 1: Sort Parameter URL Updates

2. **Property 2 Test**: Generate random sortBy values and verify results are correctly ordered
   - **Tag**: Feature: board-filters-sort-fix, Property 2: Sort Values Produce Correct Ordering

3. **Property 3 Test**: Generate random combinations of filters with sortBy and verify all work together
   - **Tag**: Feature: board-filters-sort-fix, Property 3: Filter Integration Preservation

4. **Property 4 Test**: Generate random page numbers with sortBy parameters and verify pagination works
   - **Tag**: Feature: board-filters-sort-fix, Property 4: Pagination Integration Preservation

5. **Property 5 Test**: Generate random filter changes from non-first pages and verify page reset
   - **Tag**: Feature: board-filters-sort-fix, Property 5: Page Reset on Filter Change

### Testing Framework

For this TypeScript/React project, we should use:
- **Jest** or **Vitest** for unit testing
- **@testing-library/react** for component testing
- **fast-check** for property-based testing

Property-based tests should be configured to run at least 100 iterations per test to ensure comprehensive input coverage through randomization.
