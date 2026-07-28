# Design Document

## Admin Post Sorting and Draft Filter

---

## Overview

This feature enhances two AdminPosts components — the **Newer AdminPosts** (`astro-site/src/components/admin/AdminPosts.jsx`) and the **Legacy AdminPosts** (`src/pages/admin/AdminPosts.jsx`) — with improved sort and filter capabilities. Both components use React state + `useCallback`/`useEffect` hooks wired to `postAPI.list()`, and both render a table of posts with a Date column that will apply smart date display logic.

The changes are confined entirely to these two JSX files. No new dependencies are introduced; the existing `Select` component family from `../../components/ui/select` is already available and used in the Newer component, and will be added to the Legacy component.

---

## Architecture

### Component Relationship

```
Browser
  └── Admin Layout (Outlet)
        ├── Newer AdminPosts  (astro-site/src/components/admin/AdminPosts.jsx)
        │     └── postAPI.list({ status, sortBy, sortOrder, search, limit, isAdmin })
        └── Legacy AdminPosts  (src/pages/admin/AdminPosts.jsx)
              └── postAPI.list({ status, sortBy, sortOrder, search, limit, isAdmin })
```

Both components share the same API contract. The design is purely additive — new state variables, new JSX controls, and updated Date column rendering logic.

---

## Component Designs

### 1. Newer AdminPosts (`astro-site/src/components/admin/AdminPosts.jsx`)

#### Current State

The component already has:
- `filterStatus` state (initialized to `'all'`)
- `sortBy` state (initialized to `'created_at'`)
- `sortOrder` state (initialized to `'desc'`)
- Sort By dropdown with three options: `created_at`, `view_count`, `title`
- All three state variables already passed to `postAPI.list()`

#### Changes Required

**1a. Sort By Dropdown — Add Two Options**

The `<SelectContent>` block for Sort By currently has three `<SelectItem>` elements. Two new items must be inserted:

```jsx
// Existing options (unchanged):
<SelectItem value="created_at">Date</SelectItem>
<SelectItem value="view_count">Views</SelectItem>
<SelectItem value="title">Title</SelectItem>

// New options to add:
<SelectItem value="updated_at">Last Edited</SelectItem>
<SelectItem value="published_at">Publish Date</SelectItem>
```

No state, handler, or API call changes are needed — `sortBy` already flows through to `postAPI.list({ sortBy })`.

**1b. Date Column — Smart Display Logic**

The current Date column renders:

```jsx
{formatDate(post.created_at || post.createdAt)}
```

Replace with a `getDisplayDate` helper (defined at module level, alongside the existing `formatDate`):

```jsx
const getDisplayDate = (post) => {
  if (post.status === 'published') {
    return post.published_at ? post.published_at : (post.created_at || post.createdAt);
  }
  return post.created_at || post.createdAt;
};
```

Usage in the table cell:

```jsx
<TableCell className="text-stone-500 text-sm">
  {formatDate(getDisplayDate(post))}
</TableCell>
```

`formatDate` already handles `null`/`undefined` input by returning `'-'`, so no extra null guard is needed.

---

### 2. Legacy AdminPosts (`src/pages/admin/AdminPosts.jsx`)

#### Current State

The component has:
- `search` state only
- `loadPosts` calls `postAPI.list({ search, limit: 50, isAdmin: true, status: 'all' })` — hardcoded status, no sortBy/sortOrder
- No Select component imports
- Filter card contains only a search `<Input>`
- Date column uses an inline inline expression with no smart logic

#### Changes Required

**2a. New State Variables**

Add three new `useState` declarations after the existing `search` state:

```jsx
const [filterStatus, setFilterStatus] = useState('all');
const [sortBy, setSortBy] = useState('created_at');
const [sortOrder, setSortOrder] = useState('desc');
```

**2b. Update `loadPosts` — Wire State to API**

The existing `loadPosts` callback passes a hardcoded `status: 'all'` and omits `sortBy`/`sortOrder`. Update the call and the dependency array:

