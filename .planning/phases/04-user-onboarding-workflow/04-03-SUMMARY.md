# Plan 04-03: Client Access Enforcement Audit Summary

## Status: COMPLETE
## Date: 2026-01-17
## Phase: 04-user-onboarding-workflow
## Plan: 03 - Client Access Enforcement Audit

---

## Objective

Verify client isolation is enforced after role assignment and document all gaps.

---

## Task 1: requireRole() Client Population Audit

**File**: `apps/web/src/app/api/utils/auth.js`

### Client Access Flow

```
1. JWT token extracted from request (secure/non-secure cookie handling)
2. User email extracted from token
3. User record fetched from admin_users table
4. system_role normalized (global_admin or standard)
5. Client roles fetched from user_client_roles table
6. user.client_roles = array of {client_id, company_role} objects
7. user.client_ids = array of client_id values
8. Returned user object contains client_ids for filtering
```

### Code Analysis

```javascript
// Line 64-71: Client roles population
const clientRoles = await sql`
  SELECT client_id, company_role
  FROM user_client_roles
  WHERE user_id = ${dbUser.id}
`;

user.client_roles = clientRoles;
user.client_ids = clientRoles.map((r) => r.client_id);
```

### Findings

| Check | Status | Evidence |
|-------|--------|----------|
| client_roles fetched from user_client_roles | VERIFIED | Line 64-68 - SQL query joins on user_id |
| client_ids array populated | VERIFIED | Line 71 - Mapped from clientRoles |
| global_admin bypass | VERIFIED | Line 30 incidents/route.js checks system_role |
| Empty client_ids handled | PARTIAL | Endpoint-specific handling required |

### Global Admin Bypass Behavior

The `requireRole()` function does NOT enforce client access itself. Instead:
- It populates `user.client_ids` for ALL users (including global_admin)
- Each endpoint is responsible for checking `user.system_role !== "global_admin"` before filtering
- This is correct - global_admin should see all data across all clients

### Task 1 Summary

The `requireRole()` function correctly:
1. Fetches client roles from `user_client_roles` table
2. Populates `user.client_ids` array for downstream use
3. Does NOT enforce client filtering (leaves to endpoints)

**Gap**: No centralized enforcement - each endpoint must implement filtering.

---

## Task 2: Working vs Broken Endpoint Pattern Analysis

### Working Pattern: GET /api/incidents (route.js)

**File**: `apps/web/src/app/api/incidents/route.js` (Lines 29-41)

```javascript
// Phase 3: Client Access Control
if (user.system_role !== "global_admin") {
  if (user.client_ids.length === 0) {
    // User has no clients assigned, return empty list
    return Response.json([]);
  }
  // Filter by assigned clients
  query += ` AND i.client_id = ANY($${paramCount})`;
  params.push(user.client_ids);
  paramCount++;
}
```

**Characteristics of Working Pattern:**
1. Checks `user.system_role !== "global_admin"` first
2. Handles empty `client_ids` array (returns empty result)
3. Uses PostgreSQL `ANY()` operator for array comparison
4. Adds filter to WHERE clause dynamically

### Broken Pattern: GET /api/incidents/[id] (route.js)

**File**: `apps/web/src/app/api/incidents/[id]/route.js` (Lines 6-36)

```javascript
export async function GET(request, { params }) {
  const { authorized, response, user } = await requireRole(request, []);
  if (!authorized) return response;
  const { id } = params;

  const rows = await sql`
    SELECT ... FROM incidents i
    LEFT JOIN employees e ON i.employee_id = e.id
    LEFT JOIN clients c ON i.client_id = c.id
    WHERE i.id = ${id}
  `;
  // NO CLIENT CHECK - returns any incident by ID
  return Response.json(rows[0]);
}
```

**Missing Implementation:**
```javascript
// REQUIRED FIX PATTERN:
if (user.system_role !== "global_admin") {
  // Verify incident belongs to user's client
  if (!user.client_ids.includes(rows[0].client_id)) {
    return Response.json({ error: "Access denied" }, { status: 403 });
  }
}
```

### Implementation Differences

| Aspect | Working (GET /incidents) | Broken (GET /incidents/[id]) |
|--------|--------------------------|------------------------------|
| global_admin bypass | YES - checked first | NO - no check at all |
| client_ids filter | YES - ANY() in WHERE | NO - no filter |
| Empty client_ids | Returns [] | Returns any incident |
| Query modification | Dynamic WHERE clause | Static WHERE clause |

