# Task 2: interviews and interview_witnesses Tables Audit

## Date: 2026-01-17

---

## 1. interviews Table

### Schema (Inferred from Code)
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID/Integer | PRIMARY KEY |
| incident_id | UUID/Integer | FK -> incidents(id), REQUIRED |
| employee_id | UUID/Integer | FK -> employees(id), NULL allowed |
| interviewee_name | VARCHAR | NULL allowed (for non-employee interviewees) |
| interviewee_role | VARCHAR | NULL allowed |
| type | VARCHAR | DEFAULT 'primary' |
| audio_recording_url | VARCHAR | NULL allowed |
| video_recording_url | VARCHAR | NULL allowed |
| written_statement | TEXT | NULL allowed |
| wearing_ppe | BOOLEAN | NULL allowed |
| area_adequately_lit | BOOLEAN | NULL allowed |
| witnessed_directly | BOOLEAN | NULL allowed |
| status | VARCHAR | Enum: 'pending', 'draft' - DEFAULT 'pending' |
| created_at | TIMESTAMP | DEFAULT NOW() (used in ORDER BY) |

### Foreign Keys Verified

1. **incident_id -> incidents(id)**:
   - **REQUIRED**: Direct insertion without null check in POST (line 28 of route.js)
   - **VERIFIED**: Used in WHERE clause for filtering
   - **CASCADE RISK**: Unknown behavior if incident deleted
   - **NO VALIDATION**: Does not verify incident exists before INSERT

2. **employee_id -> employees(id)**:
   - **OPTIONAL**: `${body.employee_id || null}` in POST
   - **USED**: LEFT JOIN in [id]/route.js (line 18) to get employee details
   - Design allows interviewing non-employees (witnesses, contractors)

### Constraints Analysis

1. **incident_id NOT NULL**:
   - **IMPLICIT**: POST requires incident_id but no explicit validation
   - **RISK**: Could INSERT null if body.incident_id undefined
   - **RECOMMENDATION**: Add explicit validation

2. **status enum**:
   - Values: 'pending', 'draft' (inferred from default)
   - **NO VALIDATION**: Accepts any string value
   - **RISK**: Invalid status values could be stored

3. **type enum**:
   - Default: 'primary'
   - Other values unknown from code
   - **NO VALIDATION**: Accepts any string value

### Query Patterns

**GET /api/interviews (List)**:
```sql
SELECT * FROM interviews
WHERE incident_id = ${incidentId}
ORDER BY created_at DESC
```
- **CLEAN**: Simple filtered query
- **MISSING CLIENT ISOLATION**: Does not verify user has access to parent incident

