# Summary 05-01: Incident Creation and Assignment Audit

## Date: 2026-01-17

---

## Task 1: Audit Incident Creation API

### Files Audited
- `/apps/web/src/app/api/incidents/route.js`
- `/apps/web/src/app/api/incidents/[id]/route.js`

### Findings

#### 1.1 POST Creates with employee_id Assignment
**VERIFIED**

```javascript
// route.js line 97
${body.employee_id || null},
```

- Employee assignment is optional (nullable)
- If `body.employee_id` is provided, it is assigned to the incident
- If not provided, defaults to `null`
- Mobile flow passes `employee_id` from selected employee or newly created employee

#### 1.2 Status Defaults to "open"
**VERIFIED**

```javascript
// route.js line 110
${body.status || "open"},
```

- If no status is provided in the request body, defaults to `"open"`
- Client can override this by providing a different status value
- **GAP**: No validation of provided status values (accepts any string)

#### 1.3 incident_number Generation
**DOCUMENTED**

```javascript
// route.js line 75
const incidentNumber = `INC-${Math.floor(Math.random() * 9000) + 1000}`;
```

- Format: `INC-XXXX` where XXXX is 1000-9999
- Uses simple random number generation
- Generated at API level, not database level

#### 1.4 Collision Risk
**CRITICAL GAP IDENTIFIED**

| Issue | Detail |
|-------|--------|
| Total possible values | 9,000 (INC-1000 to INC-9999) |
| Uniqueness check | **NONE** |
| Database constraint | **UNKNOWN** (no UNIQUE constraint verified) |
| Collision probability | Increases with each incident created |
| Birthday paradox risk | ~50% collision chance at ~120 incidents |

**Impact**: If duplicate incident_numbers are created:
- Confusion in searches and reports
- Potential data integrity issues in dependent systems
- Audit trail complications

#### 1.5 Field Validation for Required Fields
**GAP IDENTIFIED**

| Field | API Behavior | Validation |
|-------|--------------|------------|
| incident_date | Required in INSERT | **NO validation** - SQL will error if missing |
| incident_time | Required in INSERT | **NO validation** - SQL will error if missing |
| incident_type | Required in INSERT | **NO validation** - SQL will error if missing |
| severity | Required in INSERT | **NO validation** - SQL will error if missing |
| location | Required in INSERT | **NO validation** - SQL will error if missing |

**Impact**:
- API relies on database errors for validation
- No friendly error messages returned to client
- Client receives raw SQL error on missing required fields

---

## Task 2: Audit Mobile Creation Flow

### File Audited
- `/apps/mobile/src/app/(tabs)/new-incident.jsx`
- `/apps/mobile/src/hooks/useIncidentForm.js`

### Findings

#### 2.1 5-Step Creation Process
**VERIFIED**

| Step | Component | Purpose |
|------|-----------|---------|
| 1 | `EmployeeDetailsStep` | Select existing or create new employee |
| 2 | `IncidentDetailsStep` | Date, time, type, severity, body parts, description |
| 3 | `IncidentAnalysisStep` | Tenure, shift info, PPE, training, media files |
| 4 | `LocationContextStep` | Location, site area, address |
| 5 | `ReviewSubmitStep` | Review all data and submit |

#### 2.2 Employee Selection Flow
**DOCUMENTED**

```javascript
// useIncidentForm.js lines 72-84
let employeeId = selectedEmployee?.id;

if (!employeeId && employeeData.full_name) {
  // Try to create employee first if online
  const empResponse = await fetch("/api/employees", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(employeeData),
  });
  if (empResponse.ok) {
    const emp = await empResponse.json();
    employeeId = emp.id;
  }
}
```

- Can select existing employee from search
- Can create new employee inline during incident creation
- Employee ID passed to incident POST request

#### 2.3 Sync Behavior with Backend
**DOCUMENTED**

| Scenario | Behavior |
|----------|----------|
| Online success | POST to `/api/incidents`, navigate to incident detail |
| Online failure | Save to offline queue via `addToQueue()` |
| Offline | Save to queue, navigate to dashboard |

**Offline Queue Structure**:
```javascript
{
  type: "SUBMIT_INCIDENT",
  payload: {
    employeeId,
    employeeData,
    incidentData,
    analysisData,
    locationData,
  },
  title: `Incident: ${incidentData.incident_type}`,
  desc: incidentData.incident_date,
}
```

**Gap**: Offline queue payload structure differs from API payload structure - requires transformation during sync.

---

## Task 3: Document Status Values and Transitions

