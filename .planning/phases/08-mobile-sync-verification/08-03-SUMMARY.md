# Audit 08-03: Relationship Integrity During Sync - SUMMARY

## Objective
Verify data relationships are maintained during offline sync

## Status: COMPLETE

---

## Task 1: Employee Creation During Sync

### Files Reviewed
- `apps/mobile/src/context/SyncContext.jsx` (lines 69-84)
- `apps/mobile/src/hooks/useIncidentForm.js` (lines 72-92)
- `apps/web/src/app/api/employees/route.js` (lines 64-115)

### Findings

#### 1.1 Employee Creation Flow
The sync process creates employees before incidents in `processIncident()`:

```javascript
// SyncContext.jsx lines 73-84
let employeeId = payload.employeeId;
if (!employeeId && employeeData?.full_name) {
  const empResponse = await fetch("/api/employees", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(employeeData),
  });
  if (!empResponse.ok) throw new Error("Failed to create employee");
  const emp = await empResponse.json();
  employeeId = emp.id;
}
```

**Status**: Employee creation precedes incident creation - correct ordering.

#### 1.2 Orphan Employee Risk - HIGH SEVERITY

**Finding**: If employee creation succeeds but subsequent incident creation fails, the employee record becomes an orphan with no associated incident.

**Scenario**:
1. User submits incident offline with new employee data
2. Sync starts: employee POST succeeds (employee ID = 42)
3. Media upload fails OR incident POST fails
4. `throw new Error()` triggers - item stays in queue
5. Result: Employee ID 42 exists in database with no incident
6. Retry creates ANOTHER duplicate employee (no deduplication)

**Code Evidence** (SyncContext.jsx lines 154-165):
```javascript
for (const item of currentQueue) {
  try {
    await syncItem(item);
    await removeFromQueue(item.id);
    successCount++;
  } catch (error) {
    console.error(`Failed to sync item ${item.id}`, error);
    errors.push(error.message);
    // Item stays in queue - will be retried with SAME employeeData
  }
}
```

**Impact**:
- Orphan employee records pollute the database
- Each retry creates additional duplicate employees
- No mechanism to detect or clean up orphans

#### 1.3 EmployeeId Assignment Flow
- If `selectedEmployee` exists, its `id` is used directly
- If no selected employee but `employeeData.full_name` exists, new employee is created
- The `employeeId` is passed to incident creation as `employee_id`

**Gap**: No employee lookup/deduplication before creation. Same employee could be created multiple times if retries occur.

---

## Task 2: client_id Handling

### Files Reviewed
- `apps/mobile/src/context/SyncContext.jsx` (line 124)
- `apps/mobile/src/hooks/useIncidentForm.js` (lines 24, 130)
- `apps/web/src/app/api/incidents/route.js` (line 98)

### Findings

#### 2.1 client_id Fallback to 1 - HIGH SEVERITY

**Finding**: Both online and offline paths use `employeeData.client_id || 1` as fallback.

**Code Evidence**:

SyncContext.jsx line 124:
```javascript
client_id: employeeData.client_id || 1,
```

useIncidentForm.js line 130:
```javascript
client_id: employeeData.client_id || 1,
```

**Impact**:
- Incidents created for unknown/unassigned employees default to client_id 1
- This corrupts data by associating incidents with wrong client
- Client 1 may not exist or may be a test/admin client
- No validation that client_id 1 is valid or appropriate

#### 2.2 client_id Source

**Finding**: `client_id` is sourced from `employeeData`:

```javascript
// useIncidentForm.js lines 18-30
const [employeeData, setEmployeeData] = useState({
  full_name: "",
  employee_id: "",
  // ...
  client_id: null,  // Initialized as null
  // ...
});
```

**Scenarios where client_id could be null/undefined**:
1. New employee created manually without selecting client
2. Existing employee selected but missing client association
3. Data corruption in offline storage
4. Form validation bypass

#### 2.3 client_id Validation - NOT PRESENT

**API Side** (incidents/route.js line 98):
```javascript
${body.client_id || null},
```

The API accepts `null` for client_id - no validation that a valid client exists.

**Employee API** (employees/route.js line 89):
```javascript
${body.client_id || null},
```

Employees can also be created with null client_id.

**Gap**: No FK constraint enforcement at application layer. Database may or may not enforce referential integrity.

---

## Task 3: Incident Creation During Sync

### Files Reviewed
- `apps/mobile/src/context/SyncContext.jsx` (lines 116-130)
- `apps/web/src/app/api/incidents/route.js` (lines 72-141)

### Findings

#### 3.1 Required Fields Validation - INSUFFICIENT

**API Side** (incidents/route.js):
No explicit validation - relies on database constraints:

```javascript
export async function POST(request) {
  const body = await request.json();
  // No validation of body contents
  const incidentNumber = `INC-${Math.floor(Math.random() * 9000) + 1000}`;

  const rows = await sql`
    INSERT INTO incidents (...)
    VALUES (
      ${incidentNumber},
      ${body.employee_id || null},   // Can be null
      ${body.client_id || null},      // Can be null
      ${body.incident_date},          // Required - will fail if missing
      ${body.incident_time},          // Required - will fail if missing
      ...
    )
  `;
}
```

**Required fields** (will cause DB error if missing):
- `incident_date`
- `incident_time`
- `incident_type`
- `severity`
- `location`

**Optional fields** (default to null):
- `employee_id` - can be null
- `client_id` - can be null (despite fallback logic)
- `site_area`, `address`, `description`, etc.

#### 3.2 FK Relationships - NOT ENFORCED AT APPLICATION LAYER

