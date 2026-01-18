# Audit 07-02: Form Endpoint Data Validation Summary

## Audit Date
2026-01-17

## Objective
Verify 8 form type endpoints return (or lack) related data via JOINs

---

## Task 1: Audit Form GET Endpoints for JOINs

### Results by Endpoint

| Endpoint | Has JOIN? | Query Pattern | Missing Context |
|----------|-----------|---------------|-----------------|
| benefit-affidavits | NO | `SELECT * FROM benefit_affidavits` | Incident details, employee info |
| mileage-reimbursements | NO | `SELECT * FROM mileage_reimbursements` | Incident details, employee info, trip entries |
| trip-entries | NO | `SELECT * FROM trip_entries` | Reimbursement details |
| prescription-cards | NO | `SELECT * FROM prescription_cards` | Incident details |
| medical-authorizations | NO | `SELECT * FROM medical_authorizations` | Incident details |
| refusal-of-treatments | NO | `SELECT * FROM refusal_of_treatments` | Incident details |
| modified-duty-policies | NO | `SELECT * FROM modified_duty_policies` | Incident details |
| status-logs | YES | JOINs with employees and incidents | None - properly implemented |

### Detailed Analysis

#### 1. benefit-affidavits (`/api/benefit-affidavits`)
- **File**: `apps/web/src/app/api/benefit-affidavits/route.js`
- **GET Query**: Standalone `SELECT * FROM benefit_affidavits`
- **Filtering**: Supports `?incident_id=X`
- **JOIN Status**: NONE
- **Impact**: Client cannot display incident context without additional API call

#### 2. mileage-reimbursements (`/api/mileage-reimbursements`)
- **File**: `apps/web/src/app/api/mileage-reimbursements/route.js`
- **GET Query**: Standalone `SELECT * FROM mileage_reimbursements`
- **Filtering**: Supports `?incident_id=X`
- **JOIN Status**: NONE
- **Impact**:
  - Missing incident context
  - Missing employee details
  - Trip entries NOT included (requires separate fetch)

#### 3. trip-entries (`/api/trip-entries`)
- **File**: `apps/web/src/app/api/trip-entries/route.js`
- **GET Query**: Standalone `SELECT * FROM trip_entries`
- **Filtering**: Supports `?reimbursement_id=X`
- **JOIN Status**: NONE
- **Impact**: Client cannot see reimbursement context

#### 4. prescription-cards (`/api/prescription-cards`)
- **File**: `apps/web/src/app/api/prescription-cards/route.js`
- **GET Query**: Standalone `SELECT * FROM prescription_cards`
- **Filtering**: Supports `?incident_id=X`
- **JOIN Status**: NONE
- **Impact**: Missing incident context

#### 5. medical-authorizations (`/api/medical-authorizations`)
- **File**: `apps/web/src/app/api/medical-authorizations/route.js`
- **GET Query**: Standalone `SELECT * FROM medical_authorizations`
- **Filtering**: Supports `?incident_id=X`
- **JOIN Status**: NONE
- **Impact**: Missing incident context

#### 6. refusal-of-treatments (`/api/refusal-of-treatments`)
- **File**: `apps/web/src/app/api/refusal-of-treatments/route.js`
- **GET Query**: Standalone `SELECT * FROM refusal_of_treatments`
- **Filtering**: Supports `?incident_id=X`
- **JOIN Status**: NONE
- **Impact**: Missing incident context

#### 7. modified-duty-policies (`/api/modified-duty-policies`)
- **File**: `apps/web/src/app/api/modified-duty-policies/route.js`
- **GET Query**: Standalone `SELECT * FROM modified_duty_policies`
- **Filtering**: Supports `?incident_id=X`
- **JOIN Status**: NONE
- **Impact**: Missing incident context

#### 8. status-logs (`/api/status-logs`) - PROPERLY IMPLEMENTED
- **File**: `apps/web/src/app/api/status-logs/route.js`
- **GET Query**:
```sql
SELECT sl.*,
       e.full_name as employee_name,
       i.incident_date
FROM status_logs sl
LEFT JOIN employees e ON sl.employee_id = e.id
LEFT JOIN incidents i ON sl.incident_id = i.id
```
- **Filtering**: Supports `?incident_id=X`, `?employee_id=X`, `?status_log_id=X`
- **JOIN Status**: YES - employees and incidents
- **Impact**: None - this is the reference implementation

---

## Task 2: Form Context Requirements

### What Context Do Forms Need?

| Form Type | Needs Incident Details? | Needs Employee Info? | Needs Related Data? |
|-----------|------------------------|---------------------|---------------------|
| benefit-affidavits | Yes - for display | Yes - employee name | No |
| mileage-reimbursements | Yes - for context | Yes - employee name | Yes - trip entries |
| trip-entries | Maybe | No | Yes - reimbursement totals |
| prescription-cards | Yes - injury context | Yes - patient is employee | No |
| medical-authorizations | Yes - injury context | Yes - patient is employee | No |
| refusal-of-treatments | Yes - injury context | Yes - employee name | No |
| modified-duty-policies | Yes - injury context | Yes - employee name | No |
| status-logs | Already has | Already has | No |

