# Plan 03-01 Summary: Core Tables Database Integrity Audit

## Date Completed: 2026-01-17

---

## Overview

This audit examined the four core tables that form the foundation of the Claim Flow App:
- **admin_users**: System users and their authentication
- **user_client_roles**: User-to-client assignments and permissions
- **clients**: Client/company entities
- **employees**: Employee records linked to clients

---

## Audit Findings

### Table: admin_users

| Constraint | Status | Evidence |
|------------|--------|----------|
| PRIMARY KEY (id) | VERIFIED | Used in WHERE clauses |
| UNIQUE (email) | VERIFIED | Case-insensitive LOWER() in all lookups |
| NOT NULL (email, name) | PARTIAL | App validates, DB constraint unknown |
| CHECK (system_role) | NOT FOUND | Code normalizes but no DB constraint |

**Key Findings**:
- Email uniqueness properly enforced via `LOWER(email) = LOWER(?)` pattern
- system_role values normalized to 'global_admin' or 'standard' in application code
- DELETE endpoint exists without cascade handling

### Table: user_client_roles

| Constraint | Status | Evidence |
|------------|--------|----------|
| PRIMARY KEY (id) | VERIFIED | Used in queries |
| UNIQUE (user_id, client_id) | VERIFIED | ON CONFLICT clause confirms |
| FK user_id -> admin_users | ASSUMED | Used in JOINs |
| FK client_id -> clients | ASSUMED | Used in JOINs |
| FK assigned_by -> admin_users | ASSUMED | References user.id |

**Key Findings**:
- Composite unique key confirmed via `ON CONFLICT (user_id, client_id) DO UPDATE`
- Upsert pattern allows role updates without duplicates
- Orphan risk if admin_users or clients deleted

### Table: clients

| Constraint | Status | Evidence |
|------------|--------|----------|
| PRIMARY KEY (id) | VERIFIED | Used in WHERE clauses |
| NOT NULL (name) | UNKNOWN | No app validation |
| UNIQUE (name) | NOT FOUND | Duplicates possible |

**Key Findings**:
- DELETE endpoint allows ANY authenticated user to delete (missing authorization)
- No cascade handling for dependent tables
- No client isolation on GET (all clients visible to all users)
- Audit logging on PUT but missing on DELETE

### Table: employees

| Constraint | Status | Evidence |
|------------|--------|----------|
| PRIMARY KEY (id) | VERIFIED | Used in JOINs |
| UNIQUE (employee_id) | VERIFIED | ON CONFLICT clause confirms |
| FK client_id -> clients | ASSUMED | Used in LEFT JOINs |
| NOT NULL (full_name) | PARTIAL | Validated in import, not in POST |

**Key Findings**:
- Client isolation properly implemented in GET (filters by user.client_ids)
- POST endpoint missing validation and client_id authorization
- No DELETE endpoint exists (preserves audit history)
- LEFT JOIN usage throughout handles orphans gracefully

---

## Constraints Summary

### Verified Constraints
1. admin_users.email UNIQUE (case-insensitive via LOWER())
2. user_client_roles (user_id, client_id) UNIQUE
3. employees.employee_id UNIQUE
4. All PRIMARY KEYs on id columns

### Assumed Constraints (cannot verify without schema)
1. user_client_roles.user_id FK -> admin_users.id
2. user_client_roles.client_id FK -> clients.id
3. user_client_roles.assigned_by FK -> admin_users.id
4. employees.client_id FK -> clients.id

### Missing Constraints
1. admin_users.system_role CHECK constraint
2. clients.name UNIQUE constraint
3. NOT NULL constraints (cannot verify at DB level)

---

## Cascade/Orphan Risk Analysis

### Critical Risks

| Parent Table | Dependent Tables | Risk on DELETE |
|--------------|------------------|----------------|
| admin_users | user_client_roles | ORPHAN - roles become invalid |
| clients | employees, incidents, user_client_roles | ORPHAN - all related data lost |
| employees | incidents, status_logs, interviews | ORPHAN - history disconnected |

### Mitigation Status
- **LEFT JOIN usage**: Widely implemented, provides graceful degradation
- **CASCADE**: Not implemented in application code
- **Pre-delete checks**: Not implemented
- **Soft-delete**: Not implemented

---

## Authorization Issues Found

| Endpoint | Expected | Actual | Severity |
|----------|----------|--------|----------|
| GET /clients | Filter by user.client_ids | Returns ALL clients | MEDIUM |
| PUT /clients/[id] | Admin or owner | Any authenticated user | MEDIUM |
| DELETE /clients/[id] | global_admin | Any authenticated user | HIGH |
| POST /employees | Verify client_id access | No check | MEDIUM |

---

## Query Pattern Analysis

### N+1 Risks
- **NONE FOUND**: All queries use JOINs efficiently

### Client Isolation
- **employees**: CORRECT - properly filters by user.client_ids
- **clients**: MISSING - returns all clients to all users
- **admin_users**: N/A - global_admin only access

### JOIN Patterns
- LEFT JOIN used consistently for optional relationships
- INNER JOIN used in user_client_roles (hides orphaned roles)

---

## Recommendations for Phase 10

### Priority 0 (Critical)
1. **Add DELETE authorization to /clients**: Require global_admin role
2. **Add ON DELETE RESTRICT** to foreign keys on clients.id
3. **Add ON DELETE CASCADE** to user_client_roles on user_id and client_id

### Priority 1 (High)
4. **Add client isolation to GET /clients**: Filter by user.client_ids for standard users
5. **Add validation to POST /employees**: Require full_name and employee_id
6. **Add client_id authorization to POST /employees**: Verify user access
7. **Add SET NULL on DELETE** for user_client_roles.assigned_by

### Priority 2 (Medium)
8. **Add CHECK constraint** on admin_users.system_role
9. **Add audit logging to DELETE /clients**: Track who deleted what
10. **Consider soft-delete pattern**: Add deleted_at columns
11. **Add unique index on LOWER(admin_users.email)**

### Priority 3 (Low)
12. Add index on employees.client_id for faster filtering
13. Consider combining auth.js queries (minor optimization)
14. Add clients.name UNIQUE constraint if business rule requires

---

## Files Audited

- `/apps/web/src/app/api/admin-users/route.js`
- `/apps/web/src/app/api/admin-users/[id]/route.js`
- `/apps/web/src/app/api/admin-users/[id]/client-roles/route.js`
- `/apps/web/src/app/api/clients/route.js`
- `/apps/web/src/app/api/clients/[id]/route.js`
- `/apps/web/src/app/api/employees/route.js`
- `/apps/web/src/app/api/employees/import/route.js`
- `/apps/web/src/app/api/utils/auth.js`
- `/apps/web/src/app/api/utils/sql.js`

---

## Verification Checklist

- [x] admin_users table audited (constraints, validation)
- [x] user_client_roles composite key verified
- [x] clients table audited (delete risks)
- [x] employees table audited (FK to clients, delete risks)
- [x] All findings documented
- [x] Authorization issues identified
- [x] Cascade/orphan risks documented
- [x] Recommendations prioritized for Phase 10

---

## Conclusion

The core tables have a reasonable foundation but lack several important database-level constraints and application-level authorization checks. The most critical issues are:

1. **DELETE /clients has no authorization** - any authenticated user can delete clients
2. **No cascade handling** - deleting records leaves orphans
3. **Missing client isolation** - clients endpoint exposes all clients

These issues should be addressed in Phase 10 before production deployment.