**Finding**: No application-level validation that:
- `employee_id` references a valid employee
- `client_id` references a valid client

The incident can be created with invalid FK references if database constraints are not properly configured.

**Code Evidence** (incidents/route.js line 97-98):
```javascript
${body.employee_id || null},
${body.client_id || null},
```

#### 3.3 NULL employee_id Scenario - ALLOWED

**Finding**: Incidents CAN be created with `employee_id = null`.

**When this happens**:
1. No employee selected AND no employee data entered
2. `selectedEmployee` is null AND `employeeData.full_name` is empty
3. Result: `employeeId` remains undefined, passed as null

**Code Flow** (SyncContext.jsx):
```javascript
let employeeId = payload.employeeId;  // Could be undefined
if (!employeeId && employeeData?.full_name) {  // Skipped if no name
  // Create employee...
}
// employeeId is still undefined here
// ...
employee_id: employeeId,  // Passed as undefined -> null in DB
```

**Impact**: Incidents without associated employees cannot be easily traced back to the injured party.

#### 3.4 Incident POST Failure Handling

**Finding**: If incident POST fails, the entire sync item remains in queue for retry.

**Problem**: If employee was already created, retry will create ANOTHER employee (see Task 1.2).

---

## Task 4: Atomicity Gaps

### Partial Failure Scenarios

| Step | Action | Failure Impact |
|------|--------|----------------|
| 1 | Employee POST | Item stays in queue, no orphans, retryable |
| 2 | Media Upload (loop) | Employee orphaned if step 1 succeeded, retries create duplicates |
| 3 | Incident POST | Employee orphaned, media uploaded but unused |

### Failure Scenario Map

#### Scenario A: Employee Creation Fails
- **Trigger**: Network error, validation error, server error
- **Result**: Entire sync item fails, stays in queue
- **Impact**: LOW - No partial data created
- **Retry**: Safe to retry

#### Scenario B: Media Upload Fails (After Employee Created)
- **Trigger**: Uploadcare error, file corruption, network timeout
- **Result**: Employee exists, no incident
- **Impact**: HIGH - Orphan employee created
- **Retry**: Creates duplicate employee

#### Scenario C: Incident Creation Fails (After Employee + Media)
- **Trigger**: Validation error, DB constraint, server error
- **Result**: Employee exists, media uploaded, no incident
- **Impact**: HIGH - Orphan employee, wasted media storage
- **Retry**: Creates duplicate employee, uploads media again

#### Scenario D: Multiple Items in Queue - Partial Success
- **Trigger**: Item 1 succeeds, Item 2 fails
- **Result**: Queue has remaining items
- **Impact**: MEDIUM - Inconsistent sync state
- **Note**: Current code continues processing after failure (doesn't stop on first error)

### Rollback Requirements

**Current State**: NO ROLLBACK EXISTS

**What Should Happen**:
1. Employee creation should be part of transaction with incident
2. If incident fails, employee should be rolled back
3. Media uploads should be tracked for cleanup on failure

**Recommended Rollback Strategy for Phase 10**:
1. Implement database transactions for employee+incident creation
2. Track created employee IDs for rollback on failure
3. Implement media cleanup queue for failed syncs
4. Add idempotency keys to prevent duplicate creation on retry

---

## Summary of Critical Issues

| Issue | Severity | Risk | Phase 10 Priority |
|-------|----------|------|-------------------|
| Orphan employees on partial failure | HIGH | Data integrity | P1 |
| client_id fallback to 1 | HIGH | Data corruption | P1 |
| Duplicate employees on retry | HIGH | Data pollution | P1 |
| No FK validation at API | MEDIUM | Referential integrity | P2 |
| NULL employee_id allowed | LOW | Traceability | P3 |
| No atomicity/transactions | HIGH | Data consistency | P1 |

---

## Recommendations for Phase 10

### Immediate Fixes (P1)
1. **Remove client_id fallback to 1** - Require valid client_id or reject
2. **Add employee deduplication** - Check for existing employee before create
3. **Implement idempotency keys** - Prevent duplicate creation on retry
4. **Wrap employee+incident in transaction** - All or nothing

### Short-term Improvements (P2)
1. **Add FK validation in API** - Verify employee_id and client_id exist
2. **Store created employeeId in queue item** - Use on retry instead of recreating
3. **Add cleanup mechanism** - Detect and handle orphan employees

### Long-term Architecture (P3)
1. **Server-side sync endpoint** - Single atomic operation for incident+employee
2. **Saga pattern** - Compensating transactions for media cleanup
3. **Conflict resolution** - Handle concurrent sync attempts

---

## Files Audited

| File | Purpose |
|------|---------|
| `apps/mobile/src/context/SyncContext.jsx` | Offline sync orchestration |
| `apps/mobile/src/hooks/useIncidentForm.js` | Form submission, offline fallback |
| `apps/web/src/app/api/incidents/route.js` | Incident API endpoint |
| `apps/web/src/app/api/employees/route.js` | Employee API endpoint |
| `apps/web/src/app/api/clients/route.js` | Client API endpoint (reference) |

---

## Verification Checklist

- [x] Employee creation flow documented
- [x] Orphan employee risk documented
- [x] employeeId assignment flow verified
- [x] client_id fallback to 1 documented
- [x] client_id source verified
- [x] client_id validation (lack thereof) documented
- [x] Required fields validation documented
- [x] FK relationships enforcement documented
- [x] NULL employee_id scenario documented
- [x] Incident POST failure handling documented
- [x] Atomicity gaps documented
- [x] Failure scenarios mapped
- [x] Rollback requirements documented
- [x] Recommendations for Phase 10 created
