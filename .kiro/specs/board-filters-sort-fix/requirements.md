# Requirements Document

## Introduction

This specification addresses a parameter name mismatch in the board filters sorting functionality. The BoardFilters component uses `sortBy` as the filter key, while the board page expects `sort` as the URL parameter. This inconsistency prevents the sorting selection from being applied when fetching suggestions from the API. Since the codebase already uses `sortBy` extensively, we will standardize on `sortBy` and update the URL parameter and API calls to match.

## Glossary

- **BoardFilters**: The client-side React component that renders filter controls including sort options
- **Board_Page**: The Next.js server component that fetches suggestions and renders the board page
- **Filter_State**: The TypeScript interface defining the structure of filter parameters
- **URL_Parameter**: Query string parameters passed in the browser URL
- **Sort_Parameter**: The specific parameter used to control sorting order of suggestions

## Requirements

### Requirement 1: Parameter Name Consistency

**User Story:** As a developer, I want consistent parameter naming across components, so that the sorting functionality works correctly and the codebase is maintainable.

#### Acceptance Criteria

1. THE Filter_State interface SHALL use `sortBy` as the property name for sorting
2. THE BoardFilters component SHALL use `sortBy` when reading from URL parameters
3. THE BoardFilters component SHALL use `sortBy` when updating URL parameters
4. THE Board_Page component SHALL use `sortBy` when passing initial filter values to BoardFilters
5. THE Board_Page component SHALL use `sortBy` when constructing API requests

### Requirement 2: Sorting Functionality

**User Story:** As a user, I want to sort suggestions by different criteria, so that I can view the list in my preferred order.

#### Acceptance Criteria

1. WHEN a user selects a sort option, THEN the System SHALL update the URL with the `sortBy` parameter
2. WHEN the URL contains a `sortBy` parameter, THEN the System SHALL apply that sorting to the suggestions list
3. WHEN no sort parameter is provided, THEN the System SHALL default to 'latest' sorting
4. THE System SHALL support the following sort values: 'latest', 'popular', 'priority', 'status'

### Requirement 3: Backward Compatibility

**User Story:** As a system maintainer, I want to ensure existing functionality remains intact, so that the fix doesn't introduce new bugs.

#### Acceptance Criteria

1. WHEN the parameter name is changed, THEN all other filter parameters (status, type, region, search) SHALL continue to work correctly
2. WHEN the parameter name is changed, THEN the pagination functionality SHALL continue to work correctly
3. WHEN filters are applied, THEN the page SHALL reset to page 1 as expected
