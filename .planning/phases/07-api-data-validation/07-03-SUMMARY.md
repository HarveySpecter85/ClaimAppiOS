# Audit 07-03: Investigation Endpoints Data Validation Summary

## Overview
This audit examines investigation-related endpoints (interviews, evidence, corrective-actions, root-cause, interview-witnesses) to verify proper data relationships and identify gaps where related data is not returned.

---

## Task 1: Interviews Endpoint Audit

### Files Examined
- `/apps/web/src/app/api/interviews/route.js`
- `/apps/web/src/app/api/interviews/[id]/route.js`

### Findings

#### GET `/api/interviews` (List by incident_id)
**Current Implementation:**
```javascript
SELECT * FROM interviews
WHERE incident_id = ${incidentId}
ORDER BY created_at DESC
```

**Issues Identified:**
1. **No incident data joined** - Returns raw `incident_id` without incident details
2. **No employee data joined** - Returns raw `employee_id` without employee name/details
3. **No witnesses included** - Witnesses are stored separately and not fetched

**Fields Returned:**
- All `interviews` table columns only
- `interviewee_name`, `interviewee_role` - populated directly in table (not from employee lookup)

#### GET `/api/interviews/[id]` (Single interview)
**Current Implementation:**
```javascript
SELECT
  i.*,
  inc.incident_number,
  e.full_name as employee_name,
  e.employee_id as employee_number,
  e.job_position as employee_position
FROM interviews i
LEFT JOIN incidents inc ON i.incident_id = inc.id
LEFT JOIN employees e ON i.employee_id = e.id
WHERE i.id = ${id}
```

**Strengths:**
1. Incident data IS joined (incident_number)
2. Employee data IS joined (full_name, employee_id, job_position)
3. Witnesses ARE fetched separately and included

**Additional Fields Returned:**
- `incident_number` (from incidents)
- `employee_name` (from employees.full_name)
- `employee_number` (from employees.employee_id)
- `employee_position` (from employees.job_position)
- `witnesses` array (from interview_witnesses)

#### Interview Type Distinction
- The `type` field (default: "primary") distinguishes primary vs witness interviews
- This is set on INSERT and stored in the interviews table

### Recommendations for Phase 10
1. Add JOINs to the list endpoint (`/api/interviews`) to include incident and employee data
2. Include witnesses in list responses for consistency
3. Consider adding interview type filtering capability

---

## Task 2: Evidence Endpoint Audit

### Files Examined
- `/apps/web/src/app/api/evidence/route.js`

### Findings

#### GET `/api/evidence` (List by incident_id)
**Current Implementation:**
```javascript
SELECT * FROM evidence WHERE incident_id = $1
```

**Issues Identified:**
1. **No uploaded_by employee name included** - Returns raw `uploaded_by` (likely employee ID) without resolving name
2. **No incident context included** - Returns raw `incident_id` without incident details

**Fields Returned:**
- All `evidence` table columns only
- `uploaded_by` - stores ID but doesn't resolve to employee name
- `file_type`, `file_name`, `file_url`, `file_size`, `note_content`, `upload_status`

### Recommendations for Phase 10
1. JOIN employees table to resolve `uploaded_by` to employee name
2. Optionally include incident context (incident_number)

---

## Task 3: Corrective Actions Endpoint Audit

### Files Examined
- `/apps/web/src/app/api/corrective-actions/route.js`

### Findings

#### GET `/api/corrective-actions` (List by incident_id and/or status)
**Current Implementation:**
```javascript
SELECT * FROM corrective_actions WHERE 1=1
-- Filters added for incident_id and status
```

**Issues Identified:**
1. **No assigned_to employee name included** - Uses `assignee_name` and `assignee_id` fields but doesn't validate/resolve from employees table
2. **No incident context included** - Returns raw `incident_id` without incident details

**Fields Returned:**
- All `corrective_actions` table columns
- `assignee_name` - stored directly in table (potential denormalization issue)
- `assignee_id` - employee ID, not resolved via JOIN
- `status` - stored values include "open" (default), likely "completed", etc.
- `priority_level` - stored directly

**Notable Pattern:**
- Uses `assignee_name` stored directly rather than JOINing employees
- This is a denormalization that could lead to stale data if employee names change

### Status Field Values
- Default: "open"
- Other values: Not documented in code, likely "completed", "in_progress", etc.

### Recommendations for Phase 10
1. Consider JOINing employees to validate assignee_id and get current name
2. Optionally include incident context (incident_number)
3. Document allowed status values

---