### Fix Pattern Required

For single-resource endpoints:
1. Fetch the resource first
2. Check if resource.client_id is in user.client_ids
3. Return 403 if not authorized
4. global_admin bypasses this check

For list endpoints:
1. Add client_ids filter to WHERE clause
2. Use ANY() for array comparison
3. Handle empty client_ids (return [])
4. global_admin skips filter

---

## Task 3: Complete Client Isolation Gap Inventory

### Phase 3 Findings (11 Endpoints)

From `03-04-SUMMARY.md`:

| # | Endpoint | Gap | Severity |
|---|----------|-----|----------|
| 1 | GET /api/clients | Returns ALL clients to all users | HIGH |
| 2 | GET /api/incidents/[id] | Any user can view any incident | CRITICAL |
| 3 | PATCH /api/incidents/[id] | Any user can modify any incident | CRITICAL |
| 4 | GET /api/incidents/[id]/dossier | Exposes ALL incident data | CRITICAL |
| 5 | GET /api/interviews | Returns interviews for any incident | HIGH |
| 6 | GET /api/root-cause | Returns RCA for any incident | HIGH |
| 7 | GET /api/corrective-actions | Returns ALL actions globally | HIGH |
| 8 | GET /api/evidence | Returns evidence for any incident | HIGH |
| 9 | GET /api/messages | Returns messages for any incident | HIGH |
| 10 | POST /api/push-subscriptions | Can subscribe to any incident | MEDIUM |
| 11 | GET /api/secure-form-links | Returns links for any incident | HIGH |

### Additional Findings from This Audit

| # | Endpoint | Gap | Severity |
|---|----------|-----|----------|
| 12 | POST /api/incidents | No client_id authorization check | MEDIUM |
| 13 | POST /api/evidence | No incident ownership check | HIGH |
| 14 | POST /api/messages | No incident ownership check | HIGH |
| 15 | POST /api/interviews | No incident ownership check | HIGH |
| 16 | POST /api/root-cause | No incident ownership check | HIGH |
| 17 | POST /api/corrective-actions | No incident ownership check | HIGH |

### Categorized Gap List

#### CRITICAL (3) - Direct Data Exposure
| Endpoint | Vulnerability | Exploitation |
|----------|---------------|--------------|
| GET /api/incidents/[id] | Any incident viewable | Enumerate IDs to view all incidents |
| PATCH /api/incidents/[id] | Any incident modifiable | Tamper with other client's data |
| GET /api/incidents/[id]/dossier | Full incident data dump | Export any incident's complete record |

#### HIGH (11) - Cross-Client Data Access
| Endpoint | Vulnerability | Exploitation |
|----------|---------------|--------------|
| GET /api/clients | All clients visible | View competitor client list |
| GET /api/interviews | Any incident's interviews | Access confidential interviews |
| GET /api/root-cause | Any incident's RCA | View investigation findings |
| GET /api/corrective-actions | ALL actions globally | View all corrective actions |
| GET /api/evidence | Any incident's evidence | Access confidential documents |
| GET /api/messages | Any incident's messages | Read private communications |
| GET /api/secure-form-links | Any incident's links | Access form sharing tokens |
| POST /api/evidence | Upload to any incident | Pollute other client's data |
| POST /api/messages | Post to any incident | Send unauthorized messages |
| POST /api/interviews | Create for any incident | Modify investigation records |
| POST /api/root-cause | Create for any incident | Falsify RCA data |
| POST /api/corrective-actions | Create for any incident | Add false corrective actions |

#### MEDIUM (2) - Limited Impact
| Endpoint | Vulnerability | Exploitation |
|----------|---------------|--------------|
| POST /api/incidents | Create for any client | Create unauthorized incidents |
| POST /api/push-subscriptions | Subscribe to any incident | Receive notifications for other clients |

### Endpoints with CORRECT Client Isolation

For reference, these endpoints properly implement client filtering:

| Endpoint | Implementation |
|----------|----------------|
| GET /api/incidents | Filters by user.client_ids with ANY() |
| GET /api/employees | Filters by user.client_ids |
| Import endpoints | Validate client_id access |

