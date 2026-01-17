# Task 1: Evidence, Messages, and Notification Tables Audit

**Date:** 2026-01-17
**Tables Audited:** evidence, messages, push_tokens, push_subscriptions

---

## Table 1: evidence

**File:** `apps/web/src/app/api/evidence/route.js`

### Schema Fields Identified

| Field | Type | Required | Default |
|-------|------|----------|---------|
| id | UUID/INT | AUTO | PK |
| incident_id | UUID/INT | YES | - |
| file_url | TEXT | YES | - |
| file_type | TEXT | YES | - |
| file_name | TEXT | YES | - |
| file_size | INT | NO | null |
| note_content | TEXT | NO | null |
| uploaded_by | TEXT | NO | null |
| upload_status | TEXT | NO | "synced" |
| created_at | TIMESTAMP | AUTO | NOW() |

### FK Verification

| FK Field | References | Verified | Method |
|----------|------------|----------|--------|
| incident_id | incidents(id) | ASSUMED | Used in WHERE clause |
| uploaded_by | - | NOT FK | String field, no constraint |

### Findings

1. **Missing incident_id validation in GET**
   ```javascript
   const incidentId = searchParams.get("incident_id");
   // No null check before query
   ```
   - If incident_id is null, returns WHERE incident_id = null (empty result)
   - Not a bug, but inconsistent with messages endpoint

2. **Missing incident_id validation in POST**
   - No validation that incident_id exists before INSERT
   - Could insert evidence for non-existent incidents

3. **Missing client isolation**
   - Any authenticated user can view/create evidence for any incident
   - Should verify user has access to the incident's client

4. **uploaded_by is a string, not FK**
   - Stores arbitrary string (e.g., user name or ID)
   - No referential integrity with admin_users

5. **No DELETE endpoint**
   - Once evidence is uploaded, cannot be removed via API
   - Could be intentional for audit purposes

---

## Table 2: messages

**File:** `apps/web/src/app/api/messages/route.js`

### Schema Fields Identified

| Field | Type | Required | Default |
|-------|------|----------|---------|
| id | UUID/INT | AUTO | PK |
| incident_id | UUID/INT | YES | - |
| sender_name | TEXT | NO | "System" |
| body | TEXT | YES | - |
| created_at | TIMESTAMP | AUTO | NOW() |

### FK Verification

| FK Field | References | Verified | Method |
|----------|------------|----------|--------|
| incident_id | incidents(id) | ASSUMED | Required in GET/POST |
| sender_name | - | NOT FK | String field |

### Findings

1. **incident_id validation in GET** - GOOD
   ```javascript
   if (!incidentId) {
     return Response.json({ error: "incident_id is required" }, { status: 400 });
   }
   ```

2. **incident_id validation in POST** - GOOD
   ```javascript
   if (!incident_id || !messageBody) {
     return Response.json({ error: "incident_id and body are required" }, { status: 400 });
   }
   ```

3. **Missing client isolation**
   - Any authenticated user can view/create messages for any incident
   - Should verify user has access to the incident's client

4. **sender_name is a string, not FK**
   - Defaults to "System" if not provided
   - No referential integrity with admin_users

5. **Push notification integration**
   - POST triggers push notifications to subscribed devices
   - Queries push_subscriptions table by incident_id
   - Uses Expo push notification service

6. **No DELETE endpoint**
   - Messages cannot be deleted via API

---

## Table 3: push_tokens

**File:** `apps/web/src/app/api/push-tokens/route.js`

### Schema Fields Identified

| Field | Type | Required | Default |
|-------|------|----------|---------|
| id | UUID/INT | AUTO | PK |
| expo_push_token | TEXT | YES | UNIQUE |
| device_id | TEXT | NO | null |
| platform | TEXT | NO | null |
| updated_at | TIMESTAMP | AUTO | NOW() |
| created_at | TIMESTAMP | AUTO | NOW() |

### Unique Constraint Verification

| Constraint | Status | Evidence |
|------------|--------|----------|
| expo_push_token UNIQUE | VERIFIED | ON CONFLICT clause |

### Findings

