# Audit Summary 07-01: Incident-Centric Endpoints

## Overview
Audited incident list, detail, dossier, and dashboard endpoints to verify JOIN patterns and returned fields match mobile app expectations.

---

## Task 1: Incident List JOIN

**File**: `apps/web/src/app/api/incidents/route.js`

### JOIN Pattern
```sql
SELECT
  i.*,
  e.full_name as employee_name,
  c.name as client_name,
  c.location as client_location
FROM incidents i
LEFT JOIN employees e ON i.employee_id = e.id
LEFT JOIN clients c ON i.client_id = c.id
```

### Fields Returned
| Field | Source | Alias | Present |
|-------|--------|-------|---------|
| employee_name | employees.full_name | employee_name | YES |
| employee_number | employees.employee_id | - | NO |
| client_name | clients.name | client_name | YES |
| client_location | clients.location | client_location | YES |

### Client Isolation
- Client filtering implemented via `i.client_id = ANY($N)` with `user.client_ids` array
- Global admins bypass client filtering (see line 30-40)
- Users with no assigned clients receive empty array

### Findings
- **MISSING**: `employee_number` not returned in list view
- List endpoint returns limited employee/client data (optimized for list view)
- Search includes employee name in LIKE query

---

## Task 2: Incident Detail JOIN

**File**: `apps/web/src/app/api/incidents/[id]/route.js`

### JOIN Pattern
```sql
SELECT
  i.*,
  e.full_name as employee_name,
  e.employee_id as employee_number,
  e.job_position as employee_position,
  e.phone as employee_phone,
  c.name as client_name,
  c.location as client_location,
  c.contact_name as client_contact,
  c.contact_phone as client_phone,
  c.logo_url as client_logo_url,
  c.primary_color as client_primary_color,
  c.secondary_color as client_secondary_color
FROM incidents i
LEFT JOIN employees e ON i.employee_id = e.id
LEFT JOIN clients c ON i.client_id = c.id
```

### Employee Fields Returned
| Mobile Expects | DB Column | Alias | Present |
|----------------|-----------|-------|---------|
| employee_name | employees.full_name | employee_name | YES |
| employee_number | employees.employee_id | employee_number | YES |
| employee_position | employees.job_position | employee_position | YES |
| employee_phone | employees.phone | employee_phone | YES |

### Client Fields Returned
| Mobile Expects | DB Column | Alias | Present |
|----------------|-----------|-------|---------|
| client_name | clients.name | client_name | YES |
| client_location | clients.location | client_location | YES |
| client_contact | clients.contact_name | client_contact | YES |
| client_phone | clients.contact_phone | client_phone | YES |
| client_logo_url | clients.logo_url | client_logo_url | YES |

### Additional Fields (Bonus)
- `client_primary_color` - clients.primary_color
- `client_secondary_color` - clients.secondary_color

### Findings
- ALL expected mobile fields are present with correct aliases
- LEFT JOIN handles missing employee/client gracefully (returns NULL)
- 404 returned if incident not found
- PATCH endpoint does NOT re-fetch JOINed data (returns only incident table columns)

---

## Task 3: Dossier Endpoint

**File**: `apps/web/src/app/api/incidents/[id]/dossier/route.js`

### Multi-Query Pattern
The dossier endpoint uses 6 sequential queries:

1. **Incident Details** - Same JOIN as detail endpoint (with employee/client fields)
2. **Evidence** - `SELECT * FROM evidence WHERE incident_id = $id`
3. **Interviews** - `SELECT * FROM interviews WHERE incident_id = $id`
4. **Corrective Actions** - `SELECT * FROM corrective_actions WHERE incident_id = $id`
5. **Root Cause Analysis** - `SELECT * FROM root_cause_analysis WHERE incident_id = $id`
6. **Witnesses** - `SELECT * FROM interview_witnesses WHERE interview_id = ANY($ids)`

### Collections Included
| Collection | Table | Included | Notes |
|------------|-------|----------|-------|
| incident | incidents (JOINed) | YES | Full employee/client fields |
| evidence | evidence | YES | Ordered by created_at DESC |
| interviews | interviews | YES | With witnesses attached |
| correctiveActions | corrective_actions | YES | Ordered by created_at DESC |
| rootCause | root_cause_analysis | YES | Ordered by why_level ASC |

