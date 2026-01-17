# Phase 4 Summary: User Onboarding Workflow

## Phase Overview

**Phase**: 04-user-onboarding-workflow
**Date**: 2026-01-17
**Status**: COMPLETE
**Plans**: 4/4 completed

---

## Complete User Onboarding Flow

### Current Workflow (End-to-End)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     USER ONBOARDING WORKFLOW                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. ADMIN CREATES USER                                                   │
│     ├── Endpoint: POST /api/admin-users                                  │
│     ├── Requires: global_admin role [VERIFIED]                           │
│     ├── Creates: User record WITHOUT password [GAP]                      │
│     └── Status: User cannot log in normally                              │
│                                                                          │
│                           ▼                                              │
│                                                                          │
│  2. ADMIN ASSIGNS CLIENT ROLES                                           │
│     ├── Endpoint: POST /api/admin-users/[id]/client-roles                │
│     ├── Requires: global_admin role [VERIFIED]                           │
│     ├── Creates: user_client_roles record with company_role              │
│     └── Gap: company_role NOT ENFORCED anywhere [GAP]                    │
│                                                                          │
│                           ▼                                              │
│                                                                          │
│  3. ADMIN GENERATES TEMPORARY ACCESS                                     │
│     ├── Endpoint: POST /api/auth/temporary-access                        │
│     ├── Creates: Secure token (SHA-256 hashed, 5-min expiry)             │
│     ├── One-time use enforced [VERIFIED]                                 │
│     └── Workaround: No permanent password set [GAP]                      │
│                                                                          │
│                           ▼                                              │
│                                                                          │
│  4. USER VALIDATES TEMPORARY ACCESS                                      │
│     ├── Endpoint: POST /api/auth/validate-temporary-access               │
│     ├── Creates: JWT session (30-day expiry)                             │
│     ├── Sets secure cookies [VERIFIED]                                   │
│     └── User can now access the application                              │
│                                                                          │
│                           ▼                                              │
│                                                                          │
│  5. USER ACCESSES CLIENT DATA                                            │
│     ├── requireRole() populates user.client_ids [VERIFIED]               │
│     ├── Global_admin bypasses client filter [VERIFIED]                   │
│     ├── GET /api/incidents filters correctly [VERIFIED]                  │
│     └── 17 OTHER ENDPOINTS MISSING CLIENT CHECKS [CRITICAL GAP]          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Consolidated Findings

### Plan 04-01: User Creation and Password Flow

| Area | Status | Finding |
|------|--------|---------|
| Global admin requirement | PASS | All user management endpoints require global_admin |
| Field validation | PASS | Name and email required, role defaults in place |
| User creation without password | GAP | Users cannot log in via normal flow |
| Email uniqueness | PARTIAL | Relies on DB constraint, no explicit check |
| Password initialization | GAP | No endpoint exists for initial password setup |
| Temporary access token generation | PASS | Cryptographically secure (32-byte random, SHA-256) |
| Token expiry | PASS | 5-minute default, properly enforced |
| Session creation | PASS | JWT with 30-day expiry, secure cookies |
| One-time token use | PASS | Token revoked after validation |
| Password reset flow | GAP | No self-service password reset |

### Plan 04-02: Role Assignment Flow

| Area | Status | Finding |
|------|--------|---------|
| Client-roles API authorization | PASS | All endpoints require global_admin |
| assigned_by from JWT | PASS | Uses authenticated user ID (not headers) |
| Upsert pattern | PASS | ON CONFLICT prevents duplicate roles |
| DELETE scoping | PASS | Scoped by role_id AND user_id (prevents IDOR) |
| UI protection | PASS | RoleGuard with global_admin check |
| company_role enforcement | GAP | Stored but NEVER checked for permissions |
| assigned_by cascade | LOW | Dangling reference if admin deleted |

### Plan 04-03: Client Access Enforcement

| Area | Status | Finding |
|------|--------|---------|
| requireRole() client population | PASS | client_ids correctly fetched from DB |
| global_admin bypass | PASS | Correctly skips client filter |
| GET /api/incidents | PASS | Proper client isolation implemented |
| 17 other endpoints | CRITICAL GAP | No client isolation checks |

---

## Gap Summary

### Critical Gaps (Priority 0)

| # | Gap | Impact | Affected Endpoints |
|---|-----|--------|-------------------|
| 1 | No password initialization | Users cannot log in normally | User creation flow |
| 2 | Incident data exposed | Any user can view/modify any incident | GET/PATCH /api/incidents/[id] |
| 3 | Dossier data exposed | Full incident export to any user | GET /api/incidents/[id]/dossier |

### High-Severity Gaps (Priority 1)

| # | Gap | Impact |
|---|-----|--------|
| 4 | company_role not enforced | Client admin/user distinction meaningless |
| 5 | 11 GET endpoints missing client checks | Cross-client data access |
| 6 | 6 POST endpoints missing client checks | Unauthorized data creation |
| 7 | No password reset flow | Users locked out permanently |