1. **Upsert pattern confirmed**
   ```javascript
   ON CONFLICT (expo_push_token)
   DO UPDATE SET
     device_id = EXCLUDED.device_id,
     platform = EXCLUDED.platform,
     updated_at = NOW()
   ```
   - Unique constraint on expo_push_token verified
   - Updates device_id and platform on conflict

2. **expo_push_token validation** - GOOD
   ```javascript
   if (!expo_push_token) {
     return Response.json({ error: "expo_push_token is required" }, { status: 400 });
   }
   ```

3. **DELETE endpoint exists**
   - Can delete by token value
   - Does NOT cascade to push_subscriptions
   - Risk: Orphan subscriptions referencing deleted token

4. **No GET endpoint**
   - Cannot list registered tokens via API
   - May be intentional for privacy

5. **No user association**
   - Tokens are device-level, not user-level
   - Cannot determine which user owns a token

---

## Table 4: push_subscriptions

**File:** `apps/web/src/app/api/push-subscriptions/route.js`

### Schema Fields Identified

| Field | Type | Required | Default |
|-------|------|----------|---------|
| id | UUID/INT | AUTO | PK |
| incident_id | UUID/INT | YES | - |
| expo_push_token | TEXT | YES | - |
| created_at | TIMESTAMP | AUTO | NOW() |

### Unique Constraint Verification

| Constraint | Status | Evidence |
|------------|--------|----------|
| (incident_id, expo_push_token) UNIQUE | VERIFIED | ON CONFLICT clause |

### FK Verification

| FK Field | References | Verified | Method |
|----------|------------|----------|--------|
| incident_id | incidents(id) | ASSUMED | Required in POST |
| expo_push_token | push_tokens(expo_push_token) | NOT ENFORCED | String match only |

### Findings

1. **Composite unique constraint verified**
   ```javascript
   ON CONFLICT (incident_id, expo_push_token) DO NOTHING
   ```
   - Same device cannot subscribe twice to same incident

2. **Validation in POST** - GOOD
   ```javascript
   if (!incident_id || !expo_push_token) {
     return Response.json({ error: "incident_id and expo_push_token are required" }, { status: 400 });
   }
   ```

3. **expo_push_token is NOT a true FK**
   - References push_tokens.expo_push_token by value
   - No database-level FK constraint
   - Can create subscription with non-existent token

4. **Missing incident_id validation**
   - No check that incident_id exists
   - Can create subscription for non-existent incident

5. **Missing client isolation**
   - Any authenticated user can subscribe to any incident
   - Should verify user has access to the incident's client

6. **DELETE endpoint exists**
   - Can unsubscribe by incident_id + token
   - Proper validation before delete

---

## Summary

### Tables by FK Status

| Table | FK Fields | Constraints Verified |
|-------|-----------|---------------------|
| evidence | incident_id | NOT VERIFIED |
| messages | incident_id | NOT VERIFIED |
| push_tokens | (none) | UNIQUE verified |
| push_subscriptions | incident_id | NOT VERIFIED |

### Unique Constraints Verified

| Table | Field(s) | Method |
|-------|----------|--------|
| push_tokens | expo_push_token | ON CONFLICT |
| push_subscriptions | (incident_id, expo_push_token) | ON CONFLICT |

### Critical Findings

1. **Missing Client Isolation** (4/4 tables)
   - All endpoints allow any authenticated user to access any incident's data

2. **Missing FK Validation** (3/4 tables)
   - incident_id not validated against incidents table
   - expo_push_token not validated against push_tokens table

3. **Orphan Risk: push_tokens DELETE**
   - Deleting a token does NOT delete associated subscriptions
   - Subscriptions reference token by string, not FK

4. **No Cascade on incidents DELETE**
   - If incidents could be deleted, evidence/messages/subscriptions would become orphans
   - Currently mitigated by no DELETE endpoint on incidents

### Recommendations for Phase 10

1. Add client isolation to all four endpoints
2. Add FK validation for incident_id before INSERT
3. Add CASCADE delete from push_tokens to push_subscriptions
4. Consider adding database-level FK constraint on push_subscriptions.expo_push_token
5. Add incident_id required check to evidence GET endpoint
