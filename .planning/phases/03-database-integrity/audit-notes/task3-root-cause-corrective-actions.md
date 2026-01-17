# Task 3: root_cause_analysis and corrective_actions Tables Audit

## Date: 2026-01-17

---

## 1. root_cause_analysis Table

### Schema (Inferred from Code)
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID/Integer | PRIMARY KEY |
| incident_id | UUID/Integer | FK -> incidents(id), REQUIRED |
| problem_statement | TEXT | REQUIRED in POST |
| why_level | INTEGER | 1-5 (Five-Why methodology) |
| question | TEXT | REQUIRED in POST |
| answer | TEXT | NULL allowed |
| supporting_evidence | TEXT | NULL allowed |
| conclusion | TEXT | NULL allowed |
| finalized | BOOLEAN | DEFAULT false |
| created_at | TIMESTAMP | Implied from schema |

### Foreign Keys Verified

1. **incident_id -> incidents(id)**:
   - **REQUIRED**: Direct insertion in POST (line 32 of root-cause/route.js)
   - **USED**: WHERE clause in GET queries
   - **NO VALIDATION**: Does not verify incident exists before INSERT
   - **CASCADE RISK**: Unknown behavior if incident deleted

### Constraints Analysis

1. **incident_id NOT NULL**:
   - **IMPLICIT**: Required in INSERT but no explicit validation
   - **RISK**: Could INSERT null if body.incident_id undefined

2. **why_level (1-5)**:
   - **NO RANGE VALIDATION**: Accepts any integer value
   - **DESIGN**: Five-Why methodology expects levels 1-5
   - **RISK**: Invalid levels could be stored (0, 6, negative)
   - **USED**: In ORDER BY clause (ascending)

3. **finalized BOOLEAN**:
   - **DEFAULT**: false (line 47: `${body.finalized || false}`)
   - **NO UPDATE ENDPOINT**: Once created, finalized cannot be changed
   - **DESIGN ISSUE**: May need PATCH endpoint for workflow

4. **Multiple entries per incident**:
   - **VERIFIED**: No unique constraint on (incident_id, why_level)
   - **DESIGN**: Each why_level can have its own row
   - **EXPECTED**: Up to 5 rows per incident (why levels 1-5)

### Query Patterns

**GET /api/root-cause**:
```sql
SELECT * FROM root_cause_analysis
WHERE incident_id = ${incidentId}
ORDER BY why_level
```
- **CLEAN**: Simple filtered query ordered by why level
- **MISSING CLIENT ISOLATION**: No check for user access to incident

**POST /api/root-cause**:
- INSERT with 8 columns
- **NO incident_id VALIDATION**: Does not verify incident exists
- **NO CLIENT ISOLATION**: Does not verify user can access incident
- **NO UPDATE ENDPOINT**: Cannot modify after creation

**Used in dossier**:
```sql
SELECT * FROM root_cause_analysis
WHERE incident_id = ${id}
ORDER BY why_level ASC
```
- **CONSISTENT**: Same pattern as direct endpoint

---

## 2. corrective_actions Table

### Schema (Inferred from Code)
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID/Integer | PRIMARY KEY |
| incident_id | UUID/Integer | FK -> incidents(id), REQUIRED |
| title | VARCHAR | REQUIRED in POST |
| description | TEXT | NULL allowed |
| assignee_name | VARCHAR | NULL allowed (denormalized) |
| assignee_id | UUID/Integer | **MISSING FK** -> should ref employees(id) |
| due_date | DATE | NULL allowed |
| status | VARCHAR | Enum: 'open', 'draft' - DEFAULT 'open' |
| priority_level | VARCHAR | NULL allowed (enum unknown) |
| created_at | TIMESTAMP | Used in ORDER BY |

### Foreign Keys Verified

