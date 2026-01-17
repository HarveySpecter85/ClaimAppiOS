# Task 3: Mileage Tables Audit (Parent-Child)

**Date:** 2026-01-17
**Tables Audited:** mileage_reimbursements, trip_entries

## Summary

mileage_reimbursements and trip_entries form a parent-child relationship for tracking employee mileage reimbursement requests. The parent table has FKs to both incidents and employees. Notable: This is the only parent-child pair where POST creates children in a loop (N+1 pattern).

---

## 1. mileage_reimbursements (Parent Table)

### API Routes
- `apps/web/src/app/api/mileage-reimbursements/route.js` (GET, POST)
- `apps/web/src/app/api/mileage-reimbursements/[id]/route.js` (GET, PUT, DELETE)

### Fields Observed
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | UUID | PK | Auto-generated |
| incident_id | UUID | FK | FK to incidents |
| employee_id | UUID | FK | FK to employees |
| employee_signature_url | TEXT | NO | Signature storage |
| date_signed | DATE | NO | Date signed |
| status | TEXT | NO | Default: "draft" |
| created_at | TIMESTAMP | AUTO | Timestamp |
| updated_at | TIMESTAMP | AUTO | Timestamp |

### Foreign Key Verification

1. **incident_id FK**
   - Used in INSERT: `${incident_id}`
   - NOT validated as required in POST
   - Filtered by in GET: supports `?incident_id=` query param

2. **employee_id FK**
   - Used in INSERT: `${employee_id}`
   - NOT validated as required in POST

### POST with Nested Children
The POST endpoint accepts `trip_entries` array and creates children:

```javascript
const { trip_entries = [] } = body;
// ... create reimbursement ...
if (trip_entries.length > 0) {
  for (const entry of trip_entries) {
    await sql`INSERT INTO trip_entries ...`;
  }
}
```

**CRITICAL FINDING: N+1 Insertion Pattern**
- Uses `for...of` loop with individual INSERTs
- NOT a batch INSERT
- Performance impact: N+1 queries for N trip entries

### GET with Nested Children
The [id]/GET endpoint fetches children and nests them:

```javascript
const tripEntries = await sql`SELECT * FROM trip_entries WHERE reimbursement_id = ${id}`;
reimbursement.trip_entries = tripEntries;
```

**GOOD**: Nested response pattern - single call returns parent + children

### Status Handling
- POST: Defaults to "draft" if not provided
- PUT: No enum validation - accepts any string value

### Findings
- CONCERN: Neither incident_id nor employee_id validated as required
- CRITICAL: N+1 insertion pattern for trip entries (use batch INSERT)
- GOOD: Nested GET response includes trip_entries
- CONCERN: No status enum validation
- CONCERN: DELETE does not cascade to trip_entries (orphan risk)

---

## 2. trip_entries (Child Table)

### API Routes
- `apps/web/src/app/api/trip-entries/route.js` (GET, POST)
- `apps/web/src/app/api/trip-entries/[id]/route.js` (PUT, DELETE)

Note: [id]/route.js does NOT have GET - must use parent endpoint or list with filter

### Fields Observed
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | UUID | PK | Auto-generated |
| reimbursement_id | UUID | FK | FK to mileage_reimbursements |
| trip_date | DATE | NO | Date of trip |
| start_address | TEXT | NO | Starting location |
| medical_facility | TEXT | NO | Medical facility visited |
| final_destination | TEXT | NO | Final destination |
| round_trip_miles | DECIMAL | NO | Total miles |
| created_at | TIMESTAMP | AUTO | Timestamp |
| updated_at | TIMESTAMP | AUTO | Timestamp |

### Foreign Key Verification

1. **reimbursement_id FK**
   - Used in INSERT: `${reimbursement_id}`
   - NOT validated as required in POST
   - Filtered by in GET: supports `?reimbursement_id=` query param

### Two Insertion Paths
Trip entries can be created via:
1. **Parent POST**: Nested in `trip_entries` array (N+1 pattern)
2. **Direct POST**: Via `/api/trip-entries` endpoint (single record)

### Findings
- CONCERN: reimbursement_id not validated as required in POST
- NOTE: No GET by ID endpoint - only list with filter or via parent
- CONCERN: round_trip_miles has no validation (negative check?)
- GOOD: Can add entries after parent creation via direct POST

---

## Parent-Child Relationship Analysis

### Relationship Structure
```
mileage_reimbursements (parent)
    |
    +---> trip_entries (child, via reimbursement_id FK)
```

### Data Flow
1. Create mileage_reimbursement with optional trip_entries array
2. OR create mileage_reimbursement, then add trip_entries individually

### Query Pattern Comparison to status_logs

| Feature | status_logs | mileage_reimbursements |
|---------|-------------|------------------------|
| Nested POST | NO | YES (with N+1 issue) |
| Nested GET | NO | YES |
| Direct child POST | YES | YES |
| Direct child GET by ID | YES | NO |

### N+1 Query Problem (CRITICAL)

**Current Implementation:**
```javascript
for (const entry of trip_entries) {
  await sql`INSERT INTO trip_entries (...)`;  // N queries
}
```

**Recommended Batch Implementation:**
```javascript
if (trip_entries.length > 0) {
  const values = trip_entries.map((e, i) =>
    `($1, $${i*5+2}, $${i*5+3}, $${i*5+4}, $${i*5+5}, $${i*5+6})`
  ).join(', ');

  await sql`
    INSERT INTO trip_entries
    (reimbursement_id, trip_date, start_address, medical_facility, final_destination, round_trip_miles)
    VALUES ${values}
  `;  // 1 query
}
```

### Cascade Behavior
- **DELETE on mileage_reimbursements**: Does NOT cascade to entries
- **Risk**: Deleting a reimbursement leaves orphaned trip_entries
- **Recommendation**: Add ON DELETE CASCADE at database level or handle in API

---

## Cross-Table Findings

### Common Issues

1. **FK Validation Missing**
   - mileage_reimbursements: Neither incident_id nor employee_id validated
   - trip_entries: reimbursement_id not validated

2. **N+1 Insertion Pattern**
   - mileage_reimbursements POST loops through trip_entries
   - Each entry is a separate INSERT query
   - Should use batch INSERT for performance

3. **Cascade Delete Not Implemented**
   - Deleting parent (mileage_reimbursements) does not clean up children
   - Risk of orphaned trip_entries records

### Recommendations

1. Add required validation for:
   - mileage_reimbursements: incident_id, employee_id
   - trip_entries: reimbursement_id

2. **CRITICAL**: Convert N+1 loop to batch INSERT:
   ```sql
   INSERT INTO trip_entries (reimbursement_id, trip_date, ...) VALUES
     ($1, $2, ...),
     ($1, $3, ...),
     ...
   ```

3. Implement cascade delete or transaction-based cleanup

4. Add round_trip_miles validation (positive number, max limit)

5. Consider adding transaction wrapper for parent+children creation:
   ```javascript
   await sql.transaction(async (tx) => {
     const reimbursement = await tx`INSERT INTO mileage_reimbursements...`;
     await tx`INSERT INTO trip_entries VALUES ...batch...`;
     return reimbursement;
   });
   ```

---

*Audit completed: 2026-01-17*
