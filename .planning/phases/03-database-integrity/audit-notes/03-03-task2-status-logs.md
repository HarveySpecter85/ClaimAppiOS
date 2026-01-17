# Task 2: Status Logs Tables Audit (Parent-Child)

**Date:** 2026-01-17
**Tables Audited:** status_logs, status_log_entries

## Summary

status_logs and status_log_entries form a parent-child relationship for tracking weekly employee status reports. The parent table (status_logs) has FKs to both incidents and employees, while the child table (status_log_entries) has an FK to status_logs.

---

## 1. status_logs (Parent Table)

### API Routes
- `apps/web/src/app/api/status-logs/route.js` (GET, POST)
- `apps/web/src/app/api/status-logs/[id]/route.js` (GET, PUT, DELETE)

### Fields Observed
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | UUID | PK | Auto-generated |
| incident_id | UUID | FK | FK to incidents |
| employee_id | UUID | FK | FK to employees |
| week_ending | DATE | NO | Week ending date |
| employer | TEXT | NO | Employer name |
| status | TEXT | NO | Default: "draft" |
| submitted_at | TIMESTAMP | NO | Set when status="submitted" |
| created_at | TIMESTAMP | AUTO | Timestamp |
| updated_at | TIMESTAMP | AUTO | Timestamp |

### Foreign Key Verification

1. **incident_id FK**
   - Used in INSERT: `${body.incident_id}`
   - NOT validated as required in POST
   - Filtered by in GET: supports `?incident_id=` query param

2. **employee_id FK**
   - Used in INSERT: `${body.employee_id}`
   - NOT validated as required in POST
   - Filtered by in GET: supports `?employee_id=` query param

### JOIN Behavior
- GET queries include JOINs to fetch related data:
  - `LEFT JOIN employees e ON sl.employee_id = e.id` - gets employee_name
  - `LEFT JOIN incidents i ON sl.incident_id = i.id` - gets incident_date

### Status Handling
- POST: Defaults to "draft" if not provided
- PUT: When status changes to "submitted", also sets `submitted_at = NOW()`
- No enum validation - accepts any string value

### Findings
- CONCERN: Neither incident_id nor employee_id validated as required
- GOOD: JOINs to related tables for context in GET responses
- GOOD: submitted_at timestamp tracked when status becomes "submitted"
- CONCERN: No status enum validation
- CONCERN: DELETE does not cascade to status_log_entries (orphan risk)

---

## 2. status_log_entries (Child Table)

### API Routes
- `apps/web/src/app/api/status-log-entries/route.js` (GET, POST)
- `apps/web/src/app/api/status-log-entries/[id]/route.js` (GET, PUT, DELETE)

### Fields Observed
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | UUID | PK | Auto-generated |
| status_log_id | UUID | FK | FK to status_logs |
| entry_date | DATE | NO | Date of entry |
| content_with_modified_duty | TEXT | NO | Modified duty content |
| pain_scale | INTEGER | NO | Pain level (1-10?) |
| notes | TEXT | NO | Additional notes |
| hours_worked | DECIMAL | NO | Hours worked |
| client_rep_initials | TEXT | NO | Client rep verification |
| employee_initials | TEXT | NO | Employee verification |
| status | TEXT | NO | Default: "pending" |
| created_at | TIMESTAMP | AUTO | Timestamp |
| updated_at | TIMESTAMP | AUTO | Timestamp |

### Foreign Key Verification

1. **status_log_id FK**
   - Used in INSERT: `${body.status_log_id}`
   - NOT validated as required in POST
   - Filtered by in GET: supports `?status_log_id=` query param
   - Filtered by in GET: supports `?entry_date=` query param

### Insertion Pattern
- **Single record insertion**: Each entry created individually via POST
- **NOT batch insertion**: No array handling in POST
- Pattern: Client creates entries one at a time or front-end handles batching

### Status Handling
- POST: Defaults to "pending" if not provided (note: different default than parent)
- PUT: No enum validation - accepts any string value

### Findings
- CONCERN: status_log_id not validated as required in POST
- CONCERN: No status enum validation
- CONCERN: pain_scale has no range validation (should be 1-10?)
- GOOD: Supports filtering by entry_date
- NOTE: entries ordered by entry_date ASC in GET

---

## Parent-Child Relationship Analysis

### Relationship Structure
```
status_logs (parent)
    |
    +---> status_log_entries (child, via status_log_id FK)
```

### Data Flow
1. Create status_log with incident_id and employee_id
2. Create individual status_log_entries with status_log_id

### Query Pattern
- Entries fetched separately via `?status_log_id=` query param
- No nested response (entries not included in status_log GET by default)

### Cascade Behavior
- **DELETE on status_logs**: Does NOT cascade to entries
- **Risk**: Deleting a status_log leaves orphaned entries
- **Recommendation**: Add ON DELETE CASCADE at database level or handle in API

### N+1 Query Risk
- To get a complete status log with entries requires 2 queries:
  1. GET /api/status-logs/{id}
  2. GET /api/status-log-entries?status_log_id={id}
- Consider adding nested fetch endpoint for efficiency

---

## Cross-Table Findings

### Common Issues

1. **FK Validation Missing**
   - status_logs: Neither incident_id nor employee_id validated
   - status_log_entries: status_log_id not validated

2. **Cascade Delete Not Implemented**
   - Deleting parent (status_logs) does not clean up children
   - Risk of orphaned status_log_entries records

3. **Status Enum Inconsistency**
   - status_logs defaults to "draft"
   - status_log_entries defaults to "pending"
   - No enum validation on either table

### Recommendations

1. Add required validation for:
   - status_logs: incident_id, employee_id
   - status_log_entries: status_log_id, entry_date

2. Implement cascade delete or transaction-based cleanup

3. Add pain_scale range validation (1-10)

4. Consider adding endpoint to fetch status_log with entries in single query:
   ```
   GET /api/status-logs/{id}?include=entries
   ```

5. Standardize status defaults across tables

---

*Audit completed: 2026-01-17*