### Medium-Severity Gaps (Priority 2)

| # | Gap | Impact |
|---|-----|--------|
| 8 | Email uniqueness relies on DB constraint | Generic error messages |
| 9 | assigned_by cascade risk | Audit trail loss on admin deletion |
| 10 | Temporary access as only option | Operational overhead, not scalable |

---

## Endpoint Gap Inventory

### Critical (3 endpoints)

| Endpoint | Vulnerability |
|----------|---------------|
| GET /api/incidents/[id] | Any incident viewable by enumeration |
| PATCH /api/incidents/[id] | Any incident modifiable |
| GET /api/incidents/[id]/dossier | Full incident data dump |

### High (11 endpoints)

| Endpoint | Vulnerability |
|----------|---------------|
| GET /api/clients | All clients visible to all users |
| GET /api/interviews | Any incident's interviews accessible |
| GET /api/root-cause | Any incident's RCA accessible |
| GET /api/corrective-actions | ALL actions globally visible |
| GET /api/evidence | Any incident's evidence accessible |
| GET /api/messages | Any incident's messages readable |
| GET /api/secure-form-links | Any incident's sharing tokens |
| POST /api/evidence | Upload to any incident |
| POST /api/messages | Post to any incident |
| POST /api/interviews | Create for any incident |
| POST /api/root-cause | Create for any incident |
| POST /api/corrective-actions | Create for any incident |

### Medium (3 endpoints)

| Endpoint | Vulnerability |
|----------|---------------|
| POST /api/incidents | Create incident for any client |
| POST /api/push-subscriptions | Subscribe to any incident |
| Password endpoints | Missing entirely |

---

## Phase 10 Recommendations

### Priority 0: Critical Security (Before Launch)

1. **Password Initialization Flow**
   - Create POST /api/auth/set-initial-password
   - Generate password setup token on user creation
   - Send setup email with secure link

2. **Fix Critical Endpoint Gaps**
   - Add client ownership checks to /api/incidents/[id]
   - Add client ownership checks to /api/incidents/[id]/dossier

### Priority 1: High Security (Before Launch)

3. **Password Reset Flow**
   - Create POST /api/auth/forgot-password
   - Create POST /api/auth/reset-password
   - Implement secure email delivery

4. **Client Isolation for All Endpoints**
   - Apply fix pattern to all 14 HIGH-severity endpoints
   - Use consistent global_admin bypass logic

5. **company_role Enforcement**
   - Define what client admin can do vs client user
   - Implement requireClientRole() helper

### Priority 2: Medium (Post-Launch)

6. **Email Uniqueness**
   - Add explicit LOWER() check before INSERT
   - Return user-friendly error for duplicates

7. **Audit Trail Protection**
   - Add ON DELETE SET NULL for assigned_by FK
   - Or implement soft delete for admin_users

8. **Rate Limiting**
   - Add rate limiting to temporary access generation
   - Add rate limiting to password reset emails

---

## Implementation Patterns (Reference)

### Pattern 1: List Endpoint Client Filter

```javascript
if (user.system_role !== "global_admin") {
  if (user.client_ids.length === 0) {
    return Response.json([]);
  }
  query += ` AND t.client_id = ANY($${paramCount})`;
  params.push(user.client_ids);
  paramCount++;
}
```

### Pattern 2: Single Resource Client Check

```javascript
if (user.system_role !== "global_admin") {
  if (!user.client_ids.includes(resource.client_id)) {
    return Response.json({ error: "Access denied" }, { status: 403 });
  }
}
```

### Pattern 3: POST Ownership Verification

```javascript
if (user.system_role !== "global_admin") {
  const incident = await sql`SELECT client_id FROM incidents WHERE id = ${incident_id}`;
  if (!incident[0] || !user.client_ids.includes(incident[0].client_id)) {
    return Response.json({ error: "Access denied" }, { status: 403 });
  }
}
```

---

## Statistics

| Metric | Value |
|--------|-------|
| Plans completed | 4/4 |
| Files audited | 12 |
| Gaps identified | 17 endpoint + 3 workflow |
| Critical gaps | 3 |
| High-severity gaps | 11 |
| Medium-severity gaps | 6 |
| Verified working | 6 flows |
| Phase 10 recommendations | 8 priority items |

---

## Conclusion

Phase 4 audited the complete user onboarding workflow from user creation through client data access. The core authentication and role assignment mechanisms work correctly, but two critical gaps exist:

1. **Password Gap**: Users created by admins cannot log in normally and must rely on temporary access tokens
2. **Client Isolation Gap**: 17 of 20 audited endpoints lack proper client isolation checks

Both gaps must be addressed in Phase 10 before production deployment. The temporary access workaround is functional but not scalable for production use.

**Phase Status**: COMPLETE
**Overall Onboarding Health**: PARTIALLY FUNCTIONAL (core works, critical gaps documented)

---

*Phase 4 completed: 2026-01-17*
