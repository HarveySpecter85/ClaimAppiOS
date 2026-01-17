# Task 3: employees Table Audit

## Date: 2026-01-17

---

## 1. employees Table

### Schema (Inferred from Code)
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID/Integer | PRIMARY KEY |
| full_name | VARCHAR | NOT NULL (validated in import) |
| employee_id | VARCHAR | UNIQUE (verified via ON CONFLICT) |
| job_position | VARCHAR | NULL allowed |
| employment_start_date | DATE | NULL allowed |
| phone | VARCHAR | NULL allowed |
| email | VARCHAR | NULL allowed |
| client_id | UUID/Integer | FK -> clients(id), NULL allowed |
| position_name | VARCHAR | NULL allowed |
| pay_rate | DECIMAL | NULL allowed |
| role_description | TEXT | NULL allowed |
| hire_date | DATE | NULL allowed |
| created_at | TIMESTAMP | DEFAULT NOW() |
| updated_at | TIMESTAMP | DEFAULT NOW() |

### Constraints Verified

1. **Primary Key**: `id` - Verified (used in JOINs)

2. **Unique Constraint on employee_id**:
   - **VERIFIED** via `ON CONFLICT (employee_id) DO UPDATE` in import route (line 84)
   - Allows upsert pattern for bulk imports

3. **Foreign Key: client_id -> clients(id)**:
   - **ASSUMED** - used in LEFT JOINs but no migration files to confirm
   - NULL values explicitly allowed (`${body.client_id || null}`)

4. **NOT NULL Constraints**:
   - `full_name`: Validated in import route (line 53) but NOT in main POST route
   - `employee_id`: Validated in import route but NOT in main POST route
   - **INCONSISTENT VALIDATION** between routes

### Missing/Potential Issues

1. **No validation in POST /employees**: Unlike import, main POST does not validate required fields
2. **client_id can be NULL**: Employees can exist without client association
3. **No DELETE endpoint exists**: Cannot delete employees via API (may be intentional)

---

## 2. Query Patterns

### GET /employees (route.js lines 5-62)

```sql
SELECT e.*, c.name as client_name
FROM employees e
LEFT JOIN clients c ON e.client_id = c.id
WHERE 1=1
```

**Analysis**:
- **LEFT JOIN**: Correctly handles employees without client (returns `client_name: null`)
- **Client isolation implemented**: Lines 21-28 filter by `user.client_ids` for non-global_admin
- **Dynamic query building**: Parameterized queries prevent SQL injection
- **Search limit**: `LIMIT 10` applied when search param present (line 57-58)

### Client Access Control (lines 20-28)

```javascript
if (user.system_role !== "global_admin") {
  if (user.client_ids.length === 0) {
    return Response.json([]);
  }
  query += ` AND e.client_id = ANY($${paramCount})`;
  params.push(user.client_ids);
}
```

**Positive Finding**: This is proper client isolation - standard users only see employees for their assigned clients.

### POST /employees (route.js lines 64-115)

- No field validation (full_name, employee_id could be null/undefined)
- No authorization beyond basic auth
- No client_id validation against user.client_ids
- Audit logging present (lines 106-112)

### POST /employees/import (import/route.js)

- Requires `global_admin` or `plant_supervisor` role (line 6-9)
- Validates `full_name` and `employee_id` (line 53-54)
- Uses UPSERT pattern with `ON CONFLICT (employee_id)`
- Infers client_id from user's roles if not provided (lines 22-31)
- Audit logging present (lines 114-120)

---

## 3. Foreign Key References to employees

Tables that reference `employees.id` via `employee_id` column:

| Table | Column | JOIN Type | Orphan Risk |
|-------|--------|-----------|-------------|
| incidents | employee_id | LEFT JOIN | LOW - graceful handling |
| status_logs | employee_id | LEFT JOIN | LOW - graceful handling |
| interviews | employee_id | LEFT JOIN | LOW - graceful handling |
| mileage_reimbursements | employee_id | INSERT only | MEDIUM - no JOIN verification |

