---
phase: 06-claims-processing-workflow
plan: 02
subsystem: review-approval
tags: [review, approval, status-workflow, role-access]

# Dependency graph
requires:
  - phase: 05-incident-lifecycle-workflow
    provides: incident status transitions, reviewed_by hardcoded issue known
provides:
  - Documented review listing page functionality
  - Documented approval/rejection workflow
  - Documented role-based access gaps for Phase 10 fixes
affects: [phase-10-production-readiness]

# Tech tracking
tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified: []

key-decisions:
  - "Audit only - no code changes per plan scope"
  - "reviewed_by hardcoded to 1 confirmed as known issue from Phase 5"
  - "requireRole(request, []) allows any authenticated user - documented for Phase 10"

patterns-established: []

issues-created: []

# Metrics
duration: 8min
completed: 2026-01-17
---

# Phase 6 Plan 02: Audit Review and Approval Flow Summary

**Comprehensive audit of review listing page and approval/rejection workflow - documented role-based access gaps and reviewed_by hardcoding for Phase 10 fixes**

## Performance

- **Duration:** 8 min
- **Started:** 2026-01-17T12:00:00Z
- **Completed:** 2026-01-17T12:08:00Z
- **Tasks:** 3 audit tasks
- **Files audited:** 5

## Accomplishments

- Audited review listing page with status filtering and client isolation
- Documented approval/rejection flow including PATCH status updates
- Confirmed reviewed_by hardcoded to 1 (known from Phase 5)
- Documented role-based access gaps for Phase 10 remediation

## Task Commits

This is an AUDIT-ONLY plan - no code commits produced.

**Plan metadata:** (docs commit after summary creation)

## Audit Findings

### Task 1: Review Listing Page Audit

**File:** `apps/web/src/app/reviews/page.jsx`

#### Status Filtering

- **Working correctly**: Status filter via useState with options `submitted` and `all`
- **Implementation**: Uses `useQuery` with `statusFilter` as query key dependency
- **API call**: `GET /api/incidents?status={statusFilter}` when not "all"
- **Observation**: Only two filter options exposed in UI: "Needs Review" (submitted) and "All Incidents"
- **Gap**: No UI filter for approved/rejected specifically (user must use "All" and visually scan)

#### Client Isolation

- **Enforced at API level**: `apps/web/src/app/api/incidents/route.js` lines 30-41
- **Logic**:
  - Global admins see all incidents
  - Non-global-admin users filtered by `i.client_id = ANY($N)` using `user.client_ids`
  - Users with no assigned clients get empty array response
- **Assessment**: Client isolation is properly enforced in the API layer

#### Role Requirements

- **Current state**: `requireRole(request, [])` - empty array
- **Effect**: Any authenticated user can access review listing page
- **Gap**: No "reviewer" role requirement - any logged-in user can view incidents awaiting review
- **Reference**: `apps/web/src/app/api/utils/auth.js` lines 73-76 confirm empty array allows any valid user

#### Table Columns Displayed

| Column | Data Source |
|--------|-------------|
| Incident ID | `incident.incident_number` |
| Employee | `incident.employee_name`, `incident.employee_number` |
| Date & Time | `incident.incident_date`, `incident.incident_time` |
| Type / Severity | `incident.incident_type`, `incident.severity` |
| Location | `incident.location` |
| Status | `incident.status` (with badge styling) |
| Action | Link to `/reviews/{id}` |

---

### Task 2: Approval/Rejection Flow Audit

**Files:** `apps/web/src/app/reviews/[id]/page.jsx`, `apps/web/src/app/api/incidents/[id]/route.js`

#### PATCH Status Updates