1. **incident_id -> incidents(id)**:
   - **REQUIRED**: Direct insertion in POST (line 50 of corrective-actions/route.js)
   - **USED**: WHERE clause in GET queries
   - **NO VALIDATION**: Does not verify incident exists before INSERT
   - **CASCADE RISK**: Unknown behavior if incident deleted

2. **assignee_id -> employees(id)**:
   - **MISSING FK CONSTRAINT**: Code accepts any value
   - **DENORMALIZED DESIGN**: Also stores assignee_name separately
   - **RISK**: assignee_id could point to non-existent employee
   - **NO JOIN**: Employee data not fetched via FK

### Constraints Analysis

1. **incident_id NOT NULL**:
   - **IMPLICIT**: Required in INSERT but no explicit validation
   - **RISK**: Could INSERT null if body.incident_id undefined

2. **status enum**:
   - Values: 'open', 'draft' (from default)
   - **NO VALIDATION**: Accepts any string value
   - **INCONSISTENT**: Different from incident status values

3. **priority_level enum**:
   - Values: Unknown from code
   - **NO VALIDATION**: Accepts any string value
   - **NO DEFAULT**: Stored as null if not provided

4. **assignee_id (MISSING FK)**:
   - **CRITICAL GAP**: Stored as-is without validation
   - **DENORMALIZED**: assignee_name stored redundantly
   - **STALE DATA RISK**: If employee name changes, corrective_action.assignee_name becomes outdated

### Query Patterns

**GET /api/corrective-actions**:
```sql
SELECT * FROM corrective_actions
WHERE 1=1
  [AND incident_id = $1]
  [AND status = $2]
ORDER BY created_at DESC
```
- **FLEXIBLE**: Optional incident_id filter
- **GLOBAL FETCH POSSIBLE**: If no incident_id, returns all corrective actions
- **MISSING CLIENT ISOLATION**: Critical vulnerability

**POST /api/corrective-actions**:
- INSERT with 8 columns
- **SENDS NOTIFICATIONS**: Uses notifyIncidentSubscribers()
- **NO incident_id VALIDATION**: Does not verify incident exists
- **NO CLIENT ISOLATION**: Does not verify user can access incident

**NO UPDATE/PATCH ENDPOINT**:
- Once created, corrective actions cannot be modified
- **DESIGN ISSUE**: Status cannot be updated (open -> completed?)
- **WORKFLOW GAP**: Cannot mark actions as done

---

## 3. Security Issues Identified

### Missing Client Isolation

| Endpoint | Issue |
|----------|-------|
| GET /api/root-cause | Returns RCA for any incident_id |
| POST /api/root-cause | Creates RCA for any incident |
| GET /api/corrective-actions | Returns ALL actions without incident filter |
| GET /api/corrective-actions?incident_id=X | Returns actions for any incident |
| POST /api/corrective-actions | Creates action for any incident |

**CRITICAL**: GET /api/corrective-actions without incident_id parameter returns ALL corrective actions across ALL clients.

### Missing Existence Validation

| Endpoint | Missing Check |
|----------|---------------|
| POST /api/root-cause | incident_id exists |
| POST /api/corrective-actions | incident_id exists |
| POST /api/corrective-actions | assignee_id exists (if provided) |

---

## 4. Data Integrity Gaps

### assignee_id Not Constrained

```javascript
INSERT INTO corrective_actions (
  ...
  assignee_id,
  ...
) VALUES (
  ...
  ${body.assignee_id || null},
  ...
)
```

**Problems**:
1. No FK constraint ensures employee exists
2. assignee_name is stored separately (denormalized)
3. If employee deleted, assignee_id becomes orphan reference
4. No JOIN used to verify or fetch employee data

### Denormalization Pattern

The corrective_actions table stores both:
- `assignee_id` (FK-like field)
- `assignee_name` (denormalized copy)

**Trade-offs**:
- PRO: Faster reads (no JOIN needed)
- CON: Data inconsistency if employee name changes
- CON: No referential integrity

**RECOMMENDATION**: Either:
1. Add FK constraint and JOIN for employee name, OR
2. Accept denormalization but add ON DELETE SET NULL trigger