### incidents table
- File: `/api/incidents/route.js` (line 22)
- File: `/api/incidents/[id]/route.js` (line 26)
- Uses LEFT JOIN throughout

### status_logs table
- File: `/api/status-logs/route.js` (line 18)
- File: `/api/status-logs/[id]/route.js` (line 15)
- Uses LEFT JOIN throughout

### interviews table
- File: `/api/interviews/[id]/route.js` (line 18)
- Uses LEFT JOIN

### mileage_reimbursements table
- File: `/api/mileage-reimbursements/route.js` (line 22)
- INSERT only, no verification that employee_id exists

---

## 4. Delete Behavior Analysis

### No DELETE Endpoint Exists

**Observation**: The employees API does not have a DELETE endpoint.

**Implications**:
1. Employees cannot be deleted via the application
2. This may be intentional to preserve audit history
3. If deleted directly in database, orphan risks exist in:
   - incidents
   - status_logs
   - interviews
   - mileage_reimbursements

### Recommended Approach
Consider soft-delete pattern with `deleted_at` column if employee removal is needed.

---

## 5. Data Integrity Risks

### On clients DELETE (cascades to employees)

If a client is deleted:
- Employees become orphaned (client_id points to non-existent client)
- LEFT JOIN handles gracefully (client_name becomes null)
- BUT: Data inconsistency occurs

### On direct employee DELETE (if done via SQL)

If an employee is deleted directly:
- incidents.employee_id becomes orphan
- status_logs.employee_id becomes orphan
- interviews.employee_id becomes orphan
- mileage_reimbursements.employee_id becomes orphan
- All handled by LEFT JOIN but lose employee context

---

## 6. Authorization Analysis

| Endpoint | Required Role | Actual Check | Issue |
|----------|---------------|--------------|-------|
| GET /employees | [] (any auth) | client_ids filter | CORRECT - good isolation |
| POST /employees | [] (any auth) | None | Should verify client_id access |
| POST /employees/import | global_admin, plant_supervisor | Yes | CORRECT |

### POST /employees Authorization Gap

**Issue**: POST does not verify user has access to the specified `client_id`.

A standard user could potentially:
1. Create an employee for ANY client, not just their assigned clients
2. Create an employee with NULL client_id

**Should add**:
```javascript
if (user.system_role !== "global_admin" && body.client_id) {
  if (!user.client_ids.includes(body.client_id)) {
    return new Response("Forbidden: No access to this client", { status: 403 });
  }
}
```

---

## 7. Recommendations for Phase 10

### Critical (P0)
1. **Add validation to POST /employees**: Require `full_name` and `employee_id`
2. **Add client_id authorization**: Verify user has access to target client

### High Priority (P1)
3. **Add ON DELETE RESTRICT** on FK referencing employees from incidents, status_logs, etc.
4. **Add ON DELETE SET NULL** or **CASCADE** on employees.client_id FK
5. **Consider soft-delete pattern**: Add `deleted_at` column

### Medium Priority (P2)
6. **Add employee_id FK validation** in mileage_reimbursements INSERT
7. **Add DELETE endpoint** with proper authorization and soft-delete
8. **Index optimization**: Add index on `employees.client_id` for faster filtering

---

## Summary

| Aspect | Status | Notes |
|--------|--------|-------|
| employees PK | VERIFIED | Used in JOINs |
| employee_id UNIQUE | VERIFIED | ON CONFLICT confirms |
| client_id FK | ASSUMED | No migration files |
| Client isolation | CORRECT | GET properly filters by client_ids |
| POST validation | MISSING | No required field validation |
| POST authorization | MISSING | No client_id access check |
| DELETE endpoint | NOT EXISTS | May be intentional |
| LEFT JOIN usage | CORRECT | Graceful orphan handling |
| Audit logging | PRESENT | On POST and import |
