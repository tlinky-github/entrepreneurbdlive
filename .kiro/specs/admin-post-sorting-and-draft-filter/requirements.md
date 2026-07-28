# Requirements Document

## Introduction

This feature enhances two AdminPosts components in the Astro/React project with improved sorting and filtering capabilities. The newer component (`astro-site/src/components/admin/AdminPosts.jsx`) needs additional sort options ("Last Edited" and "Publish Date") added to its existing Sort By dropdown, and its Date column updated to show the most contextually relevant date per post status. The legacy component (`src/pages/admin/AdminPosts.jsx`) needs a full filter/sort toolbar added from scratch (Status filter, Sort By dropdown, Sort Order dropdown), those values wired into the API call, and the same Date column smart-display logic applied.

## Glossary

- **Newer AdminPosts**: The component at `astro-site/src/components/admin/AdminPosts.jsx`, which already has Status filter, Sort By, and Sort Order dropdowns.
- **Legacy AdminPosts**: The component at `src/pages/admin/AdminPosts.jsx`, which currently only has a search input with no filter or sort controls.
- **postAPI.list()**: The API function used by both components to fetch posts; accepts parameters including `status`, `sortBy`, `sortOrder`, `search`, `limit`, and `isAdmin`.
- **Sort By**: A dropdown control that determines which post field is used as the primary sort key.
- **Sort Order**: A dropdown control that determines whether results are sorted ascending or descending.
- **Status Filter**: A dropdown control that limits returned posts to a specific publication status.
- **published_at**: The timestamp field on a post record recording when the post was published.
- **updated_at**: The timestamp field on a post record recording the last edit time of the post.
- **created_at**: The timestamp field on a post record recording when the post was first created.
- **Date Column**: The table column in each AdminPosts component that displays a date associated with a post row.
- **Select Component**: The `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue` components from `../../components/ui/select` (already available in the project).

---

## Requirements

### Requirement 1 — Newer AdminPosts: Add "Last Edited" and "Publish Date" Sort Options

**User Story:** As an admin, I want to sort posts by last-edited date or publish date, so that I can quickly find recently updated or recently published content.

#### Acceptance Criteria

1. THE Newer AdminPosts SHALL include a "Last Edited" option (value `updated_at`) in the Sort By dropdown alongside the existing "Date", "Views", and "Title" options.
2. THE Newer AdminPosts SHALL include a "Publish Date" option (value `published_at`) in the Sort By dropdown alongside the existing "Date", "Views", and "Title" options.
3. WHEN the user selects "Last Edited" from the Sort By dropdown, THE Newer AdminPosts SHALL pass `sortBy: 'updated_at'` to `postAPI.list()`.
4. WHEN the user selects "Publish Date" from the Sort By dropdown, THE Newer AdminPosts SHALL pass `sortBy: 'published_at'` to `postAPI.list()`.
5. THE Newer AdminPosts SHALL preserve all existing Sort By options ("Date" / `created_at`, "Views" / `view_count`, "Title" / `title`) without modification.
6. THE Newer AdminPosts SHALL preserve the existing Status filter and Sort Order dropdown without modification.

---

### Requirement 2 — Newer AdminPosts: Smart Date Column Display

**User Story:** As an admin, I want the Date column to show the publish date for published posts and the creation date for drafts or pending posts, so that the displayed date is always the most actionable one for the post's status.

#### Acceptance Criteria

1. WHEN a post has `status === 'published'` and a non-null `published_at` value, THE Newer AdminPosts Date Column SHALL display the formatted `published_at` date.
2. WHEN a post has `status === 'published'` and a null or undefined `published_at` value, THE Newer AdminPosts Date Column SHALL fall back to displaying the formatted `created_at` date.
3. WHEN a post has a status other than `'published'` (e.g., `'draft'` or `'pending'`), THE Newer AdminPosts Date Column SHALL display the formatted `created_at` date.
4. IF no applicable date field is available for a post, THEN THE Newer AdminPosts Date Column SHALL display `'-'`.
5. THE Newer AdminPosts SHALL use the existing `formatDate` helper function for all date formatting in the Date Column.

---

### Requirement 3 — Legacy AdminPosts: Status Filter Dropdown

**User Story:** As an admin using the legacy interface, I want to filter posts by status, so that I can view only published, draft, or pending posts at a time.

#### Acceptance Criteria