### Mobile App Impact
- Mobile forms display incident information prominently
- Without JOINs, mobile app must make multiple API calls
- This increases latency and complexity in mobile code
- Some forms may render incompletely until additional fetches complete

---

## Task 3: Mileage - Trip Entries Relationship

### Current Implementation

**POST Behavior (mileage-reimbursements)**:
```javascript
// Trip entries CAN be created inline during POST
const { trip_entries = [] } = body;

// Creates reimbursement first
const reimbursement = await sql`INSERT INTO mileage_reimbursements...`;

// Then creates trip entries if provided
if (trip_entries.length > 0) {
  for (const entry of trip_entries) {
    await sql`INSERT INTO trip_entries...`;
  }
}

// Returns ONLY the reimbursement (not trip entries)
return Response.json(reimbursement);
```

**GET Behavior (mileage-reimbursements)**:
```javascript
// Returns ONLY reimbursement data, no trip entries
SELECT * FROM mileage_reimbursements
```

**GET Behavior (trip-entries)**:
```javascript
// Separate endpoint required to get trip entries
SELECT * FROM trip_entries WHERE reimbursement_id = ?
```

### Relationship Pattern
- **Parent**: `mileage_reimbursements` (contains `incident_id`, `employee_id`)
- **Child**: `trip_entries` (contains `reimbursement_id` foreign key)
- **Loading**: Client must make 2 API calls:
  1. `GET /api/mileage-reimbursements?incident_id=X`
  2. `GET /api/trip-entries?reimbursement_id=Y` (for each reimbursement)

### Problems with Current Pattern
1. N+1 query problem for lists (1 call per reimbursement)
2. Total mileage must be calculated client-side
3. Race conditions possible if trip entries load after reimbursement display

---

## Task 4: Phase 10 Recommendations

### Priority List for JOIN Additions

#### Priority 1: High Impact (Add Immediately)
1. **mileage-reimbursements**
   - JOIN: employees (employee_name), incidents (incident_date)
   - Include: trip_entries as nested array OR calculate total_miles
   - Mobile Impact: Mileage form is frequently used, needs incident context

2. **benefit-affidavits**
   - JOIN: incidents (incident_date, description), employees (full_name)
   - Mobile Impact: Affidavit displays require incident context

#### Priority 2: Medium Impact
3. **medical-authorizations**
   - JOIN: incidents (incident_date), employees (full_name as patient)
   - Mobile Impact: Authorization forms need patient/injury context

4. **refusal-of-treatments**
   - JOIN: incidents (incident_date), employees (full_name)
   - Mobile Impact: Refusal form needs employee/incident context

5. **modified-duty-policies**
   - JOIN: incidents (incident_date), employees (full_name)
   - Mobile Impact: Modified duty requires incident context

#### Priority 3: Lower Impact
6. **prescription-cards**
   - JOIN: incidents (incident_date), employees (full_name)
   - Mobile Impact: Lower frequency usage

7. **trip-entries**
   - JOIN: mileage_reimbursements (optional - for admin views)
   - Mobile Impact: Usually fetched in reimbursement context anyway

### Standardization Patterns

#### Recommended JOIN Template
Use status-logs as the reference pattern:
```sql
SELECT f.*,
       e.full_name as employee_name,
       i.incident_date,
       i.description as incident_description
FROM form_table f
LEFT JOIN employees e ON f.employee_id = e.id
LEFT JOIN incidents i ON f.incident_id = i.id
WHERE ...
ORDER BY f.created_at DESC
```

#### Mileage-Specific Pattern
```sql
SELECT mr.*,
       e.full_name as employee_name,
       i.incident_date,
       COALESCE(SUM(te.round_trip_miles), 0) as total_miles,
       COUNT(te.id) as trip_count
FROM mileage_reimbursements mr
LEFT JOIN employees e ON mr.employee_id = e.id
LEFT JOIN incidents i ON mr.incident_id = i.id
LEFT JOIN trip_entries te ON te.reimbursement_id = mr.id
WHERE ...
GROUP BY mr.id, e.full_name, i.incident_date
ORDER BY mr.created_at DESC
```

---

## Summary Statistics

| Metric | Count |
|--------|-------|
| Total Endpoints Audited | 8 |
| Endpoints WITH JOINs | 1 (status-logs) |
| Endpoints WITHOUT JOINs | 7 |
| Endpoints Needing Priority Fixes | 2 (mileage, benefit-affidavits) |
| Endpoints Needing Standard Fixes | 5 |

---

## Verification Checklist

- [x] All 8 form endpoints audited
- [x] JOIN status documented for each
- [x] Mileage/trip relationship documented
- [x] Phase 10 recommendations created
- [x] SUMMARY.md created with findings
