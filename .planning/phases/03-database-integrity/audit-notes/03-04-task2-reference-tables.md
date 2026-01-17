# Task 2: Reference Tables Audit

**Date:** 2026-01-17
**Tables Audited:** secure_form_links, job_positions, panel_physicians, audit_logs

---

## Table 1: secure_form_links

**Files:**
- `apps/web/src/app/api/secure-form-links/route.js`
- `apps/web/src/app/api/secure-form-links/resolve/route.js`
- `apps/web/src/app/api/secure-form-links/verify/route.js`

### Schema Fields Identified

| Field | Type | Required | Default |
|-------|------|----------|---------|
| id | UUID/INT | AUTO | PK |
| token_hash | TEXT | YES | - |
| incident_id | UUID/INT | YES | - |
| form_type | TEXT | YES | - |
| form_record_id | UUID/INT | NO | null |
| recipient_name | TEXT | NO | null |
| recipient_contact | TEXT | NO | null |
| delivery_method | TEXT | NO | null |
| expires_at | TIMESTAMP | YES | - |
| require_access_code | BOOLEAN | YES | - |
| access_code_hash | TEXT | NO | null |
| created_at | TIMESTAMP | AUTO | NOW() |
| revoked_at | TIMESTAMP | NO | null |

### FK Verification

| FK Field | References | Verified | Method |
|----------|------------|----------|--------|
| incident_id | incidents(id) | ASSUMED | Required in POST |
| form_record_id | (varies by form_type) | NOT ENFORCED | Polymorphic reference |

### Security Implementation

1. **Token Hashing** - GOOD
   ```javascript
   const token = randomBytes(24).toString("base64url");
   const tokenHash = sha256Hex(token);
   ```
   - Token is 24 random bytes (192 bits), base64url encoded
   - SHA-256 hash stored, plaintext never stored
   - Plaintext returned only on creation

2. **Access Code Hashing** - GOOD
   ```javascript
   accessCode = generateAccessCode(); // 6-digit numeric
   accessCodeHash = await argon2.hash(accessCode);
   ```
   - Uses Argon2 for access code
   - 6-digit numeric code (100000-999999)

3. **Expiration Validation** - GOOD
   - Expiration limits enforced (max 30 days)
   - Checked in resolve and verify endpoints
   - GET filters expired by default

4. **Revocation Support** - GOOD
   - revoked_at column for soft-revoke
   - Revoked links return 410 Gone

### Findings

1. **No DELETE endpoint**
   - Links can only be soft-revoked (revoked_at)
   - No endpoint to set revoked_at visible in route.js
   - May need separate PATCH endpoint

2. **Missing client isolation in GET**
   - Any authenticated user can list all links
   - Should filter by user's accessible incidents

3. **resolve/verify endpoints are unauthenticated** - INTENTIONAL
   - Comment explains this is for external form recipients
   - Token + access code provide authentication
   - Appropriate for external form sharing

4. **form_record_id is polymorphic**
   - References different tables based on form_type
   - No database-level FK constraint (by design)
   - Risk: Invalid references if form records deleted

5. **incident_id validation in POST** - GOOD
   ```javascript
   if (!incident_id) {
     return new Response("incident_id is required", { status: 400 });
   }
   ```

6. **No existence check for incident_id**
   - Accepts any value without verifying incident exists
   - Could create links for non-existent incidents

---

## Table 2: job_positions

**File:** `apps/web/src/app/api/job-positions/route.js`

### Schema Fields Identified

| Field | Type | Required | Default |
|-------|------|----------|---------|
| id | UUID/INT | AUTO | PK |
| title | TEXT | YES | UNIQUE |
| created_at | TIMESTAMP | AUTO | NOW() |
| updated_at | TIMESTAMP | AUTO | NOW() |

### Unique Constraint Verification

| Constraint | Status | Evidence |
|------------|--------|----------|
| title UNIQUE | VERIFIED | ON CONFLICT clause |

### Findings

1. **Upsert pattern confirmed**
   ```javascript
   ON CONFLICT (title) DO UPDATE SET title = EXCLUDED.title
   ```
   - Unique constraint on title verified
   - No-op update on conflict (title = EXCLUDED.title does nothing meaningful)

2. **Global reference table**
   - No client_id column
   - Shared across all clients
   - Intentional for standardized job titles

3. **Title validation** - GOOD
   ```javascript
   if (!title || typeof title !== "string") {
     return Response.json({ error: "Invalid title" }, { status: 400 });
   }
   ```
   - Also trims whitespace before insert

4. **No DELETE endpoint**
   - Job positions cannot be removed
   - Prevents orphan references in employee records

5. **No UPDATE endpoint**
   - Cannot rename job titles
   - May be intentional for audit consistency

6. **Error handling** - GOOD
   - Try-catch with 500 response on failure
   - Logs error to console

---

## Table 3: panel_physicians