### Response Structure
```json
{
  "incident": { /* incident with employee/client fields */ },
  "evidence": [ /* evidence records */ ],
  "interviews": [ /* interviews with nested witnesses array */ ],
  "correctiveActions": [ /* corrective actions */ ],
  "rootCause": [ /* 5-why analysis records */ ]
}
```

### Witness Attachment
- Witnesses are fetched for all interview IDs using `ANY($ids)` syntax
- Each interview object includes a `witnesses` array containing its witnesses
- Empty interviews array results in no witness query (handled correctly)

### Findings
- All expected child collections are present
- Witness interviews properly attached to parent interviews
- Note: `client_secondary_color` is NOT included in dossier (unlike detail endpoint)
- Try-catch wraps all queries with generic 500 error response

---

## Task 4: Dashboard Stats

**File**: `apps/web/src/app/api/dashboard/stats/route.js`

### Queries Executed
1. Total incidents count
2. Open incidents count (status = 'open')
3. Critical incidents count (severity = 'critical')
4. Status breakdown (GROUP BY status)
5. Recent activity (last 5 incidents with employee/client names)
6. Trend (last 7 days, grouped by day)
7. Type breakdown (top 5 incident types)

### Recent Activity Structure
```sql
SELECT
  i.incident_number,
  i.incident_type,
  i.status,
  i.created_at,
  e.full_name as employee_name,
  c.name as client_name
FROM incidents i
LEFT JOIN employees e ON i.employee_id = e.id
LEFT JOIN clients c ON i.client_id = c.id
ORDER BY i.created_at DESC
LIMIT 5
```

| Field | Present |
|-------|---------|
| employee_name | YES |
| client_name | YES |

### Trend Data Structure
```json
[
  { "day": "Mon", "count": 5 },
  { "day": "Tue", "count": 3 }
]
```
- Uses `to_char(created_at, 'Dy')` for day abbreviation
- Grouped by `created_at::date` and ordered ASC
- Limited to last 7 days

### Type Breakdown Structure
```json
[
  { "incident_type": "Injury", "count": 10 },
  { "incident_type": "Near Miss", "count": 8 }
]
```
- Top 5 incident types by count

### Findings
- recentActivity includes both employee_name and client_name
- Trend returns array of {day, count} objects
- Type breakdown returns array of {incident_type, count}
- **MISSING**: No client isolation - dashboard shows ALL incidents regardless of user's assigned clients

---

## Summary of Findings

### Compliant
- [x] Incident detail returns ALL expected mobile fields with correct aliases
- [x] Dossier includes all child collections (evidence, interviews, corrective_actions, root_cause)
- [x] Witness interviews attached to parent interviews correctly
- [x] Dashboard recentActivity has employee_name and client_name
- [x] Trend data structure is correct (array of {day, count})
- [x] LEFT JOINs handle missing relations gracefully

### Issues Found

| Issue | Endpoint | Severity | Description |
|-------|----------|----------|-------------|
| Missing employee_number in list | /api/incidents | Low | List view doesn't return employee_number |
| PATCH returns raw data | /api/incidents/[id] | Low | PATCH response lacks JOINed employee/client fields |
| Dashboard no client isolation | /api/dashboard/stats | Medium | Shows all incidents, not filtered by user's clients |
| Dossier missing secondary_color | /api/incidents/[id]/dossier | Low | Detail has client_secondary_color, dossier doesn't |

### Recommendations for Phase 10
1. Add `employee_number` to incident list query if mobile needs it
2. Consider re-fetching JOINed data after PATCH to return complete object
3. **IMPORTANT**: Add client isolation to dashboard stats endpoint
4. Standardize client color fields between detail and dossier endpoints

---

## Files Audited
- `apps/web/src/app/api/incidents/route.js`
- `apps/web/src/app/api/incidents/[id]/route.js`
- `apps/web/src/app/api/incidents/[id]/dossier/route.js`
- `apps/web/src/app/api/dashboard/stats/route.js`

## Audit Completed
Date: 2026-01-17
Status: COMPLETE
