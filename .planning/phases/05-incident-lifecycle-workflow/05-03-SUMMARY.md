# Plan 05-03: Resolution and Closure Flow Audit

## Status: COMPLETE
## Date: 2026-01-17
## Phase: 05-incident-lifecycle-workflow
## Plan: 03 - Resolution and Closure Flow

---

## Task 1: Corrective Actions Workflow

**Files Audited:**
- `/apps/web/src/app/api/corrective-actions/route.js`
- `/apps/web/src/app/api/corrective-actions/[id]/route.js`

### Findings

#### 1.1 Creation Linked to incident_id - VERIFIED

```javascript
// route.js POST - Lines 39-60
INSERT INTO corrective_actions (
  incident_id,
  title,
  description,
  assignee_name,
  assignee_id,
  due_date,
  status,
  priority_level
) VALUES (
  ${body.incident_id},
  ...
)
```

- **incident_id is required** in POST body (no null default)
- **No FK validation**: incident_id is not validated before INSERT
- **Notification sent**: `notifyIncidentSubscribers()` called after creation (line 63-67)

#### 1.2 Completion Tracking - VERIFIED

```javascript
// [id]/route.js PATCH - Lines 31-33
if (body.status === "completed" && body.completed_at === undefined) {
  updates.push(`completed_at = NOW()`);
}
```

- **Auto-timestamp**: `completed_at` automatically set when status changes to "completed"
- **Conditional logic**: Only sets if not explicitly provided in request body

#### 1.3 Status Values Documented

| Status | Purpose | Auto-set Fields |
|--------|---------|-----------------|
| open | Default status on creation | None |
| overdue | Expected for overdue actions | NOT IMPLEMENTED |
| completed | Action finished | completed_at = NOW() |

**GAP**: No "overdue" status automation - requires manual update or scheduled job.

#### 1.4 No Auto-Closure of Incident - CONFIRMED

- **No integration** between corrective_actions completion and incident status
- When all corrective actions complete, incident remains in its current status
- **No trigger/listener** to detect "all actions completed"

### Corrective Actions Gaps Summary

| Gap | Impact | Priority |
|-----|--------|----------|
| No FK validation for incident_id | Invalid references possible | Medium |
| No auto-overdue status | Manual tracking required | Low |
| No auto-closure trigger | Incident never auto-resolves | High |
| No completion notification | Users not notified when action completes | Medium |

---

## Task 2: Review/Approval Workflow

**Files Audited:**
- `/apps/web/src/app/reviews/[id]/page.jsx`
- `/apps/web/src/app/api/incidents/[id]/dossier/route.js`
- `/apps/web/src/app/reviews/page.jsx`
- `/apps/web/src/app/api/incidents/[id]/route.js`

### Findings

#### 2.1 Approve/Reject Flow - VERIFIED