---

## 5. Workflow Gaps

### root_cause_analysis Workflow

1. **No UPDATE endpoint**: Cannot modify why answers after creation
2. **No finalized workflow**: finalized flag exists but cannot be set after creation
3. **Missing**: Endpoint to finalize/lock all RCA entries for an incident

### corrective_actions Workflow

1. **No UPDATE endpoint**: Cannot mark actions as completed
2. **No status transitions**: Status is set at creation only
3. **Missing**: Workflow to track action completion

---

## 6. Recommendations for Phase 10

### Critical (Security)
1. **Add client isolation** to GET /api/root-cause:
   - Validate incident belongs to user's clients
2. **Add client isolation** to POST /api/root-cause:
   - Validate incident_id belongs to user's clients
3. **Add client isolation** to GET /api/corrective-actions:
   - REQUIRE incident_id parameter OR
   - Add implicit client filter
4. **Add client isolation** to POST /api/corrective-actions:
   - Validate incident_id belongs to user's clients

### High Priority
5. **Add incident_id existence validation** in POST endpoints
6. **Add FK constraint** on assignee_id -> employees(id) or validate in code
7. **Add PATCH endpoint** for corrective_actions to update status
8. **Add PATCH endpoint** for root_cause_analysis to update/finalize

### Medium Priority
9. **Add why_level range validation** (1-5) in POST
10. **Add enum validation** for status field
11. **Document priority_level** allowed values and validate
12. **Consider unique constraint** on (incident_id, why_level) if one entry per level expected

### Low Priority
13. **Add ON UPDATE CASCADE** for assignee_name when employee changes
14. **Consider removing** assignee_name denormalization in favor of JOINs
15. **Add index** on corrective_actions.incident_id for faster queries

---

## Summary

| Aspect | Status | Notes |
|--------|--------|-------|
| root_cause_analysis PK | VERIFIED | id column |
| root_cause_analysis.incident_id FK | VERIFIED | Required, used in queries |
| root_cause_analysis.why_level | NO VALIDATION | Should be 1-5 |
| root_cause_analysis.finalized | NO WORKFLOW | Cannot update after creation |
| corrective_actions PK | VERIFIED | id column |
| corrective_actions.incident_id FK | VERIFIED | Required, used in queries |
| corrective_actions.assignee_id FK | **MISSING** | No constraint or validation |
| corrective_actions.status | NO VALIDATION | No enum check |
| corrective_actions.priority_level | UNKNOWN | Enum values not documented |
| Client isolation (root cause) | **MISSING** | All endpoints vulnerable |
| Client isolation (corrective) | **MISSING** | CRITICAL: global fetch possible |
| Existence validation | MISSING | incident_id not verified |
| UPDATE endpoints | MISSING | No way to modify after creation |
| DELETE endpoints | MISSING | Cascade risk mitigated |

---

## Investigation Tables Audit Complete

### Full Hierarchy Documented

```
incidents (14 child tables)
   |
   +-- interviews
   |      +-- interview_witnesses
   |
   +-- root_cause_analysis
   |
   +-- corrective_actions
   |
   +-- evidence
   +-- status_logs
   +-- messages
   +-- medical_authorizations
   +-- benefit_affidavits
   +-- refusal_of_treatments
   +-- prescription_cards
   +-- mileage_reimbursements
   +-- modified_duty_policies
   +-- push_subscriptions
   +-- secure_form_links
```

### Cross-Table Findings

| Issue | Tables Affected | Severity |
|-------|-----------------|----------|
| Missing client isolation | ALL investigation tables | CRITICAL |
| Missing enum validation | incidents, interviews, corrective_actions | HIGH |
| Missing FK constraints | corrective_actions.assignee_id | HIGH |
| Missing UPDATE endpoints | root_cause_analysis, corrective_actions | MEDIUM |
| No DELETE endpoints | ALL tables | LOW (intentional) |
