# Audit Summary: 04-02 Role Assignment Flow

## Overview

**Audit Date**: 2026-01-17
**Plan**: 04-02-PLAN.md
**Status**: COMPLETE
**Scope**: Role assignment from admin to user to client mapping

---

## Task 1: Client-Roles API Audit

**File**: `apps/web/src/app/api/admin-users/[id]/client-roles/route.js`

### Findings

#### GET Endpoint (Lines 4-24)
- **Authorization**: CORRECT - Uses `requireRole(request, ["global_admin"])`
- **Query**: Returns user's client roles with client names via JOIN
- **Data returned**: `id`, `client_id`, `company_role`, `client_name`

#### POST Endpoint (Lines 26-52)
- **Authorization**: CORRECT - Requires `global_admin`
- **assigned_by**: CORRECT - Uses `user.id` from JWT (line 42), NOT from headers
- **Upsert pattern**: CORRECT - Uses `ON CONFLICT (user_id, client_id) DO UPDATE`
- **Validation**: Basic validation for `client_id` and `company_role` presence
- **SQL**:
  ```sql
  INSERT INTO user_client_roles (user_id, client_id, company_role, assigned_by)
  VALUES (${id}, ${client_id}, ${company_role}, ${user.id})
  ON CONFLICT (user_id, client_id)
  DO UPDATE SET company_role = EXCLUDED.company_role
  ```

#### DELETE Endpoint (Lines 54-77)
- **Authorization**: CORRECT - Requires `global_admin`
- **Design note**: Uses query param `role_id` for deletion (documented in code comments)
- **SQL**: Correctly scopes delete to both `role_id` AND `user_id` (prevents cross-user deletion)

### Task 1 Checklist Results

| Check | Status | Notes |
|-------|--------|-------|
| POST assigns user to client with company_role | VERIFIED | Line 41-42 |
| Upsert pattern (ON CONFLICT DO UPDATE) | VERIFIED | Line 43-44 |
| DELETE removes role correctly | VERIFIED | Lines 71-74, scoped by role_id AND user_id |
| global_admin requirement enforced | VERIFIED | All three endpoints |
| assigned_by from JWT (not headers) | VERIFIED | Line 42 uses `user.id` from requireRole |

---

## Task 2: Role Assignment UI Audit

**File**: `apps/web/src/app/settings/users/page.jsx`

### UserManagementPage Component (Lines 436-442)
- **Access control**: CORRECT - Wrapped in `<RoleGuard roles={["global_admin"]}>`
- Only global_admin users can access user management

### UserManagementContent Component (Lines 16-276)
- Fetches users from `/api/admin-users`
- Supports create/edit/delete users
- System role selection: `standard` or `global_admin`

### ClientRolesManager Component (Lines 279-433)
**Location**: Embedded in edit modal for existing users only (line 267-270)

#### User Experience Flow:
1. Admin clicks "Edit" on a user
2. Modal opens with user basic info form
3. Below the form, `ClientRolesManager` appears (only for existing users)
4. Admin can:
   - View current client access (list of client + role pairs)
   - Click "Grant Access" to add new client assignment
   - Select client from dropdown, select role (`user` or `admin`)
   - Click "Grant Access" button to submit
   - Click trash icon to revoke access (with confirmation)

#### API Integration:
- **Fetch roles**: `GET /api/admin-users/${userId}/client-roles`
- **Add role**: `POST /api/admin-users/${userId}/client-roles` with `{client_id, company_role}`
- **Remove role**: `DELETE /api/admin-users/${userId}/client-roles?role_id=${roleId}`

#### Role Options (Lines 379-385):
```jsx
<option value="user">User (Standard)</option>
<option value="admin">Admin (Client Manager)</option>
```

### Task 2 Checklist Results

| Check | Status | Notes |
|-------|--------|-------|
| ClientRolesManager component behavior | VERIFIED | Proper CRUD operations |
| Role assignment workflow | VERIFIED | Intuitive UI flow |
| RoleGuard protection | VERIFIED | Page wrapped in global_admin guard |

---

## Task 3: company_role Usage Documentation

### company_role Values