```javascript
// reviews/[id]/page.jsx - Lines 38-67
const updateStatusMutation = useMutation({
  mutationFn: async ({ status, reason }) => {
    const res = await fetch(`/api/incidents/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,                           // "approved" or "rejected"
        rejection_reason: reason || null,
        reviewed_at: new Date().toISOString(),
        reviewed_by: 1,                   // HARDCODED - should come from auth
      }),
    });
    ...
  },
  ...
});
```

**Approve action** (line 69-72):
```javascript
const handleApprove = () => {
  if (confirm("Are you sure you want to approve this incident?")) {
    updateStatusMutation.mutate({ status: "approved" });
  }
};
```

**Reject action** (line 75-84):
```javascript
const handleReject = () => {
  if (!rejectionReason.trim()) {
    toast.error("Please provide a reason for rejection");
    return;
  }
  updateStatusMutation.mutate({
    status: "rejected",
    reason: rejectionReason,
  });
};
```

#### 2.2 reviewed_by/reviewed_at Tracking - PARTIAL

| Field | Storage | Issue |
|-------|---------|-------|
| reviewed_at | Client-generated timestamp | Should be server-side NOW() |
| reviewed_by | **HARDCODED to 1** | Must come from authenticated user |

```javascript
// reviews/[id]/page.jsx - Lines 44-48
body: JSON.stringify({
  status,
  rejection_reason: reason || null,
  reviewed_at: new Date().toISOString(),  // CLIENT-SIDE
  reviewed_by: 1,                          // HARDCODED!
}),
```

**Backend accepts these fields** (incidents/[id]/route.js lines 71-75):
```javascript
const allowedFields = [
  ...
  "reviewed_by",
  "reviewed_at",
  "rejection_reason",
  "submission_date",
];
```

#### 2.3 Dossier Compilation - DOCUMENTED

```javascript
// incidents/[id]/dossier/route.js - Full content compilation
```

| Component | Query | Included |
|-----------|-------|----------|
| Incident Details | Main incident + employee + client JOINs | YES |
| Evidence | `SELECT * FROM evidence WHERE incident_id = ${id}` | YES |
| Interviews | `SELECT * FROM interviews WHERE incident_id = ${id}` | YES |
| Corrective Actions | `SELECT * FROM corrective_actions WHERE incident_id = ${id}` | YES |
| Root Cause Analysis | `SELECT * FROM root_cause_analysis WHERE incident_id = ${id}` | YES |
| Interview Witnesses | Nested attachment to interviews | YES |

**Dossier Response Structure:**
```javascript
return Response.json({
  incident,
  evidence,
  interviews: interviewsWithWitnesses,
  correctiveActions: actions,
  rootCause,
});
```

#### 2.4 No Final Closure Step - CONFIRMED

- After approval, status remains "approved"
- No "closed" or "resolved" status exists
- No closure validation (e.g., all forms complete, all actions done)
- No closure timestamp tracking

### Review/Approval Gaps Summary

| Gap | Impact | Priority |
|-----|--------|----------|
| reviewed_by hardcoded to 1 | Wrong reviewer attribution | CRITICAL |
| reviewed_at client-generated | Clock skew, manipulation risk | High |
| No closure step after approval | Approved != Closed | High |
| No prerequisite validation | Can approve incomplete incidents | Medium |

---

## Task 3: Resolution/Closure Gaps Analysis

### 3.1 No "resolved" or "closed" Status - CONFIRMED

**Current incident status values:**
```javascript
// From reviews/[id]/page.jsx StatusBadge (lines 412-425)
const styles = {
  submitted: "bg-yellow-100 text-yellow-800 border-yellow-200",
  approved: "bg-green-100 text-green-800 border-green-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
  open: "bg-blue-100 text-blue-800 border-blue-200",
};

const labels = {
  submitted: "Under Review",
  approved: "Approved",
  rejected: "Returned",
  open: "Open",
};
```

**Gap**: No "resolved" or "closed" status defined or handled.

### 3.2 No resolved_at or closed_at Timestamps - CONFIRMED

**Search result**: Only reference found was in the plan file itself.

```
grep -r "resolved_at|closed_at" -> Found 1 file: 05-03-PLAN.md
```

**Incident allowedFields** (incidents/[id]/route.js):
```javascript
const allowedFields = [
  "status",
  "priority",
  "severity",
  "incident_type",
  "location",
  "site_area",
  "description",
  "body_parts_injured",
  "employee_id",
  "client_id",
  "incident_date",
  "incident_time",
  "date_reported_to_employer",
  "reported_to_name",
  "reviewed_by",
  "reviewed_at",
  "rejection_reason",
  "submission_date",
];
// NO resolved_at, closed_at, resolved_by, closed_by
```

### 3.3 No Closure Validation - CONFIRMED

No prerequisite checks before allowing status changes:

| Expected Validation | Implemented |
|--------------------|-------------|
| All corrective actions completed | NO |
| All required forms signed | NO |
| Root cause analysis complete | NO |
| Evidence attached | NO |
| Interviews conducted | NO |

**Current implementation**: Any authenticated user can set any status via PATCH.

### 3.4 No Automatic Closure Trigger - CONFIRMED

| Trigger Scenario | Implementation |
|------------------|----------------|
| All corrective_actions completed | NO |
| Manual "Close Incident" button | NO |
| Scheduled auto-close after X days | NO |
| Workflow completion checker | NO |

---

## Complete Status Lifecycle Map

### Current Implementation

```
Incident Status Flow (ACTUAL):

  [CREATE] --> open
                |
                v
  [SUBMIT] --> submitted
                |
         +------+------+
         |             |
         v             v
    approved       rejected
                      |
                      v
                    open (return to editing)
