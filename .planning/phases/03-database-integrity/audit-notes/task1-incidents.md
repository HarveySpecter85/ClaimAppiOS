# Task 1: incidents Table Audit

## Date: 2026-01-17

---

## 1. incidents Table - Main Parent Table

### Schema (Inferred from Code)
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID/Integer | PRIMARY KEY |
| incident_number | VARCHAR | Auto-generated (INC-XXXX), should be UNIQUE |
| employee_id | UUID/Integer | FK -> employees(id), NULL allowed |
| client_id | UUID/Integer | FK -> clients(id), NULL allowed |
| incident_date | DATE | NOT NULL (required in POST) |
| incident_time | TIME | NOT NULL (required in POST) |
| incident_type | VARCHAR | NOT NULL (required in POST) |
| severity | VARCHAR | Enum: 'critical', 'high', 'medium', 'low' |
| priority | VARCHAR | Enum: 'low', 'medium', 'high' - DEFAULT 'medium' |
| status | VARCHAR | Enum: 'open', 'draft', 'submitted' - DEFAULT 'open' |
| location | VARCHAR | NOT NULL (required in POST) |
| site_area | VARCHAR | NULL allowed |
| address | VARCHAR | NULL allowed |
| description | TEXT | NULL allowed |
| body_parts_injured | ARRAY | PostgreSQL array type, defaults to [] |
| date_reported_to_employer | DATE | NULL allowed |
| reported_to_name | VARCHAR | NULL allowed |
| analysis_data | JSON/JSONB | Stored via separate UPDATE |
| initial_cause | TEXT | NULL allowed |
| reviewed_by | UUID/VARCHAR | NULL allowed |
| reviewed_at | TIMESTAMP | NULL allowed |
| rejection_reason | TEXT | NULL allowed |
| submission_date | DATE | NULL allowed |
| created_at | TIMESTAMP | DEFAULT NOW() |
| updated_at | TIMESTAMP | Updated on PATCH |

### Foreign Keys Verified

1. **employee_id -> employees(id)**:
   - **USED**: LEFT JOIN in GET queries (line 22 of route.js)
   - **NULLABLE**: Both `${body.employee_id || null}` confirms nullable
   - **CASCADE RISK**: Unknown behavior on employee delete

2. **client_id -> clients(id)**:
   - **USED**: LEFT JOIN in GET queries (line 23 of route.js)
   - **NULLABLE**: `${body.client_id || null}` confirms nullable
   - **CRITICAL**: Used for client isolation filtering

### Enum/Check Constraints

1. **status** enum values:
   - Values observed: 'open', 'draft', 'submitted'
   - **NO VALIDATION IN POST**: Accepts any string (line 110: `${body.status || "open"}`)
   - **NO VALIDATION IN PATCH**: Accepts any status value
   - **RISK**: Database could contain invalid status values

2. **priority** enum values:
   - Values observed: 'low', 'medium', 'high'
   - **NO VALIDATION IN POST**: `${body.priority || "medium"}`
   - **NO VALIDATION IN PATCH**: Direct assignment from body
   - **RISK**: Database could contain invalid priority values

3. **severity** enum values:
   - Values observed: 'critical', 'high', 'medium', 'low'
   - **NO VALIDATION IN POST/PATCH**: Direct from body
   - Used in notification emoji selection (critical, high, other)
   - **RISK**: Invalid values could break notification logic

### Special Fields

1. **body_parts_injured (ARRAY)**:
   - PostgreSQL array type
   - Default: `${body.body_parts_injured || []}` (empty array)
   - **HANDLES NULL**: Properly defaults to empty array
   - **INSERTION**: Uses PostgreSQL parameterized array

2. **analysis_data (JSON)**:
   - Stored via separate UPDATE after INSERT (lines 116-123)
   - Uses `JSON.stringify()` before storage
   - **POTENTIAL ISSUE**: JSON column type vs JSONB not confirmed
   - **INSERTION PATTERN**: Suboptimal (INSERT then UPDATE)

3. **incident_number (auto-generated)**:
   - Format: `INC-${Math.floor(Math.random() * 9000) + 1000}`
   - Range: INC-1000 to INC-9999
   - **COLLISION RISK**: Only 9000 unique values possible
   - **NO UNIQUENESS CHECK**: Could create duplicates
   - **RECOMMENDATION**: Add database UNIQUE constraint or use sequence

---

## 2. Client Isolation - Critical Security Feature

### Implementation in GET (route.js lines 30-41)

```javascript
if (user.system_role !== "global_admin") {
  if (user.client_ids.length === 0) {
    return Response.json([]);
  }
  query += ` AND i.client_id = ANY($${paramCount})`;
  params.push(user.client_ids);
  paramCount++;
}
```

**VERIFIED**:
- Global admins bypass client filter (see all incidents)
- Standard users only see incidents where `client_id IN user.client_ids`
- Empty client_ids returns empty result (not error)

**ISSUES FOUND**:

