# Task 2: clients Table Audit

## Date: 2026-01-17

---

## 1. clients Table

### Schema (Inferred from Code)
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID/Integer | PRIMARY KEY |
| name | VARCHAR | NOT NULL (implied by usage) |
| location | VARCHAR | NULL allowed |
| address | VARCHAR | NULL allowed |
| contact_name | VARCHAR | NULL allowed |
| contact_phone | VARCHAR | NULL allowed |
| contact_email | VARCHAR | NULL allowed |
| manager_name | VARCHAR | NULL allowed |
| manager_email | VARCHAR | NULL allowed |
| manager_phone | VARCHAR | NULL allowed |
| safety_coordinator_name | VARCHAR | NULL allowed |
| safety_coordinator_email | VARCHAR | NULL allowed |
| safety_coordinator_phone | VARCHAR | NULL allowed |
| logo_url | VARCHAR | NULL allowed |
| primary_color | VARCHAR | DEFAULT '#000000' |
| secondary_color | VARCHAR | DEFAULT '#ffffff' |
| created_at | TIMESTAMP | DEFAULT NOW() |
| updated_at | TIMESTAMP | DEFAULT NOW() |

### Constraints Verified

1. **Primary Key**: `id` - Verified (used in WHERE clauses)

2. **NOT NULL Constraints**:
   - `name`: Used directly in INSERT without null check
   - **No validation in POST handler** - relies on database constraint
   - All other fields explicitly allow NULL via `|| null` pattern

3. **Unique Constraints**:
   - **NONE FOUND** - Multiple clients can have same name

### Missing/Potential Issues

1. **No name validation**: POST handler does not validate `body.name` exists
2. **No unique constraint on name**: Potential for duplicate client names
3. **No authorization check on GET/PUT/DELETE**: Any authenticated user can access any client

---

## 2. Delete Behavior Analysis

### DELETE Endpoint
**Location**: `/api/clients/[id]/route.js` (line 73-79)
```javascript
export async function DELETE(request, { params }) {
  const { authorized, response, user } = await requireRole(request, []);
  if (!authorized) return response;
  const { id } = params;
  await sql`DELETE FROM clients WHERE id = ${id}`;
  return Response.json({ success: true });
}
```

### CRITICAL: Orphan Risks on Client Delete

The following tables have `client_id` foreign key references:

| Table | Reference | Risk Level | Impact |
|-------|-----------|------------|--------|
| employees | `client_id` | **HIGH** | Orphaned employees |
| incidents | `client_id` | **HIGH** | Orphaned incidents, broken history |
| user_client_roles | `client_id` | **MEDIUM** | Orphaned role assignments |

### Tables Using client_id

1. **employees** (verified via LEFT JOIN)
   - File: `/api/employees/route.js` (line 16)
   - Query: `LEFT JOIN clients c ON e.client_id = c.id`
   - Uses LEFT JOIN, so orphaned employees would show `client_name: null`

2. **incidents** (verified via LEFT JOIN)
   - File: `/api/incidents/route.js` (line 23)
   - File: `/api/incidents/[id]/route.js` (line 27)
   - File: `/api/incidents/[id]/dossier/route.js` (line 26)
   - File: `/api/dashboard/stats/route.js` (line 36)
   - Uses LEFT JOIN throughout, orphaned incidents would lose client context

3. **user_client_roles** (verified via INNER JOIN)
   - File: `/api/admin-users/[id]/client-roles/route.js` (line 18)
   - Query: `JOIN clients c ON ucr.client_id = c.id`
   - **DANGER**: Uses INNER JOIN - orphaned roles would disappear from query results
   - Users would lose access to client-specific permissions silently

---

## 3. Query Patterns

### GET All Clients
```sql
SELECT * FROM clients ORDER BY name
```
- **No client isolation**: Returns ALL clients to any authenticated user
- **SECURITY CONCERN**: Standard users should only see clients they have roles in

### GET Single Client
```sql
SELECT * FROM clients WHERE id = ${id}
```
- **No authorization check**: Any authenticated user can view any client
- **SECURITY CONCERN**: Should verify user has role for this client

### PUT Update Client
```sql
UPDATE clients SET ... WHERE id = ${id}
```
- **No authorization check**: Any authenticated user can update any client
- **SECURITY CONCERN**: Should require admin role or client-specific permission
- **POSITIVE**: Has audit logging via `logAudit()`

### DELETE Client
```sql
DELETE FROM clients WHERE id = ${id}
```
- **No authorization check**: Any authenticated user can delete any client
- **CRITICAL**: Should require global_admin role
- **NO CASCADE HANDLING**: Dependent records not cleaned up
- **NO PRE-DELETE CHECK**: Does not verify client has no dependent data

---

## 4. Authorization Issues

| Endpoint | Required Role | Actual Role | Issue |
|----------|---------------|-------------|-------|
| GET /clients | [] (any auth) | [] | Should filter by user.client_ids |
| GET /clients/[id] | [] (any auth) | [] | Should verify user has access |
| POST /clients | global_admin | global_admin | CORRECT |
| PUT /clients/[id] | [] (any auth) | [] | Should require admin or owner |
| DELETE /clients/[id] | [] (any auth) | [] | Should require global_admin |

---

## 5. Recommendations for Phase 10

### Critical (P0)
1. **Add ON DELETE RESTRICT** to all foreign keys referencing clients(id)
   - Prevents accidental deletion with dependent data
   - Or implement soft-delete pattern

2. **Require global_admin for DELETE**: Change line 74 to:
   ```javascript
   const { authorized, response } = await requireRole(request, ["global_admin"]);
   ```

### High Priority (P1)
3. **Add client isolation to GET /clients**: Filter by `user.client_ids` for standard users
4. **Add authorization check to GET /clients/[id]**: Verify user has access to this client
5. **Add authorization check to PUT /clients/[id]**: Require appropriate permissions

### Medium Priority (P2)
6. **Add name validation**: Validate `body.name` exists and is non-empty in POST
7. **Add audit logging to DELETE**: Log who deleted which client
8. **Consider soft-delete**: Add `deleted_at` column instead of hard delete

---

## Summary

| Aspect | Status | Notes |
|--------|--------|-------|
| clients PK | VERIFIED | Used in queries |
| name NOT NULL | UNKNOWN | No app validation, relies on DB |
| Unique constraints | NONE | Multiple clients can share name |
| DELETE cascade | NOT HANDLED | Will orphan employees, incidents, roles |
| Client isolation | MISSING | All clients visible to all users |
| DELETE authorization | MISSING | Any auth user can delete |
| PUT authorization | MISSING | Any auth user can update |
| Audit logging | PARTIAL | Only on PUT, not DELETE |