## Task 4: Witness Relationship Pattern

### Files Examined
- `/apps/web/src/app/api/interview-witnesses/route.js`
- `/apps/web/src/app/api/incidents/[id]/dossier/route.js`

### Findings

#### How Witnesses Are Linked
The `interview_witnesses` table links witnesses to interviews:
- `interview_id` - foreign key to interviews table
- `witness_name` - stored directly (not linked to employees)
- `witness_role` - optional role/title

#### Standalone Endpoint (`/api/interview-witnesses`)
**Current Implementation:**
- POST only - creates witness records
- NO GET endpoint - cannot list witnesses independently

#### Witness Retrieval Patterns

**In Single Interview (`/api/interviews/[id]`):**
```javascript
const witnesses = await sql`
  SELECT * FROM interview_witnesses
  WHERE interview_id = ${id}
  ORDER BY created_at
`;
return Response.json({ ...interview, witnesses });
```

**In Dossier Endpoint (`/api/incidents/[id]/dossier`):**
```javascript
const interviewIds = interviews.map((i) => i.id);
if (interviewIds.length > 0) {
  witnesses = await sql`
    SELECT * FROM interview_witnesses
    WHERE interview_id = ANY(${interviewIds})
  `;
}
// Attaches witnesses to respective interviews
```

#### Orphaned Relationship Patterns
1. **No standalone witness listing** - Witnesses can only be retrieved via interview context
2. **No witness validation** - witness_name is free text, not linked to employees table
3. **List endpoint missing witnesses** - `/api/interviews?incident_id=X` doesn't include witnesses

### Root Cause Endpoint Structure

#### GET `/api/root-cause` (List by incident_id)
**Current Implementation:**
```javascript
SELECT * FROM root_cause_analysis
WHERE incident_id = ${incidentId}
ORDER BY why_level
```

**Fields Returned:**
- All `root_cause_analysis` table columns
- `problem_statement` - the initial problem
- `why_level` - numeric level (1-5 for 5 Whys)
- `question` - the "why" question
- `answer` - the response
- `supporting_evidence` - supporting documentation
- `conclusion` - final determination
- `finalized` - boolean flag

**Issues Identified:**
1. No incident context returned (just `incident_id`)
2. No user/author information for who created each entry

### Recommendations for Phase 10
1. Add GET endpoint to interview-witnesses for standalone listing
2. Consider linking witness_name to employees table
3. Include witnesses in interview list responses

---

## Consistency Analysis: Dossier vs Individual Endpoints

| Data Type | Dossier Endpoint | Individual Endpoint |
|-----------|------------------|---------------------|
| Incident | Includes employee, client JOINs | N/A (is the incident) |
| Evidence | Raw SELECT * | Raw SELECT * |
| Interviews | Raw SELECT * + witnesses attached | List: Raw SELECT *, Single: JOINs + witnesses |
| Corrective Actions | Raw SELECT * | Raw SELECT * |
| Root Cause | Raw SELECT * | Raw SELECT * |

**Key Observation:**
The dossier endpoint does NOT include JOINs for investigation-related tables - it fetches raw data from each table. This means:
- Evidence doesn't resolve uploaded_by
- Interviews don't resolve employee_id (only done in single interview endpoint)
- Corrective actions don't resolve assignee_id

---

## Summary of Issues for Phase 10

### Critical Issues
| Priority | Endpoint | Issue |
|----------|----------|-------|
| High | `/api/interviews` (list) | Missing incident/employee JOINs |
| High | `/api/evidence` | Missing uploaded_by employee name |
| Medium | `/api/corrective-actions` | Uses denormalized assignee_name, no validation |
| Medium | `/api/interview-witnesses` | No GET endpoint |

### Pattern Issues
1. **Inconsistent data enrichment** - Single interview endpoint has JOINs, list endpoint doesn't
2. **Denormalized data risks** - assignee_name and witness_name stored as text, not validated
3. **Dossier endpoint passes through raw data** - Doesn't leverage JOINs for related data

### Recommended Fixes
1. Add JOINs to all list endpoints for related names/context
2. Standardize whether names are stored or JOINed (prefer JOINs for consistency)
3. Add GET endpoint for interview-witnesses
4. Consider enriching dossier endpoint with JOINs

---

## Verification Checklist

- [x] Interviews endpoint audited
- [x] Evidence endpoint audited
- [x] Corrective actions endpoint audited
- [x] Witness relationship pattern documented
- [x] Root cause endpoint structure documented
- [x] SUMMARY.md created with findings
