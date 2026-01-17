# Task 1: admin_users and user_client_roles Tables Audit

## Date: 2026-01-17

---

## 1. admin_users Table

### Schema (Inferred from Code)
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID/Integer | PRIMARY KEY |
| name | VARCHAR | NOT NULL (validated in POST) |
| email | VARCHAR | NOT NULL, UNIQUE (case-insensitive) |
| role | VARCHAR | Legacy field, no enum constraint |
| system_role | VARCHAR | Valid: 'global_admin', 'standard' |
| password_hash | VARCHAR | NULL allowed (OAuth users) |
| avatar_url | VARCHAR | NULL allowed |
| created_at | TIMESTAMP | DEFAULT NOW() |

### Constraints Verified

1. **Primary Key**: `id` - Verified (used in WHERE clauses)
2. **Email Uniqueness**:
   - **VERIFIED**: Case-insensitive lookup with `LOWER(email) = LOWER(${token.email})`
   - Used consistently in:
     - `auth.js` (line 38)
     - `auth/token/route.js` (line 51)
     - `auth/login/route.js` (line 26)
     - `auth/validate-temporary-access/route.js` (line 46)
   - **Note**: INSERT does not use LOWER(), relies on database UNIQUE constraint

3. **NOT NULL Validation**:
   - `email` and `name` validated in POST handler (line 25-27 of admin-users/route.js)
   - No database-level constraint verification possible without schema

4. **system_role Validation**:
   - **PARTIAL**: Code normalizes to 'global_admin' or 'standard' (PUT handler line 32-33)
   - No explicit enum constraint at database level
   - Fallback logic exists for legacy 'role' field

### Missing/Potential Issues

1. **No UNIQUE constraint verification at INSERT**: The POST handler does not check for duplicate emails before INSERT. Relies on database constraint (which may or may not exist).

2. **No password_hash validation on login**: The password_hash column is queried but not validated as NOT NULL at schema level.

3. **No CHECK constraint on system_role**: Values are normalized in code but database could contain invalid values.

---

## 2. user_client_roles Table

### Schema (Inferred from Code)
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID/Integer | PRIMARY KEY |
| user_id | UUID/Integer | FK -> admin_users(id) |
| client_id | UUID/Integer | FK -> clients(id) |
| company_role | VARCHAR | Role within client |
| assigned_by | UUID/Integer | FK -> admin_users(id), NULL allowed |
| created_at | TIMESTAMP | DEFAULT NOW() |

### Constraints Verified

1. **Composite Unique Key**: `(user_id, client_id)`
   - **VERIFIED**: `ON CONFLICT (user_id, client_id)` in POST handler (line 43-44 of client-roles/route.js)
   - Upsert pattern used for role assignment

2. **Foreign Keys**:
   - `user_id -> admin_users(id)`: Used in JOINs, assumed to exist
   - `client_id -> clients(id)`: Used in JOINs (line 18 of client-roles/route.js)
   - `assigned_by -> admin_users(id)`: References current user (line 42)
   - **NOT VERIFIED AT DATABASE LEVEL** - no migration files to confirm

### Query Patterns

1. **GET client-roles (line 11-21)**:
   ```sql
   SELECT ucr.id, ucr.client_id, ucr.company_role, c.name as client_name
   FROM user_client_roles ucr
   JOIN clients c ON ucr.client_id = c.id
   WHERE ucr.user_id = ${id}
   ```
   - **INNER JOIN**: Will exclude roles for deleted clients
   - **No N+1 risk**: Single query for all roles

2. **auth.js client_ids fetch (line 64-68)**:
   ```sql
   SELECT client_id, company_role
   FROM user_client_roles
   WHERE user_id = ${dbUser.id}
   ```
   - **Efficient**: Single query, no JOINs needed
   - **Separate from user query**: Could be combined but acceptable

---

## 3. Cascade/Orphan Risks

### On admin_users DELETE

**Location**: `/api/admin-users/[id]/route.js` (line 53)
```javascript
await sql`DELETE FROM admin_users WHERE id = ${id}`;
```

**CRITICAL RISKS**:
1. **user_client_roles ORPHAN**: If no ON DELETE CASCADE, orphaned rows remain
2. **assigned_by references BROKEN**: Other user_client_roles.assigned_by will point to deleted user
3. **No pre-delete check**: Does not verify if user has dependent data

### On clients DELETE (affects user_client_roles)

**Indirect Risk**: When a client is deleted, user_client_roles for that client become orphans unless:
- ON DELETE CASCADE exists on client_id FK
- Or manual cleanup is performed

---

## 4. Recommendations for Phase 10

### High Priority
1. **Add ON DELETE CASCADE** to `user_client_roles.user_id` FK
2. **Add ON DELETE CASCADE** to `user_client_roles.client_id` FK
3. **Add CHECK constraint** on `admin_users.system_role` for enum values

### Medium Priority
4. **Add SET NULL on DELETE** to `user_client_roles.assigned_by` (preserve audit trail)
5. **Add unique index** on `LOWER(admin_users.email)` if not exists
6. **Verify NOT NULL constraints** exist on `email`, `name` columns

### Low Priority
7. Consider combining user fetch and client_roles fetch in auth.js (minor optimization)
8. Add index on `user_client_roles.user_id` for faster auth lookups

---

## Summary

| Aspect | Status | Notes |
|--------|--------|-------|
| admin_users PK | VERIFIED | Used in queries |
| admin_users email uniqueness | VERIFIED | Case-insensitive lookup used |
| admin_users NOT NULL validation | PARTIAL | App validates, DB unknown |
| user_client_roles composite key | VERIFIED | ON CONFLICT clause confirms |
| user_client_roles FKs | ASSUMED | No migration files to verify |
| DELETE cascade behavior | UNKNOWN | Risk of orphaned records |
| N+1 query patterns | NONE FOUND | Queries are efficient |