```jsx
const loadPosts = useCallback(async () => {
  setLoading(true);
  try {
    const res = await postAPI.list({
      search: search || undefined,
      limit: 50,
      isAdmin: true,
      status: filterStatus,
      sortBy,
      sortOrder,
    });
    setPosts(res.data || []);
  } catch (error) {
    toast.error('Failed to load posts');
  } finally {
    setLoading(false);
  }
}, [search, filterStatus, sortBy, sortOrder]);
```

The `useEffect` that calls `loadPosts` does not need changes — it already depends on `[loadPosts]`, so adding `filterStatus`, `sortBy`, `sortOrder` to the `useCallback` dependency array is sufficient to trigger reloads.

**2c. Select Component Import**

Add the Select import block (same path pattern as the Newer component):

```jsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
```

**2d. Filter Card — Add Dropdown Controls**

Replace the existing filter card content:

```jsx
{/* Before — search only */}
<Card className="mb-6 border-stone-200">
  <CardContent className="p-4">
    <div className="relative max-w-md">
      <Search className="..." />
      <Input ... />
    </div>
  </CardContent>
</Card>
```

With:

```jsx
{/* After — dropdowns + search */}
<Card className="mb-6 border-stone-200">
  <CardContent className="p-4">
    <div className="flex flex-col sm:flex-row gap-4 justify-between">
      <div className="flex gap-4 flex-wrap">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Sort By" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at">Date</SelectItem>
            <SelectItem value="updated_at">Last Edited</SelectItem>
            <SelectItem value="published_at">Publish Date</SelectItem>
            <SelectItem value="view_count">Views</SelectItem>
            <SelectItem value="title">Title</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortOrder} onValueChange={setSortOrder}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Order" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="desc">Descending</SelectItem>
            <SelectItem value="asc">Ascending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="relative w-full sm:max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
        <Input
          placeholder="Search posts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>
    </div>
  </CardContent>
</Card>
```

**2e. Date Column — Smart Display Logic**

Add a module-level `formatDate` helper (same as the Newer component) and a `getDisplayDate` helper:

```jsx
const formatDate = (date) => {
  if (!date) return '-';
  const d = new Date(date);
  return isNaN(d.getTime()) ? '-' : d.toLocaleDateString();
};

const getDisplayDate = (post) => {
  if (post.status === 'published') {
    return post.published_at ? post.published_at : (post.created_at || post.createdAt);
  }
  return post.created_at || post.createdAt;
};
```

Replace the current inline Date column expression:

```jsx
{/* Before */}
{(post.created_at || post.createdAt)
  ? new Date(post.created_at || post.createdAt).toLocaleDateString()
  : '-'}

{/* After */}
{formatDate(getDisplayDate(post))}
```

---

## Data Models

No new data models are introduced. Both components work with the existing post object shape returned by `postAPI.list()`:

```typescript
interface Post {
  id: string;
  title: string;
  slug: string;
  status: 'published' | 'draft' | 'pending' | 'scheduled';
  author_name: string;
  view_count: number;
  featured_image?: string;
  created_at: string | null;      // ISO timestamp
  createdAt?: string | null;      // alias used in some contexts
  updated_at: string | null;      // ISO timestamp
  published_at: string | null;    // ISO timestamp; null for non-published posts
}
```

The `getDisplayDate` helper handles both `created_at` and `createdAt` field name variants already present in the data.

---

## Interfaces

### `getDisplayDate(post: Post): string | null`

A pure helper function co-located at module level in each component file.

| Input condition | Return value |
|---|---|
| `post.status === 'published'` and `post.published_at` is non-null | `post.published_at` |
| `post.status === 'published'` and `post.published_at` is null/undefined | `post.created_at ?? post.createdAt` |
| Any other status | `post.created_at ?? post.createdAt` |

### `formatDate(date: string | null | undefined): string`

Already present in the Newer component; added to the Legacy component.

| Input | Return value |
|---|---|
| `null` or `undefined` | `'-'` |
| Invalid date string | `'-'` |
| Valid date string | Locale date string (e.g., `"7/15/2025"`) |

### `postAPI.list()` Parameters (extended)

Both components now pass the full parameter set:

