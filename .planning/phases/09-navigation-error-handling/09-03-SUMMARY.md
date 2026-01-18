# 09-03 Error Handling Patterns Audit Summary

## Overview
Audit of error handling, loading states, and empty states across web and mobile platforms.

---

## 1. Error Pages Status

| Error Type | Web Platform | Mobile Platform | Status |
|------------|--------------|-----------------|--------|
| 404 Not Found (root) | Missing | Present (`+not-found.tsx`) | Web needs root 404 |
| 404 Not Found (nested) | Present in `__create/not-found.tsx` | N/A (uses root) | Partial |
| 500/Server Error (`error.jsx`) | Missing | Missing | Needs implementation |
| Global Error (`global-error.jsx`) | Missing | Missing | Needs implementation |

### Details

**Web Platform:**
- `apps/web/src/app/not-found.jsx` - **MISSING** (no root-level 404 page)
- `apps/web/src/app/__create/not-found.tsx` - Present (Create-specific, not user-facing)
- `apps/web/src/app/error.jsx` - **MISSING**
- `apps/web/src/app/global-error.jsx` - **MISSING**

**Mobile Platform:**
- `apps/mobile/src/app/+not-found.tsx` - Present (well-implemented)
- No equivalent to `error.jsx` or crash screens

---

## 2. Error Boundary Coverage

| Platform | Root Level | Route Level | Component Level | Coverage |
|----------|-----------|-------------|-----------------|----------|
| Web | Present (in `root.tsx`) | Not found | Via `ClientOnly` wrapper | Partial |
| Mobile | Via `ErrorBoundaryWrapper` | Not found | Only in `+not-found.tsx` | Minimal |

### Web Error Boundaries
- **Location:** `apps/web/src/app/root.tsx`
- **Implementation:**
  - `ErrorBoundary` export for React Router integration (lines 104-106)
  - `ErrorBoundaryWrapper` class component (lines 204-221)
  - `InternalErrorBoundary` with UI for iframe context (lines 108-196)
  - `ClientOnly` component wraps content in `ErrorBoundaryWrapper`
- **Features:**
  - "Try to fix" button (iframe mode)
  - "Show logs" button (iframe mode)
  - "Copy error" button (standalone mode)
  - Animated slide-up error toast UI

### Mobile Error Boundaries
- **Location:** `apps/mobile/__create/SharedErrorBoundary.tsx`
- **Implementation:**
  - `ErrorBoundaryWrapper` class component (lines 189-211)
  - `InternalErrorBoundary` with React Native UI (lines 125-185)
  - `SharedErrorBoundary` animated toast component (lines 5-94)
- **Features:**
  - "Try to fix" button
  - "Show logs" button
  - "Copy error" button
- **Gap:** Only used in `+not-found.tsx`, not wrapped around main app content

---

## 3. Loading and Empty State Patterns

### Loading State Analysis

| Pattern | Web Count | Mobile Count | Consistency |
|---------|-----------|--------------|-------------|
| Text "Loading..." | 2 pages | 1 page | Inconsistent |
| Spinner (CSS animated) | 2 pages | 0 pages | Web only |
| ActivityIndicator | 0 pages | 1 page | Mobile only |
| Skeleton loaders | 0 pages | 0 pages | Missing |
| `isLoading` state | 6+ components | 15+ components | Good adoption |

### Loading State Examples

**Web - Dashboard (`apps/web/src/app/page.jsx`):**
```jsx
if (isLoading) {
  return (
    <div className="p-8 text-center text-gray-500">Loading dashboard...</div>
  );
}
```

**Web - Reviews (`apps/web/src/app/reviews/page.jsx`):**
```jsx
{isLoading ? (
  <div className="p-12 flex justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
  </div>
) : ...}
```

**Mobile - Incident (`apps/mobile/src/app/(tabs)/incident/[id].jsx`):**
- Uses `loading` state variable but **no loading UI rendered**
- Returns `null` when no incident (silent fail)

**Mobile - Dashboard (`apps/mobile/src/app/(tabs)/dashboard.jsx`):**
- Uses `loading` state but **no loading indicator shown**
- Data renders with fallback values instead

### Empty State Analysis

| Pattern | Web | Mobile | Notes |
|---------|-----|--------|-------|
| "No X found" message | 3 pages | 2 pages | Basic text |
| Empty state with icon | 1 page | 0 pages | Reviews page only |
| Empty state with CTA | 0 pages | 0 pages | Missing opportunity |

### Empty State Examples

**Web - Reviews (Good example):**
```jsx
{incidents?.length === 0 ? (
  <div className="p-12 text-center">
    <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
      <CheckCircle className="w-6 h-6 text-gray-400" />
    </div>
    <h3 className="text-lg font-medium text-gray-900">No incidents found</h3>
    <p className="mt-1 text-gray-500">{contextual message}</p>
  </div>
)}
```

**Mobile - Dashboard (Basic):**
```jsx
{stats?.recentActivity?.length > 0 ? (...) : (
  <Text style={{ color: "#9CA3AF", textAlign: "center", padding: 20 }}>
    No recent activity
  </Text>
)}
```

