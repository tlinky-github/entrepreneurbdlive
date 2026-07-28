# Implementation Plan: Admin Post Sorting and Draft Filter

## Overview

Two targeted JSX files are modified. The Newer AdminPosts (`astro-site/src/components/admin/AdminPosts.jsx`) gets two new Sort By options and smart Date column logic. The Legacy AdminPosts (`src/pages/admin/AdminPosts.jsx`) gets a full filter/sort toolbar, wired API call, and the same smart Date column logic. No new dependencies are needed.

## Tasks

- [ ] 1. Add "Last Edited" and "Publish Date" sort options to Newer AdminPosts
  - [ ] 1.1 Insert two new `<SelectItem>` elements into the Sort By `<SelectContent>` block in `astro-site/src/components/admin/AdminPosts.jsx`
    - Add `<SelectItem value="updated_at">Last Edited</SelectItem>` after the existing `<SelectItem value="title">Title</SelectItem>`
    - Add `<SelectItem value="published_at">Publish Date</SelectItem>` after the "Last Edited" item
    - Preserve the existing three options (`created_at`, `view_count`, `title`) without modification
    - No state, handler, or API call changes are needed — `sortBy` already flows to `postAPI.list({ sortBy })`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

  - [ ]* 1.2 Write property test for sort option value passthrough (Newer AdminPosts)
    - **Property 1: Sort option value passthrough**
    - For each of the five Sort By values (`created_at`, `updated_at`, `published_at`, `view_count`, `title`), simulate selecting that value and assert that `postAPI.list` is called with `sortBy` exactly equal to the selected value
    - **Validates: Requirements 1.3, 1.4**

- [ ] 2. Add `getDisplayDate` helper and update Date column in Newer AdminPosts
  - [ ] 2.1 Define a module-level `getDisplayDate(post)` helper in `astro-site/src/components/admin/AdminPosts.jsx`
    - Place it directly below the existing `formatDate` helper at the top of the file
    - Logic: if `post.status === 'published'` return `post.published_at ?? (post.created_at ?? post.createdAt)`; otherwise return `post.created_at ?? post.createdAt`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ] 2.2 Replace the Date column cell expression in Newer AdminPosts
    - Find the `<TableCell>` that renders `{formatDate(post.created_at || post.createdAt)}`
    - Replace with `{formatDate(getDisplayDate(post))}`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ]* 2.3 Write property test for smart date display — published posts (Newer AdminPosts)
    - **Property 3: Smart date display — published posts**
    - For any post with `status === 'published'`, assert the displayed value equals `formatDate(post.published_at)` when non-null, and `formatDate(post.created_at ?? post.createdAt)` when `published_at` is null/undefined; assert `'-'` when no date field is available
    - **Validates: Requirements 2.1, 2.2, 2.4**

  - [ ]* 2.4 Write property test for smart date display — non-published posts (Newer AdminPosts)
    - **Property 4: Smart date display — non-published posts**
    - For any post with `status` of `'draft'` or `'pending'`, assert the displayed value equals `formatDate(post.created_at ?? post.createdAt)` regardless of whether `published_at` is present
    - **Validates: Requirements 2.3, 2.4**

- [ ] 3. Checkpoint — verify Newer AdminPosts changes
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Add Select import and new state variables to Legacy AdminPosts
  - [ ] 4.1 Add the Select component import block to `src/pages/admin/AdminPosts.jsx`
    - Import `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue` from `../../components/ui/select`
    - Place the import after the existing Table import block
    - _Requirements: 3.5_

  - [ ] 4.2 Add `filterStatus`, `sortBy`, and `sortOrder` state variables in Legacy AdminPosts
    - Declare `const [filterStatus, setFilterStatus] = useState('all');`
    - Declare `const [sortBy, setSortBy] = useState('created_at');`
    - Declare `const [sortOrder, setSortOrder] = useState('desc');`
    - Place all three declarations immediately after the existing `const [search, setSearch] = useState('');`
    - _Requirements: 3.2, 4.2, 5.2_