1. THE Legacy AdminPosts SHALL render a Status filter Select dropdown with four options: "All Status" (value `'all'`), "Published" (value `'published'`), "Draft" (value `'draft'`), and "Pending" (value `'pending'`).
2. THE Legacy AdminPosts SHALL initialize the Status filter state to `'all'`.
3. WHEN the user selects a status option, THE Legacy AdminPosts SHALL update the `filterStatus` state variable to the selected value.
4. WHEN `filterStatus` changes, THE Legacy AdminPosts SHALL pass `status: filterStatus` to `postAPI.list()` and reload the posts list.
5. THE Legacy AdminPosts SHALL import the Select, SelectContent, SelectItem, SelectTrigger, and SelectValue components from `../../components/ui/select`.

---

### Requirement 4 — Legacy AdminPosts: Sort By Dropdown

**User Story:** As an admin using the legacy interface, I want to sort posts by different fields, so that I can find content in the order most useful to me.

#### Acceptance Criteria

1. THE Legacy AdminPosts SHALL render a Sort By Select dropdown with five options: "Date" (value `'created_at'`), "Last Edited" (value `'updated_at'`), "Publish Date" (value `'published_at'`), "Views" (value `'view_count'`), and "Title" (value `'title'`).
2. THE Legacy AdminPosts SHALL initialize the `sortBy` state variable to `'created_at'`.
3. WHEN the user selects a Sort By option, THE Legacy AdminPosts SHALL update the `sortBy` state variable to the selected value.
4. WHEN `sortBy` changes, THE Legacy AdminPosts SHALL pass `sortBy` to `postAPI.list()` and reload the posts list.

---

### Requirement 5 — Legacy AdminPosts: Sort Order Dropdown

**User Story:** As an admin using the legacy interface, I want to choose ascending or descending sort order, so that I can control the direction of sorted results.

#### Acceptance Criteria

1. THE Legacy AdminPosts SHALL render a Sort Order Select dropdown with two options: "Descending" (value `'desc'`) and "Ascending" (value `'asc'`).
2. THE Legacy AdminPosts SHALL initialize the `sortOrder` state variable to `'desc'`.
3. WHEN the user selects a Sort Order option, THE Legacy AdminPosts SHALL update the `sortOrder` state variable to the selected value.
4. WHEN `sortOrder` changes, THE Legacy AdminPosts SHALL pass `sortOrder` to `postAPI.list()` and reload the posts list.

---

### Requirement 6 — Legacy AdminPosts: Wire Filters into API Call

**User Story:** As an admin, I want filter and sort selections to immediately update the displayed posts, so that the table always reflects my chosen criteria.

#### Acceptance Criteria

1. THE Legacy AdminPosts `loadPosts` function SHALL pass `status: filterStatus`, `sortBy: sortBy`, and `sortOrder: sortOrder` as parameters to `postAPI.list()`.
2. THE Legacy AdminPosts `useCallback` dependency array for `loadPosts` SHALL include `filterStatus`, `sortBy`, and `sortOrder` alongside the existing `search` dependency.
3. WHEN any of `search`, `filterStatus`, `sortBy`, or `sortOrder` change, THE Legacy AdminPosts SHALL automatically trigger a posts reload via the `useEffect` hook.

---

### Requirement 7 — Legacy AdminPosts: Smart Date Column Display

**User Story:** As an admin using the legacy interface, I want the Date column to show the publish date for published posts and the creation date otherwise, so that the displayed date is always contextually accurate.

#### Acceptance Criteria

1. WHEN a post has `status === 'published'` and a non-null `published_at` value, THE Legacy AdminPosts Date Column SHALL display the formatted `published_at` date.
2. WHEN a post has `status === 'published'` and a null or undefined `published_at` value, THE Legacy AdminPosts Date Column SHALL fall back to displaying the formatted `created_at` (or `createdAt`) date.
3. WHEN a post has a status other than `'published'`, THE Legacy AdminPosts Date Column SHALL display the formatted `created_at` (or `createdAt`) date.
4. IF no applicable date field is available for a post, THEN THE Legacy AdminPosts Date Column SHALL display `'-'`.

---

### Requirement 8 — Legacy AdminPosts: Filter Toolbar Layout

**User Story:** As an admin using the legacy interface, I want the filter controls to be laid out consistently with the search input, so that the interface is easy to scan and use.

#### Acceptance Criteria

1. THE Legacy AdminPosts SHALL render the Status filter, Sort By, and Sort Order dropdowns together in the existing filter Card, alongside the search input.
2. THE Legacy AdminPosts filter Card SHALL arrange the three dropdowns in a flex row, wrapping on small screens, consistent with the layout pattern used in the Newer AdminPosts component.
3. THE Legacy AdminPosts SHALL set the width of each dropdown SelectTrigger to `w-[140px]` to match the Newer AdminPosts component's visual style.