```

### Expected Implementation (Phase 10)

```
Incident Status Flow (EXPECTED):

  [CREATE] --> open/draft
                   |
                   v
  [SUBMIT] --> submitted (under_review)
                   |
            +------+------+
            |             |
            v             v
       approved       rejected
            |             |
            v             v
  [RESOLVE] --> resolved    --> open (resubmit)
            |
            v
  [CLOSE] --> closed (FINAL)
```

---

## Phase 10 Recommendations (Prioritized)

### Priority 0 - Critical Security

| # | Recommendation | Effort |
|---|----------------|--------|
| 1 | Fix reviewed_by to use authenticated user ID, not hardcoded 1 | Low |
| 2 | Move reviewed_at to server-side NOW() | Low |

### Priority 1 - Core Functionality

| # | Recommendation | Effort |
|---|----------------|--------|
| 3 | Add "resolved" and "closed" status values | Medium |
| 4 | Add resolved_at, closed_at, resolved_by, closed_by columns to incidents | Medium |
| 5 | Create closure validation endpoint (prerequisite checker) | Medium |
| 6 | Add FK validation for corrective_actions.incident_id | Low |

### Priority 2 - Workflow Automation

| # | Recommendation | Effort |
|---|----------------|--------|
| 7 | Add notification when corrective action marked complete | Low |
| 8 | Create auto-closure trigger when all corrective actions complete | Medium |
| 9 | Add "Close Incident" UI button with prerequisite display | Medium |
| 10 | Add scheduled job for corrective_actions overdue status | Medium |

### Priority 3 - Enhancements

| # | Recommendation | Effort |
|---|----------------|--------|
| 11 | Add closure reason/notes field | Low |
| 12 | Add re-open capability from closed status | Low |
| 13 | Add closure audit trail (separate from general audit_logs) | Medium |
| 14 | Add incident lifecycle analytics/reporting | High |

---

## Files Audited

| File | Purpose |
|------|---------|
| `/apps/web/src/app/api/corrective-actions/route.js` | Corrective action CRUD |
| `/apps/web/src/app/api/corrective-actions/[id]/route.js` | Corrective action PATCH |
| `/apps/web/src/app/api/incidents/[id]/dossier/route.js` | Dossier compilation |
| `/apps/web/src/app/reviews/[id]/page.jsx` | Review/approval UI |
| `/apps/web/src/app/reviews/page.jsx` | Reviews list page |
| `/apps/web/src/app/api/incidents/[id]/route.js` | Incident PATCH (status changes) |
| `/apps/web/src/app/api/incidents/route.js` | Incident GET/POST |
| `/apps/web/src/app/api/utils/audit.js` | Audit logging utility |
| `/apps/web/src/app/api/utils/notifications.js` | Push notification utility |

---

## Verification Checklist

- [x] Corrective actions creation linked to incident_id verified
- [x] Corrective actions completion tracking (completed_at) verified
- [x] Corrective actions status values documented (open, completed)
- [x] No auto-closure of incident when all actions complete - documented
- [x] Approve/reject flow verified
- [x] reviewed_by/reviewed_at tracking documented (PARTIAL - hardcoded issue)
- [x] Dossier compilation contents documented
- [x] No final closure step after approval - documented
- [x] No "resolved" or "closed" status - documented
- [x] No resolved_at or closed_at timestamps - documented
- [x] No closure validation (prerequisites check) - documented
- [x] No automatic closure trigger - documented
- [x] Phase 10 recommendations prioritized

---

## Conclusion

The resolution and closure flow audit reveals significant gaps in the incident lifecycle management:

1. **No true closure mechanism** - Incidents can be "approved" but never formally "closed"
2. **Hardcoded reviewer attribution** - Critical security issue with `reviewed_by: 1`
3. **No prerequisite validation** - Incidents can be approved regardless of completion state
4. **No automation** - Manual intervention required at every step

The system currently supports a simple open -> submitted -> approved/rejected flow, but lacks the mature lifecycle management expected for incident tracking (resolution, closure, timestamps, validation).

**Total Gaps Identified: 14**
- Critical: 2 (reviewed_by hardcoded, client-side reviewed_at)
- High: 3 (no closure status, no closure timestamps, no auto-trigger)
- Medium: 5 (FK validation, prerequisite checks, notifications, overdue status)
- Low: 4 (closure notes, re-open, audit trail, analytics)

---

*Audit completed 2026-01-17*