**Files:**
- `apps/web/src/app/api/panel-physicians/route.js`
- `apps/web/src/app/api/panel-physicians/[id]/route.js`

### Schema Fields Identified

| Field | Type | Required | Default |
|-------|------|----------|---------|
| id | UUID/INT | AUTO | PK |
| location | TEXT | YES | - |
| file_url | TEXT | YES | - |
| file_name | TEXT | YES | - |
| file_type | TEXT | NO | - |
| created_at | TIMESTAMP | AUTO | NOW() |

### FK Verification

- **No foreign keys** - Global reference table

### Findings

1. **Global reference table**
   - No client_id column
   - Shared across all clients
   - Stores panel physician PDFs by location

2. **Validation in POST** - GOOD
   ```javascript
   if (!location || !file_url || !file_name) {
     return Response.json({ error: "Missing required fields" }, { status: 400 });
   }
   ```

3. **DELETE endpoint exists**
   - Any authenticated user can delete any physician record
   - No authorization check beyond authentication
   - May want to restrict to global_admin

4. **No UPDATE endpoint**
   - Cannot modify existing records
   - Must delete and recreate

5. **Ordering** - GOOD
   - GET returns ordered by location ASC, created_at DESC
   - Sensible for location-based lookup

6. **No duplicate prevention**
   - Can create multiple records for same location
   - No unique constraint on location
   - May be intentional (multiple physicians per location)

---

## Table 4: audit_logs

**File:** `apps/web/src/app/api/audit-logs/route.js`

### Schema Fields Identified

| Field | Type | Required | Default |
|-------|------|----------|---------|
| id | UUID/INT | AUTO | PK |
| entity_type | TEXT | YES | - |
| entity_id | TEXT | YES | - |
| action_type | TEXT | YES | - |
| performed_by | JSON | YES | - |
| old_data | JSON | NO | null |
| new_data | JSON | NO | null |
| changes_diff | JSON | NO | null |
| created_at | TIMESTAMP | AUTO | NOW() |

### FK Verification

- **No foreign keys** - Generic logging table
- entity_id is TEXT (not UUID FK) - stores string ID of any entity

### Findings

1. **Global admin only access** - GOOD
   ```javascript
   const { authorized, response } = await requireRole(request, ["global_admin"]);
   ```
   - Only global_admin can view audit logs
   - Proper access control

2. **Required filters** - GOOD
   ```javascript
   if (!entityType || !entityId) {
     return Response.json({ error: "Missing entityType or entityId" }, { status: 400 });
   }
   ```
   - Cannot list all logs
   - Must specify entity to view

3. **No POST endpoint in this file**
   - Audit logs created elsewhere in codebase
   - Search found creation in various handlers

4. **Generic entity logging** - GOOD
   - entity_type: e.g., "client", "incident", "employee"
   - entity_id: string ID of the entity
   - Allows logging any entity without FK constraints

5. **Action types observed**
   - CREATE, UPDATE, DELETE, STATUS_CHANGE
   - Not validated at API level (created elsewhere)

6. **JSON fields for flexibility**
   - performed_by: User info as JSON
   - old_data/new_data: Full record snapshots
   - changes_diff: What changed

7. **No DELETE endpoint**
   - Audit logs are permanent
   - Cannot be removed (appropriate for audit trail)

8. **No pagination**
   - Returns all logs for entity
   - May be slow for heavily-audited entities

---

## Summary

### Tables by Purpose

| Table | Purpose | Global/Scoped | FKs |
|-------|---------|---------------|-----|
| secure_form_links | External form sharing | Per-incident | incident_id |
| job_positions | Job title reference | Global | None |
| panel_physicians | Physician PDF reference | Global | None |
| audit_logs | Entity change logging | Global | None (by design) |

### Unique Constraints Verified

| Table | Field(s) | Method |
|-------|----------|--------|
| job_positions | title | ON CONFLICT |

### Security Patterns

| Table | Auth Required | Role Required |
|-------|---------------|---------------|
| secure_form_links (main) | YES | Any |
| secure_form_links (resolve) | NO | Token-based |
| secure_form_links (verify) | NO | Token + access code |
| job_positions | YES | Any |
| panel_physicians | YES | Any |
| audit_logs | YES | global_admin |

### Critical Findings

1. **Missing client isolation** (secure_form_links, panel_physicians)
   - Any authenticated user can access all records

2. **panel_physicians DELETE lacks role check**
   - Any user can delete physician records
   - Should require global_admin

3. **Polymorphic FK in secure_form_links**
   - form_record_id references different tables
   - No referential integrity possible at DB level

4. **No pagination in audit_logs**
   - Could cause performance issues

### Recommendations for Phase 10

1. Add client isolation to secure_form_links GET (filter by user's incidents)
2. Add global_admin role check to panel_physicians DELETE
3. Add pagination to audit_logs GET
4. Consider adding revocation endpoint to secure_form_links
5. Document polymorphic FK pattern for form_record_id