1. **incidents/[id]/route.js GET (lines 11-35)**:
   - **MISSING CLIENT ISOLATION**
   - Any authenticated user can view any incident by ID
   - No check for `client_id = ANY(user.client_ids)`
   - **SECURITY VULNERABILITY**

2. **incidents/[id]/route.js PATCH (lines 38-132)**:
   - **MISSING CLIENT ISOLATION**
   - Any authenticated user can modify any incident by ID
   - **SECURITY VULNERABILITY**

3. **incidents/[id]/dossier/route.js GET**:
   - **MISSING CLIENT ISOLATION**
   - Exposes all incident data including evidence, interviews, actions
   - **CRITICAL SECURITY VULNERABILITY**

---

## 3. Dependent Child Tables (CASCADE RISK)

The incidents table is the parent to **14 child tables**:

| Child Table | FK Column | Query Source |
|-------------|-----------|--------------|
| interviews | incident_id | interviews/route.js |
| interview_witnesses | (via interviews) | interview-witnesses/route.js |
| root_cause_analysis | incident_id | root-cause/route.js |
| corrective_actions | incident_id | corrective-actions/route.js |
| evidence | incident_id | evidence/route.js |
| status_logs | incident_id | status-logs/route.js |
| messages | incident_id | messages/route.js |
| medical_authorizations | incident_id | medical-authorizations/route.js |
| benefit_affidavits | incident_id | benefit-affidavits/route.js |
| refusal_of_treatments | incident_id | refusal-of-treatments/route.js |
| prescription_cards | incident_id | prescription-cards/route.js |
| mileage_reimbursements | incident_id | mileage-reimbursements/route.js |
| modified_duty_policies | incident_id | modified-duty-policies/route.js |
| push_subscriptions | incident_id | push-subscriptions/route.js |
| secure_form_links | incident_id | secure-form-links/route.js |

### Delete Behavior Analysis

**NO DELETE ENDPOINT FOUND** for incidents table.

This is actually a **SAFEGUARD** - incidents cannot be deleted via API, preventing orphan records.

However, if DELETE is added later:
- **14 child tables** would be affected
- **No soft delete pattern** implemented
- **Recommendation**: Add `deleted_at` column for soft delete before any DELETE endpoint

---

## 4. Query Patterns

### GET /api/incidents (List)

```sql
SELECT
  i.*,
  e.full_name as employee_name,
  c.name as client_name,
  c.location as client_location
FROM incidents i
LEFT JOIN employees e ON i.employee_id = e.id
LEFT JOIN clients c ON i.client_id = c.id
WHERE 1=1
  AND i.client_id = ANY($1)  -- client isolation
  [optional filters]
ORDER BY i.{sortBy} DESC
```

**ISSUES**:
1. **SQL Injection Risk in ORDER BY**: `i.${sortBy}` directly interpolated
   - Mitigated by using tagged template literals, but sortBy not validated
   - Could cause SQL error with invalid column names

2. **SELECT i.*** returns all columns including internal fields

### GET /api/incidents/[id] (Single)

- Uses LEFT JOINs for employee and client data
- Returns single incident with related names
- **MISSING**: Client isolation check

### PATCH /api/incidents/[id]

- Dynamic UPDATE with allowed fields whitelist
- Includes audit logging via `logAudit()`
- Sends push notifications on status change
- **GOOD**: Uses parameterized queries
- **ISSUE**: No validation of enum values before update

---

## 5. Recommendations for Phase 10

### Critical (Security)
1. **Add client isolation** to GET /api/incidents/[id]
2. **Add client isolation** to PATCH /api/incidents/[id]
3. **Add client isolation** to GET /api/incidents/[id]/dossier

### High Priority
4. **Add enum validation** for status, priority, severity in POST/PATCH
5. **Add UNIQUE constraint** on incident_number column
6. **Consider sequence-based** incident_number generation to prevent collisions

### Medium Priority
7. **Add soft delete** (deleted_at column) before implementing DELETE
8. **Validate sortBy** against whitelist of allowed columns
9. **Optimize analysis_data insertion** - include in initial INSERT

### Low Priority
10. Consider creating a view that excludes internal columns for list queries
11. Add index on client_id for faster client isolation filtering

---

## Summary

| Aspect | Status | Notes |
|--------|--------|-------|
| Primary Key | VERIFIED | id column used in all queries |
| employee_id FK | VERIFIED | LEFT JOIN pattern used |
| client_id FK | VERIFIED | LEFT JOIN + filtering used |
| Client isolation (list) | VERIFIED | ANY() filter on client_ids |
| Client isolation (single) | **MISSING** | SECURITY VULNERABILITY |
| Client isolation (dossier) | **MISSING** | CRITICAL VULNERABILITY |
| Status enum validation | MISSING | No server-side validation |
| Priority enum validation | MISSING | No server-side validation |
| Severity enum validation | MISSING | No server-side validation |
| incident_number uniqueness | UNKNOWN | No UNIQUE constraint verified |
| DELETE cascade risk | MITIGATED | No DELETE endpoint exists |
| Child tables identified | 14 TABLES | All documented |
| N+1 query patterns | NONE | Single queries with JOINs |
