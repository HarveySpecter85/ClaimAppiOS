# Plan 03-02: Database Integrity - Investigation Tables Audit

## Summary

**Status**: COMPLETE
**Date**: 2026-01-17
**Phase**: 03-database-integrity
**Plan**: 02 - Investigation Tables Audit

---

## Objective

Audit incident and investigation tables: incidents, interviews, interview_witnesses, root_cause_analysis, corrective_actions. Verify foreign key relationships and constraints for the incident investigation workflow.

---

## Tasks Completed

### Task 1: incidents Table Audit
- **File**: `audit-notes/task1-incidents.md`
- **Commit**: `audit(03-02): audit incidents table - main parent table`

### Task 2: interviews and interview_witnesses Tables Audit
- **File**: `audit-notes/task2-interviews-witnesses.md`
- **Commit**: `audit(03-02): audit interviews and interview_witnesses tables`

### Task 3: root_cause_analysis and corrective_actions Tables Audit
- **File**: `audit-notes/task3-root-cause-corrective-actions.md`
- **Commit**: `audit(03-02): audit root_cause_analysis and corrective_actions tables`

---

## Key Findings

### Tables Audited (5 Core Investigation Tables)

| Table | Rows (est.) | FKs Verified | Issues Found |
|-------|-------------|--------------|--------------|
| incidents | Parent | employee_id, client_id | 6 issues |
| interviews | Child of incidents | incident_id, employee_id | 4 issues |
| interview_witnesses | Child of interviews | interview_id | 2 issues |
| root_cause_analysis | Child of incidents | incident_id | 4 issues |
| corrective_actions | Child of incidents | incident_id | 5 issues |

### Complete Dependency Tree (incidents as Parent)