- **Frontend mutation** (lines 38-67 of `[id]/page.jsx`):
  ```javascript
  mutationFn: async ({ status, reason }) => {
    const res = await fetch(`/api/incidents/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        rejection_reason: reason || null,
        reviewed_at: new Date().toISOString(),
        reviewed_by: 1,  // HARDCODED
      }),
    });
  }
  ```
- **API handler** (`route.js`): Accepts all fields in `allowedFields` array including `reviewed_by`, `reviewed_at`, `rejection_reason`, `status`
- **Assessment**: PATCH correctly updates incident status

#### reviewed_by/reviewed_at Tracking

- **reviewed_by**: HARDCODED to `1` in frontend (line 48 of `[id]/page.jsx`)
- **Comment in code**: "In a real app, this would come from auth context"
- **reviewed_at**: Set to `new Date().toISOString()` - client-side timestamp
- **Gap**: reviewed_by should come from authenticated user context, not hardcoded
- **Phase 10 Fix Required**: Get actual user ID from auth context/session

#### Rejection Requires Reason

- **Enforced in frontend** (lines 75-78):
  ```javascript
  const handleReject = () => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }
  ```
- **API side**: No server-side validation - `rejection_reason` is optional in API
- **Gap**: Rejection reason validation is client-side only
- **Phase 10 Fix**: Add server-side validation requiring `rejection_reason` when `status=rejected`

#### Confirmation Dialogs

- **Approval**: Uses `window.confirm()` (line 70): "Are you sure you want to approve this incident?"
- **Rejection**: Custom modal with textarea for rejection reason (lines 359-407)
- **Assessment**: Both actions have confirmation mechanisms

#### Actions Only Show for "submitted" Status

- Buttons conditionally rendered only when `incident.status === "submitted"` (line 129)
- Already-approved/rejected incidents show read-only view with status badge

---

### Task 3: Role-Based Access Gaps

**File:** `apps/web/src/app/api/utils/auth.js`

#### `requireRole(request, [])` Behavior

**Code reference** (lines 73-76):
```javascript
// If no specific roles required, just being a valid user is enough
if (allowedRoles.length === 0) {
  return { authorized: true, user };
}
```

**Impact:**
- Both `/api/incidents` (GET list) and `/api/incidents/[id]` (GET/PATCH) use `requireRole(request, [])`
- This means ANY authenticated user can:
  1. View all incidents in review queue (subject to client isolation)
  2. View individual incident details
  3. Approve or reject incidents

#### No Reviewer Role Enforcement

**Current state:**
- No dedicated "reviewer" role in the system
- No role check before allowing approve/reject actions
- The `system_role` has only `global_admin` and `standard` options
- Client-level `company_role` from `user_client_roles` is not used for review permissions

**Gaps identified:**
1. Any user with client access can approve/reject incidents for that client
2. No audit trail of WHO approved (since reviewed_by is hardcoded to 1)
3. No separation between "can view incidents" and "can approve/reject incidents"

---

## Phase 10 Recommendations

### High Priority Fixes

1. **Fix reviewed_by hardcoding**
   - File: `apps/web/src/app/reviews/[id]/page.jsx`
   - Change: Get actual user ID from auth context/session
   - Impact: Enables accurate audit trail of approvals

2. **Add server-side rejection reason validation**
   - File: `apps/web/src/app/api/incidents/[id]/route.js`
   - Change: Require `rejection_reason` when `status === 'rejected'`
   - Impact: Prevents empty rejections from API bypass

3. **Consider adding reviewer role enforcement**
   - Files: API routes + auth.js
   - Change: Define "reviewer" as an allowed company_role and check it
   - Impact: Limits who can approve/reject incidents

### Medium Priority Enhancements

4. **Add dedicated status filter buttons**
   - File: `apps/web/src/app/reviews/page.jsx`
   - Change: Add "Approved" and "Rejected" filter tabs
   - Impact: Better UX for review queue management

5. **Use server-side timestamp for reviewed_at**
   - File: `apps/web/src/app/api/incidents/[id]/route.js`
   - Change: Set `reviewed_at = NOW()` in database instead of accepting client timestamp
   - Impact: Prevents timestamp manipulation

---

## Files Audited

| File | Purpose | Findings |
|------|---------|----------|
| `apps/web/src/app/reviews/page.jsx` | Review listing UI | Status filtering works, client isolation via API |
| `apps/web/src/app/reviews/[id]/page.jsx` | Approval/rejection UI | reviewed_by hardcoded, rejection modal works |
| `apps/web/src/app/api/incidents/[id]/route.js` | Individual incident API | PATCH works, no server-side rejection validation |
| `apps/web/src/app/api/incidents/route.js` | Incidents list API | Client isolation implemented correctly |
| `apps/web/src/app/api/utils/auth.js` | Auth middleware | Empty array allows any user |

## Decisions Made

- Audit only - no code changes per plan scope
- All gaps documented for Phase 10 remediation
- reviewed_by issue confirmed as known from Phase 5

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all files readable and audit completed successfully.

## Next Phase Readiness

- Review and approval flow fully documented
- Ready for 06-03 (status tracking and audit trail audit)
- All Phase 10 recommendations captured

---
*Phase: 06-claims-processing-workflow*
*Completed: 2026-01-17*