---

## 4. API Error Handling Examples

### Web Platform Patterns

| File | Try-Catch | Error Display | Recovery |
|------|-----------|---------------|----------|
| `reviews/[id]/page.jsx` | Via useMutation | toast.error() | Re-fetch |
| `settings/users/page.jsx` | try-catch | toast.error() | None |
| `page.jsx` (Dashboard) | Via useQuery | None (silent) | None |

**Good Example - Reviews Page:**
```jsx
const updateStatusMutation = useMutation({
  mutationFn: async ({ status, reason }) => {...},
  onSuccess: () => {
    queryClient.invalidateQueries(["incident", id]);
    toast.success("Incident approved successfully");
  },
  onError: () => {
    toast.error("Failed to update incident status");
  },
});
```

**Gap Example - Dashboard:**
```jsx
const { data: stats, isLoading } = useQuery({
  queryFn: async () => {
    const res = await fetch("/api/dashboard/stats");
    if (!res.ok) throw new Error("Failed to fetch stats");
    return res.json();
  },
  // No onError handler - errors silently fail
});
```

### Mobile Platform Patterns

| File | Try-Catch | Error Display | Recovery |
|------|-----------|---------------|----------|
| `incident/[id].jsx` | Yes | Alert.alert() | None |
| `dashboard.jsx` | Yes | console.error only | Fallback data |
| `investigations.jsx` | Yes | console.error only | None |

**Good Example - Incident Submit:**
```jsx
try {
  const response = await fetch(`/api/incidents/${id}`, {...});
  if (!response.ok) throw new Error("Failed to submit");
  Alert.alert("Success", "Incident submitted for review.");
} catch (error) {
  console.error(error);
  Alert.alert("Error", "Failed to submit incident.");
}
```

**Gap Example - Dashboard:**
```jsx
try {
  const response = await fetch("/api/dashboard/stats");
  if (!response.ok) throw new Error("Failed to fetch stats");
  const data = await response.json();
  setStats(data);
} catch (error) {
  console.error(error);  // Silent fail, no user notification
}
```

### Error Notification Summary

| Method | Web Usage | Mobile Usage |
|--------|-----------|--------------|
| Toast (sonner) | 3 pages | N/A |
| Alert.alert | N/A | 10+ pages |
| Console only | 2+ pages | 10+ pages |
| Inline error | 0 pages | 0 pages |

---

## 5. Phase 10 Recommendations (Prioritized)

### High Priority

1. **Create Root 404 Page for Web**
   - File: `apps/web/src/app/not-found.jsx`
   - User-facing 404 with navigation options
   - Consistent with app design system

2. **Create Error Boundary Pages**
   - Web: `apps/web/src/app/error.jsx` and `global-error.jsx`
   - Mobile: App-level error boundary wrapper
   - Graceful crash recovery UI

3. **Standardize Loading States**
   - Create reusable `<LoadingSpinner />` component for both platforms
   - Ensure all data-fetching pages show loading indicators
   - Add loading states to: Mobile dashboard, investigations list

### Medium Priority

4. **Add Error Query Handlers**
   - Add `onError` callbacks to all useQuery hooks
   - Display user-friendly error messages
   - Implement retry buttons where appropriate

5. **Create Empty State Components**
   - Reusable `<EmptyState icon={} title={} description={} action={} />`
   - Consistent design across platforms
   - Include call-to-action where applicable

6. **Add Inline Validation Errors**
   - Form-level error display components
   - Field-level error highlighting
   - Real-time validation feedback

### Low Priority

7. **Implement Skeleton Loaders**
   - For complex pages (dashboard, reviews list)
   - Better perceived performance

8. **Add Error Tracking Integration**
   - Sentry or similar for production
   - Structured error logging

9. **Create Error Recovery Flows**
   - Retry mechanisms for failed requests
   - Offline detection and recovery
   - Session expiration handling

---

## Files Audited

### Web
- `apps/web/src/app/root.tsx` (error boundaries)
- `apps/web/src/app/__create/not-found.tsx` (404)
- `apps/web/src/app/page.jsx` (dashboard)
- `apps/web/src/app/reviews/page.jsx` (list)
- `apps/web/src/app/reviews/[id]/page.jsx` (detail)
- `apps/web/src/app/settings/users/page.jsx` (management)

### Mobile
- `apps/mobile/src/app/+not-found.tsx` (404)
- `apps/mobile/__create/SharedErrorBoundary.tsx` (error boundary)
- `apps/mobile/src/app/(tabs)/dashboard.jsx`
- `apps/mobile/src/app/(tabs)/investigations.jsx`
- `apps/mobile/src/app/(tabs)/incident/[id].jsx`

---

## Conclusion

The application has foundational error handling in place but lacks consistency and completeness:
- **Strengths:** Mobile 404 page, web error boundary in root, toast notifications for mutations
- **Gaps:** Missing root 404 for web, no error/global-error pages, inconsistent loading states, silent API failures
- **Risk:** Users may see blank screens or confusing states when errors occur

Phase 10 should prioritize creating the missing error pages and standardizing loading/empty state patterns to improve user experience during error scenarios.