```
incidents (14 child tables identified)
   |
   +-- interviews
   |      +-- interview_witnesses
   |
   +-- root_cause_analysis
   +-- corrective_actions
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

---

## Critical Security Findings

### 1. Missing Client Isolation (CRITICAL)

**ALL investigation endpoints** lack client isolation checks:

| Endpoint | Vulnerability |
|----------|---------------|
| GET /api/incidents/[id] | Any user can view any incident |
| PATCH /api/incidents/[id] | Any user can modify any incident |
| GET /api/incidents/[id]/dossier | Exposes ALL incident data |
| GET /api/interviews | Returns interviews for any incident |
| GET /api/interviews/[id] | Returns any interview |
| POST /api/interviews | Creates interview for any incident |
| POST /api/interview-witnesses | Creates witness for any interview |
| GET /api/root-cause | Returns RCA for any incident |
| POST /api/root-cause | Creates RCA for any incident |
| GET /api/corrective-actions | **Returns ALL actions globally** |
| POST /api/corrective-actions | Creates action for any incident |

**Impact**: Cross-tenant data leakage possible for any authenticated user.

### 2. Missing FK Constraint: corrective_actions.assignee_id

```javascript
${body.assignee_id || null}  // No validation against employees table
```

- Accepts any UUID/integer value
- No database FK constraint
- assignee_name stored redundantly (denormalization)
- Risk: Orphan references if employee deleted

---

## FK Verification Results

### Verified FKs (Used in Queries)

| Table | Column | References | JOIN Type |
|-------|--------|------------|-----------|
| incidents | employee_id | employees(id) | LEFT JOIN |
| incidents | client_id | clients(id) | LEFT JOIN |
| interviews | incident_id | incidents(id) | LEFT JOIN |
| interviews | employee_id | employees(id) | LEFT JOIN |
| interview_witnesses | interview_id | interviews(id) | Implicit |
| root_cause_analysis | incident_id | incidents(id) | Implicit |
| corrective_actions | incident_id | incidents(id) | Implicit |

### Missing/Unverified FKs

| Table | Column | Should Reference | Status |
|-------|--------|------------------|--------|
| corrective_actions | assignee_id | employees(id) | **NOT CONSTRAINED** |

---

## Enum/Constraint Validation Gaps

### Missing Server-Side Validation

| Table | Field | Expected Values | Validated |
|-------|-------|-----------------|-----------|
| incidents | status | open, draft, submitted | NO |
| incidents | priority | low, medium, high | NO |
| incidents | severity | critical, high, medium, low | NO |
| interviews | status | pending, draft | NO |
| interviews | type | primary, (others?) | NO |
| corrective_actions | status | open, draft | NO |
| corrective_actions | priority_level | (unknown) | NO |
| root_cause_analysis | why_level | 1-5 | NO |

---

## Cascade Risk Assessment

### Current Protections

- **No DELETE endpoints** exist for incidents, interviews, or investigation tables
- This is an effective safeguard against orphan records

### If DELETE Added Later

| If Deleted | Orphan Tables |
|------------|---------------|
| incidents | 14 child tables |
| interviews | interview_witnesses |

### Recommendations

1. Add `deleted_at` column for soft delete pattern
2. Implement ON DELETE CASCADE or ON DELETE SET NULL at database level
3. Add pre-delete validation before any DELETE endpoint

---

## Data Integrity Issues

### 1. incident_number Collision Risk

```javascript
const incidentNumber = `INC-${Math.floor(Math.random() * 9000) + 1000}`;
```

- Only 9,000 unique values possible (INC-1000 to INC-9999)
- No uniqueness check before INSERT
- No database UNIQUE constraint verified

### 2. Denormalization in corrective_actions

Stores both:
- `assignee_id` (FK-like)
- `assignee_name` (denormalized copy)

Risk: Data inconsistency if employee name changes

### 3. SQL Injection Risk (Minor)

```javascript
query += ` ORDER BY i.${sortBy} DESC`;
```

- sortBy parameter directly interpolated
- Mitigated by tagged template usage
- Should validate against allowed column names

---

## Missing Workflow Endpoints

### root_cause_analysis
- No UPDATE/PATCH endpoint
- Cannot modify answers after creation
- Cannot set `finalized` flag after creation

### corrective_actions
- No UPDATE/PATCH endpoint
- Cannot mark actions as completed
- Status stuck at creation value

---

## Recommendations Summary

### Critical (Security) - Phase 10 Fixes Required

1. Add client isolation to all single-resource endpoints:
   - `/api/incidents/[id]` (GET, PATCH)
   - `/api/incidents/[id]/dossier` (GET)
   - `/api/interviews` (GET, POST, PUT)
   - `/api/interviews/[id]` (GET, PATCH)
   - `/api/interview-witnesses` (POST)
   - `/api/root-cause` (GET, POST)
   - `/api/corrective-actions` (GET, POST)

2. Require incident_id filter on `/api/corrective-actions` GET (or add implicit client filter)

### High Priority

3. Add FK constraint or validation for `corrective_actions.assignee_id`
4. Add existence validation for all FK references before INSERT
5. Add enum validation for status, priority, severity fields
6. Add UNIQUE constraint on `incidents.incident_number`

### Medium Priority

7. Add PATCH endpoints for root_cause_analysis and corrective_actions
8. Add why_level range validation (1-5)
9. Consider sequence-based incident_number generation
10. Add soft delete pattern (deleted_at column)

### Low Priority

11. Validate sortBy against allowed columns
12. Add indexes on FK columns for query performance
13. Document all enum values in schema

---

## Verification Checklist

- [x] incidents table audited (FKs, enums, array/JSON fields)
- [x] interviews table audited (incident_id FK)
- [x] interview_witnesses audited (interview_id FK)
- [x] root_cause_analysis audited
- [x] corrective_actions audited (including assignee_id gap)
- [x] All 14 child table dependencies documented
- [x] Client isolation gaps identified
- [x] Cascade risks documented

---

## Files Created

1. `.planning/phases/03-database-integrity/audit-notes/task1-incidents.md`
2. `.planning/phases/03-database-integrity/audit-notes/task2-interviews-witnesses.md`
3. `.planning/phases/03-database-integrity/audit-notes/task3-root-cause-corrective-actions.md`
4. `.planning/phases/03-database-integrity/03-02-SUMMARY.md` (this file)

---

## Next Steps

- **Plan 03-03**: Forms and documents tables audit
- **Plan 03-04**: Supporting tables and relationships audit
- **Phase 10**: Implement security fixes for client isolation gaps identified