---

## Recommendations for Phase 10

### Priority 0 - Critical Security Fixes

1. **GET /api/incidents/[id]** - Add client_id ownership check
2. **PATCH /api/incidents/[id]** - Add client_id ownership check
3. **GET /api/incidents/[id]/dossier** - Add client_id ownership check

### Priority 1 - High Security Fixes

4. **GET /api/clients** - Filter by user.client_ids for non-global_admin
5. **GET /api/evidence** - Verify incident belongs to user's client
6. **GET /api/messages** - Verify incident belongs to user's client
7. **GET /api/interviews** - Verify incident belongs to user's client
8. **GET /api/root-cause** - Verify incident belongs to user's client
9. **GET /api/corrective-actions** - Require incident_id filter + client check
10. **GET /api/secure-form-links** - Verify incident belongs to user's client

### Priority 2 - POST Authorization Fixes

11. **POST /api/evidence** - Verify incident ownership before insert
12. **POST /api/messages** - Verify incident ownership before insert
13. **POST /api/interviews** - Verify incident ownership before insert
14. **POST /api/root-cause** - Verify incident ownership before insert
15. **POST /api/corrective-actions** - Verify incident ownership before insert
16. **POST /api/incidents** - Verify client_id in user.client_ids

### Priority 3 - Lower Impact

17. **POST /api/push-subscriptions** - Verify incident ownership

---

## Implementation Pattern Reference

### For List Endpoints (GET collections)

```javascript
// Phase 10 Fix Pattern
if (user.system_role !== "global_admin") {
  if (user.client_ids.length === 0) {
    return Response.json([]);
  }
  query += ` AND t.client_id = ANY($${paramCount})`;
  params.push(user.client_ids);
  paramCount++;
}
```

### For Single Resource Endpoints (GET/PATCH by ID)

```javascript
// Phase 10 Fix Pattern
const rows = await sql`SELECT * FROM table WHERE id = ${id}`;
if (rows.length === 0) {
  return Response.json({ error: "Not found" }, { status: 404 });
}

// Client isolation check
if (user.system_role !== "global_admin") {
  const incident = await sql`SELECT client_id FROM incidents WHERE id = ${rows[0].incident_id}`;
  if (!user.client_ids.includes(incident[0]?.client_id)) {
    return Response.json({ error: "Access denied" }, { status: 403 });
  }
}
```

### For POST Endpoints

```javascript
// Phase 10 Fix Pattern
const { incident_id } = body;

// Verify incident ownership
if (user.system_role !== "global_admin") {
  const incident = await sql`SELECT client_id FROM incidents WHERE id = ${incident_id}`;
  if (!incident[0] || !user.client_ids.includes(incident[0].client_id)) {
    return Response.json({ error: "Access denied" }, { status: 403 });
  }
}

// Proceed with INSERT
```

---

## Verification Checklist

- [x] requireRole() client population verified
- [x] client_roles fetched from user_client_roles table
- [x] client_ids array populated correctly
- [x] global_admin bypass behavior documented
- [x] Working pattern documented (GET /incidents)
- [x] Broken pattern documented (GET /incidents/[id])
- [x] Fix pattern documented for single-resource endpoints
- [x] All 11 Phase 3 gaps catalogued
- [x] Additional gaps identified (6 POST endpoints)
- [x] Gaps categorized by severity
- [x] Exploitation risk documented
- [x] Prioritized fix recommendations created

---

## Summary Statistics

| Metric | Count |
|--------|-------|
| Total client isolation gaps | 17 endpoints |
| Critical severity | 3 |
| High severity | 11 |
| Medium severity | 3 |
| Endpoints with correct isolation | 3 |
| Recommended fix patterns | 3 (list, single, POST) |

---

## Conclusion

The `requireRole()` function correctly populates `user.client_ids` from the `user_client_roles` table, but client isolation enforcement is delegated to individual endpoints. The majority of endpoints (17 of 20 audited) lack proper client isolation checks, creating a significant cross-tenant data exposure risk.

The `GET /api/incidents` endpoint demonstrates the correct implementation pattern that should be replicated across all other endpoints in Phase 10.

**Critical Action**: All 17 gaps should be fixed in Phase 10 before production deployment.

---

*Plan 04-03 completed: 2026-01-17*