- [ ] 5. Wire new state into the Legacy AdminPosts API call
  - [ ] 5.1 Update `loadPosts` in Legacy AdminPosts to pass all filter/sort parameters
    - Replace the current `postAPI.list({ search: search || undefined, limit: 50, isAdmin: true, status: 'all' })` call
    - New call: `postAPI.list({ search: search || undefined, limit: 50, isAdmin: true, status: filterStatus, sortBy, sortOrder })`
    - Update the `useCallback` dependency array from `[search]` to `[search, filterStatus, sortBy, sortOrder]`
    - _Requirements: 6.1, 6.2, 6.3_

  - [ ]* 5.2 Write property test for filter state passthrough to API (Legacy AdminPosts)
    - **Property 2: Filter state passthrough to API**
    - For any combination of valid `filterStatus`, `sortBy`, and `sortOrder` values, assert that `postAPI.list` receives `status: filterStatus`, `sortBy: sortBy`, and `sortOrder: sortOrder` with values exactly matching the current state
    - **Validates: Requirements 3.4, 4.4, 5.4, 6.1**

  - [ ]* 5.3 Write property test for status filter option coverage (Legacy AdminPosts)
    - **Property 5: Status filter option coverage**
    - For each value in `{all, published, draft, pending}`, simulate selecting it in the Status filter and assert `filterStatus` state equals that value exactly
    - **Validates: Requirements 3.3, 3.4**

- [ ] 6. Add filter toolbar JSX to Legacy AdminPosts
  - [ ] 6.1 Replace the existing search-only filter Card in Legacy AdminPosts with the full toolbar layout
    - Wrap existing `<div className="relative max-w-md">` (search input) in a `<div className="flex flex-col sm:flex-row gap-4 justify-between">` outer container and a `<div className="flex gap-4 flex-wrap">` inner container for the dropdowns
    - Add Status filter Select (value `filterStatus`, handler `setFilterStatus`) with options: "All Status" / `all`, "Published" / `published`, "Draft" / `draft`, "Pending" / `pending`
    - Add Sort By Select (value `sortBy`, handler `setSortBy`) with options: "Date" / `created_at`, "Last Edited" / `updated_at`, "Publish Date" / `published_at`, "Views" / `view_count`, "Title" / `title`
    - Add Sort Order Select (value `sortOrder`, handler `setSortOrder`) with options: "Descending" / `desc`, "Ascending" / `asc`
    - Set `className="w-[140px]"` on each `SelectTrigger`
    - Move the search Input into its own `<div className="relative w-full sm:max-w-md">` wrapper on the right side of the outer flex container
    - _Requirements: 3.1, 4.1, 5.1, 8.1, 8.2, 8.3_

- [ ] 7. Add `formatDate` and `getDisplayDate` helpers and update Date column in Legacy AdminPosts
  - [ ] 7.1 Define `formatDate` and `getDisplayDate` module-level helpers in `src/pages/admin/AdminPosts.jsx`
    - Add both functions above the `AdminPosts` component declaration
    - `formatDate`: returns `'-'` for null/undefined/invalid dates, otherwise `d.toLocaleDateString()`
    - `getDisplayDate`: same logic as in the Newer component — published + non-null `published_at` → `published_at`; published + null `published_at` → `created_at ?? createdAt`; any other status → `created_at ?? createdAt`
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [ ] 7.2 Replace the inline Date column expression in Legacy AdminPosts
    - Find the `<TableCell>` that renders `{(post.created_at || post.createdAt) ? new Date(post.created_at || post.createdAt).toLocaleDateString() : '-'}`
    - Replace with `{formatDate(getDisplayDate(post))}`
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [ ]* 7.3 Write property test for smart date display — published posts (Legacy AdminPosts)
    - **Property 3: Smart date display — published posts**
    - Same coverage as task 2.3 but targeting the Legacy component's `getDisplayDate` + `formatDate` functions
    - **Validates: Requirements 7.1, 7.2, 7.4**

  - [ ]* 7.4 Write property test for smart date display — non-published posts (Legacy AdminPosts)
    - **Property 4: Smart date display — non-published posts**
    - Same coverage as task 2.4 but targeting the Legacy component
    - **Validates: Requirements 7.3, 7.4**

- [ ] 8. Final checkpoint — verify Legacy AdminPosts changes
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Both components share the same `getDisplayDate` / `formatDate` logic — the helpers are defined independently in each file (module-level, no shared module needed)
- The Newer AdminPosts already has all required state and API wiring; only the Sort By dropdown and Date column need changes
- The Legacy AdminPosts is the larger change: new imports, three new state variables, updated `useCallback`, new JSX toolbar, new helpers, and updated Date column cell
- Each task references specific requirements for traceability
- Property tests validate the five correctness properties defined in the design document

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "4.1", "4.2"] },
    { "id": 1, "tasks": ["2.1", "5.1"] },
    { "id": 2, "tasks": ["2.2", "6.1", "7.1"] },
    { "id": 3, "tasks": ["1.2", "2.3", "2.4", "5.2", "5.3", "7.2"] },
    { "id": 4, "tasks": ["7.3", "7.4"] }
  ]
}
```