| Value | UI Label | Intended Purpose |
|-------|----------|------------------|
| `user` | User (Standard) | Basic client access |
| `admin` | Admin (Client Manager) | Elevated client access |

### Enforcement Analysis

#### Where company_role is STORED:
1. `user_client_roles.company_role` column in database
2. Written via POST endpoint in client-roles route (line 41)
3. Returned via GET endpoint (line 15)

#### Where company_role is FETCHED:
1. `apps/web/src/app/api/utils/auth.js` (line 65)
   ```sql
   SELECT client_id, company_role FROM user_client_roles WHERE user_id = ${dbUser.id}
   ```
2. Attached to user object as `user.client_roles` (line 70)

#### Where company_role is ENFORCED:
**FINDING: NOWHERE**

After comprehensive codebase search:
- `company_role` is stored and displayed but **never checked for authorization**
- No code path distinguishes between `company_role = 'user'` and `company_role = 'admin'`
- The auth middleware fetches `client_roles` but only uses `client_ids` for client membership

**This is a GAP**: The distinction between client "user" and client "admin" roles exists in the UI and database but provides no functional difference in permissions.

### assigned_by Cascade Risk

**Current State**:
- `assigned_by` column stores the ID of the admin who granted the role
- If that admin user is deleted, `assigned_by` becomes a dangling reference

**Risk Assessment**:
- **Severity**: LOW (audit trail only, not used for authorization)
- **Impact**: Loss of audit trail for who granted the role
- **Mitigation**: Add `ON DELETE SET NULL` to preserve the role while clearing the reference

**Recommendation for Phase 10**:
1. Add migration: `ALTER TABLE user_client_roles ALTER COLUMN assigned_by SET DEFAULT NULL ON DELETE SET NULL`
2. Or implement soft delete for admin_users to preserve audit trail

---

## Summary of Findings

### What Works Well

1. **Authorization**: All client-roles API endpoints properly require `global_admin`
2. **JWT Integration**: `assigned_by` correctly uses authenticated user ID from JWT
3. **Upsert Pattern**: Prevents duplicate role assignments with ON CONFLICT
4. **UI Protection**: User management page properly guarded by RoleGuard
5. **DELETE Scoping**: Deletion scoped by both role_id AND user_id (prevents IDOR)

### Issues Identified

| Issue | Severity | Description |
|-------|----------|-------------|
| company_role NOT ENFORCED | MEDIUM | Stored but never checked for permissions |
| assigned_by cascade risk | LOW | Dangling reference if admin deleted |
| No client-scoped admin features | MEDIUM | "Admin" role has no additional capabilities |

### Recommendations for Phase 10

1. **Define company_role permissions**: What should client "admin" be able to do that client "user" cannot?
   - Manage employees for the client?
   - View sensitive data?
   - Create incidents?

2. **Implement company_role checking**: Add middleware or helper function:
   ```javascript
   function requireClientRole(user, clientId, requiredRole) {
     const role = user.client_roles.find(r => r.client_id === clientId);
     if (!role) return false;
     if (requiredRole === 'admin' && role.company_role !== 'admin') return false;
     return true;
   }
   ```

3. **Add assigned_by FK constraint**:
   ```sql
   ALTER TABLE user_client_roles
   ADD CONSTRAINT fk_assigned_by
   FOREIGN KEY (assigned_by) REFERENCES admin_users(id)
   ON DELETE SET NULL;
   ```

4. **Consider client_roles hierarchy**: Should global_admin automatically have client admin access to all clients?

---

## Files Audited

| File | Lines | Status |
|------|-------|--------|
| `apps/web/src/app/api/admin-users/[id]/client-roles/route.js` | 78 | AUDITED |
| `apps/web/src/app/settings/users/page.jsx` | 443 | AUDITED |
| `apps/web/src/components/RoleGuard.jsx` | 61 | AUDITED |
| `apps/web/src/app/api/utils/auth.js` | 96 | AUDITED |

---

## Verification Checklist

- [x] Client-roles API verified working (GET/POST/DELETE)
- [x] Role assignment flow documented
- [x] company_role enforcement gap documented
- [x] assigned_by audit trail risk documented
- [x] SUMMARY.md created with findings