**GET /api/interviews/[id] (Single)**:
```sql
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
- **GOOD**: Fetches related incident and employee data in single query
- **WITNESSES FETCHED SEPARATELY**: See below
- **MISSING CLIENT ISOLATION**: No check for user's client access

**POST /api/interviews**:
- INSERT with 12 columns
- **NO incident_id VALIDATION**: Does not verify incident exists
- **NO CLIENT ISOLATION**: Does not verify user can access the incident

**PUT/PATCH /api/interviews**:
- Dynamic UPDATE with allowed fields whitelist
- **MISSING**: incident_id not updatable (good - prevents reassignment)
- **MISSING CLIENT ISOLATION**: No access check

---

## 2. interview_witnesses Table

### Schema (Inferred from Code)
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID/Integer | PRIMARY KEY |
| interview_id | UUID/Integer | FK -> interviews(id), REQUIRED |
| witness_name | VARCHAR | REQUIRED in POST |
| witness_role | VARCHAR | NULL allowed |
| created_at | TIMESTAMP | Implied from ORDER BY in [id]/route.js |

### Foreign Keys Verified

1. **interview_id -> interviews(id)**:
   - **REQUIRED**: Direct insertion `${body.interview_id}`
   - **NO VALIDATION**: Does not verify interview exists
   - **CASCADE BEHAVIOR**: Unknown - if interview deleted, orphans may remain

### Constraints Analysis

1. **interview_id NOT NULL**:
   - **IMPLICIT**: Required in INSERT but no explicit validation
   - **RISK**: Could INSERT null if body.interview_id undefined

2. **witness_name NOT NULL**:
   - **IMPLICIT**: Required in INSERT but no explicit validation
   - **RISK**: Could INSERT null value

### Query Patterns

**POST /api/interview-witnesses**:
```sql
INSERT INTO interview_witnesses (
  interview_id,
  witness_name,
  witness_role
) VALUES (...)
RETURNING *
```
- **NO GET ENDPOINT**: Witnesses can only be created, not listed directly
- Witnesses are fetched via interview endpoints

**GET /api/interviews/[id]** (Includes witnesses):
```sql
SELECT * FROM interview_witnesses
WHERE interview_id = ${id}
ORDER BY created_at
```
- **TWO QUERIES**: Main interview + witnesses fetched separately
- **NO N+1 ISSUE**: Single additional query per interview (acceptable)

**GET /api/incidents/[id]/dossier** (Bulk witnesses):
```sql
SELECT * FROM interview_witnesses
WHERE interview_id = ANY(${interviewIds})
```
- **EFFICIENT**: Uses ANY() for bulk fetch
- **JOINS IN CODE**: Witnesses attached to interviews in JavaScript (lines 68-71)

---

## 3. Security Issues Identified

### Missing Client Isolation

All interview endpoints lack client isolation:

| Endpoint | Issue |
|----------|-------|
| GET /api/interviews | Returns interviews for any incident_id |
| GET /api/interviews/[id] | Returns any interview by ID |
| POST /api/interviews | Creates interview for any incident |
| PUT /api/interviews | Updates any interview |
| PATCH /api/interviews/[id] | Updates any interview |
| POST /api/interview-witnesses | Creates witness for any interview |

**ATTACK SCENARIO**: Authenticated user with access to Client A could:
1. Query interviews for incidents belonging to Client B
2. Create interviews on incidents they should not access
3. View sensitive witness information across clients

### Missing Existence Validation

| Endpoint | Missing Check |
|----------|---------------|
| POST /api/interviews | incident_id exists in incidents table |
| POST /api/interview-witnesses | interview_id exists in interviews table |

Without FK constraints at database level, orphan records could be created.

---

## 4. Cascade Risk Analysis

### Hierarchy

```
incidents
   |
   +-- interviews (FK: incident_id)
          |
          +-- interview_witnesses (FK: interview_id)
```

### Delete Scenarios

1. **If incident deleted**:
   - interviews table: Orphan records (incident_id points to non-existent row)
   - interview_witnesses: Still attached to orphaned interviews

2. **If interview deleted**:
   - interview_witnesses: Orphan records
   - **NO DELETE ENDPOINT** for interviews (safeguard)

### Current Protection

- **NO DELETE endpoints** exist for interviews or interview_witnesses
- This prevents cascade issues but also prevents cleanup of erroneous data

---

## 5. Recommendations for Phase 10

### Critical (Security)
1. **Add client isolation** to GET /api/interviews:
   - Join to incidents table, check client_id against user.client_ids
2. **Add client isolation** to GET /api/interviews/[id]:
   - Verify interview's incident belongs to user's clients
3. **Add client isolation** to POST /api/interviews:
   - Validate incident_id belongs to user's clients before INSERT
4. **Add client isolation** to PUT/PATCH:
   - Validate interview belongs to accessible incident

### High Priority
5. **Add incident_id existence validation** in POST /api/interviews
6. **Add interview_id existence validation** in POST /api/interview-witnesses
7. **Add NOT NULL validation** for required fields (incident_id, witness_name)

### Medium Priority
8. **Add enum validation** for status field ('pending', 'draft')
9. **Add enum validation** for type field (document allowed values)
10. Consider **ON DELETE CASCADE** for interview_witnesses.interview_id

### Low Priority
11. Consider adding GET endpoint for interview_witnesses (for management UI)
12. Add index on interviews.incident_id for faster filtering

---

## Summary

| Aspect | Status | Notes |
|--------|--------|-------|
| interviews PK | VERIFIED | id column used in queries |
| interviews.incident_id FK | VERIFIED | Required, used in JOINs |
| interviews.employee_id FK | VERIFIED | Optional, LEFT JOIN used |
| interview_witnesses PK | VERIFIED | id column |
| interview_witnesses.interview_id FK | VERIFIED | Required |
| Client isolation (interviews) | **MISSING** | All endpoints vulnerable |
| Client isolation (witnesses) | **MISSING** | Via interview endpoints |
| Status enum validation | MISSING | No server-side check |
| Type enum validation | MISSING | No server-side check |
| Existence validation | MISSING | FKs not verified before INSERT |
| DELETE cascade risk | MITIGATED | No DELETE endpoints exist |
| N+1 query patterns | NONE | Acceptable patterns used |
| Witness fetch pattern | VERIFIED | Bulk fetch with ANY() in dossier |