### File Audited
- `/apps/web/src/app/api/dashboard/stats/route.js`

### Findings

#### 3.1 Current Status Values
**DOCUMENTED**

| Status | Used In | Purpose |
|--------|---------|---------|
| `open` | incidents/route.js, dashboard, mobile UI | Default status for new incidents |
| `draft` | mileage-reimbursements, modified-duty-policies | Work in progress, not submitted |
| `submitted` | reviews page, status-logs | Awaiting review/approval |
| `approved` | reviews page | Approved by reviewer |
| `rejected` | reviews page, mobile incident detail | Rejected by reviewer |

#### 3.2 Missing Status Values
**GAP IDENTIFIED**

| Missing Status | Expected Purpose |
|----------------|------------------|
| `resolved` | Incident has been addressed/fixed |
| `closed` | Incident lifecycle complete, no further action |
| `in_progress` | Actively being worked on |
| `pending_info` | Awaiting additional information |

**Impact**: No way to mark incidents as fully resolved or closed.

#### 3.3 No State Machine for Valid Transitions
**CRITICAL GAP**

Current implementation allows ANY status value to be set via PATCH:

```javascript
// incidents/[id]/route.js lines 78-83
for (const field of allowedFields) {
  if (body[field] !== undefined) {
    updates.push(`${field} = $${paramCount}`);
    values.push(body[field]);
    paramCount++;
  }
}
```

**No validation for**:
- Valid status values
- Valid transitions (e.g., `rejected` -> `approved` directly)
- Required fields for transition (e.g., `rejection_reason` when status = `rejected`)
- Role-based transition permissions

**Impact**:
- Any authenticated user can set any status
- Invalid status values can be stored
- No audit trail of WHY status changed (only THAT it changed)
- Workflow integrity cannot be enforced

---

## Gaps Discovered

### Critical
1. **incident_number collision risk** - Only 9,000 possible values with no uniqueness check
2. **No state machine** - Status transitions uncontrolled
3. **No status validation** - Any string accepted as status value

### High Priority
4. **No required field validation** - API relies on database errors
5. **Missing terminal statuses** - No `resolved` or `closed` status
6. **Offline queue format mismatch** - Requires transformation during sync

### Medium Priority
7. **No transition audit** - Status change reason not captured
8. **No role-based transition control** - Any user can change any status

---

## Phase 10 Recommendations

### 1. Implement Status State Machine

```javascript
const VALID_TRANSITIONS = {
  open: ['submitted', 'draft'],
  draft: ['submitted', 'open'],
  submitted: ['approved', 'rejected'],
  approved: ['closed', 'open'],  // reopen if needed
  rejected: ['open', 'draft'],   // allow resubmission
  closed: [],                     // terminal state
};

function validateTransition(currentStatus, newStatus) {
  return VALID_TRANSITIONS[currentStatus]?.includes(newStatus);
}
```

### 2. Add Missing Statuses
Add to database and API:
- `resolved` - Incident addressed but awaiting confirmation
- `closed` - Terminal state, complete lifecycle
- `in_progress` - Optional: actively being worked

### 3. Fix incident_number Generation

**Option A**: UUID-based
```javascript
const incidentNumber = `INC-${uuidv4().slice(0, 8).toUpperCase()}`;
```

**Option B**: Sequence-based
```sql
CREATE SEQUENCE incident_number_seq;
-- Then in JS:
const [[{nextval}]] = await sql`SELECT nextval('incident_number_seq')`;
const incidentNumber = `INC-${String(nextval).padStart(6, '0')}`;
```

### 4. Add Field Validation
```javascript
// Before INSERT
const required = ['incident_date', 'incident_time', 'incident_type', 'severity', 'location'];
for (const field of required) {
  if (!body[field]) {
    return Response.json({ error: `Missing required field: ${field}` }, { status: 400 });
  }
}

// Enum validation
const validStatuses = ['open', 'draft', 'submitted', 'approved', 'rejected', 'resolved', 'closed'];
if (body.status && !validStatuses.includes(body.status)) {
  return Response.json({ error: `Invalid status: ${body.status}` }, { status: 400 });
}
```

### 5. Add Transition Audit Fields
```sql
ALTER TABLE incidents ADD COLUMN status_changed_by UUID REFERENCES users(id);
ALTER TABLE incidents ADD COLUMN status_changed_reason TEXT;
```

---

## Verification Checklist

- [x] Incident creation flow documented
- [x] Mobile flow documented (5 steps verified)
- [x] Status values and gaps documented
- [x] SUMMARY.md created with findings