```javascript
postAPI.list({
  search: string | undefined,
  limit: number,
  isAdmin: true,
  status: 'all' | 'published' | 'draft' | 'pending',
  sortBy: 'created_at' | 'updated_at' | 'published_at' | 'view_count' | 'title',
  sortOrder: 'asc' | 'desc',
})
```

---

## State Management

Both components use React's built-in `useState` + `useCallback` + `useEffect` pattern. No external state library is involved.

### Newer AdminPosts — State (no new state, existing already correct)

| State variable | Type | Initial value | Purpose |
|---|---|---|---|
| `filterStatus` | `string` | `'all'` | Status filter sent to API |
| `sortBy` | `string` | `'created_at'` | Sort field sent to API |
| `sortOrder` | `string` | `'desc'` | Sort direction sent to API |
| `search` | `string` | `''` | Search query sent to API |

### Legacy AdminPosts — State (new additions marked)

| State variable | Type | Initial value | Purpose | New? |
|---|---|---|---|---|
| `search` | `string` | `''` | Search query sent to API | No |
| `filterStatus` | `string` | `'all'` | Status filter sent to API | **Yes** |
| `sortBy` | `string` | `'created_at'` | Sort field sent to API | **Yes** |
| `sortOrder` | `string` | `'desc'` | Sort direction sent to API | **Yes** |

### Reactivity Flow

```
User changes dropdown/input
        │
        ▼
setState (setFilterStatus / setSortBy / setSortOrder / setSearch)
        │
        ▼
useCallback deps change → new loadPosts reference
        │
        ▼
useEffect([loadPosts]) fires
        │
        ▼
postAPI.list({ status, sortBy, sortOrder, search, ... })
        │
        ▼
setPosts(res.data)  →  re-render table
```

---

## Error Handling

No new error handling paths are introduced. The existing `try/catch` in `loadPosts` calls `toast.error('Failed to load posts')` for all API errors — this covers any new filter/sort parameter combinations that the API may reject.

The `formatDate` helper already handles null, undefined, and invalid date strings defensively by returning `'-'`.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Sort option value passthrough

*For any* valid sort option value selected from the Sort By dropdown in either component (`'created_at'`, `'updated_at'`, `'published_at'`, `'view_count'`, `'title'`), the value passed to `postAPI.list()` as `sortBy` should exactly equal the selected option's `value` attribute — no transformation, aliasing, or loss.

**Validates: Requirements 1.3, 1.4, 4.3, 4.4**

---

### Property 2: Filter state passthrough to API

*For any* combination of valid `filterStatus` ∈ `{all, published, draft, pending}`, `sortBy` ∈ `{created_at, updated_at, published_at, view_count, title}`, and `sortOrder` ∈ `{asc, desc}`, when `loadPosts` is called the parameters object passed to `postAPI.list()` shall contain `status: filterStatus`, `sortBy: sortBy`, and `sortOrder: sortOrder` with values exactly matching the current state variables.

**Validates: Requirements 3.4, 4.4, 5.4, 6.1**

---

### Property 3: Smart date display — published posts

*For any* post object where `status === 'published'`, the Date column display value shall equal `formatDate(post.published_at)` when `post.published_at` is non-null, and `formatDate(post.created_at ?? post.createdAt)` when `post.published_at` is null or undefined. In both cases, if the resolved date value is also null/undefined, the column shall display `'-'`.

**Validates: Requirements 2.1, 2.2, 2.4, 7.1, 7.2, 7.4**

---

### Property 4: Smart date display — non-published posts

*For any* post object where `status` is `'draft'` or `'pending'`, the Date column display value shall equal `formatDate(post.created_at ?? post.createdAt)`, regardless of whether `published_at` is present on the object.

**Validates: Requirements 2.3, 2.4, 7.3, 7.4**

---

### Property 5: Status filter option coverage

*For any* valid status value `v` ∈ `{all, published, draft, pending}`, after selecting `v` in the Status filter dropdown, the `filterStatus` state variable shall equal `v` exactly.

**Validates: Requirements 3.3, 3.4**

---
