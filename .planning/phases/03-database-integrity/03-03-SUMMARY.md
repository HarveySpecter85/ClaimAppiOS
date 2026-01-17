# Plan 03-03: Form Tables Audit Summary

**Completed:** 2026-01-17
**Tables Audited:** 9 (benefit_affidavits, medical_authorizations, refusal_of_treatments, prescription_cards, modified_duty_policies, status_logs, status_log_entries, mileage_reimbursements, trip_entries)

## Executive Summary

Audited 9 form and documentation tables across 3 categories:
1. **5 Form Tables** - All link to incidents via incident_id FK
2. **Status Logs** - Parent-child pair (status_logs -> status_log_entries)
3. **Mileage Tables** - Parent-child pair (mileage_reimbursements -> trip_entries)

### Critical Finding
**N+1 Insertion Pattern** in mileage_reimbursements POST - creates trip entries in a loop instead of batch INSERT.

---

## Verification Checklist

- [x] 5 form tables audited (benefit, medical, refusal, prescription, modified duty)
- [x] status_logs and status_log_entries audited
- [x] mileage_reimbursements and trip_entries audited
- [x] All incident_id FKs verified
- [x] Parent-child relationships documented

---

## FK Verification Results

### Form Tables (incident_id FK)

| Table | incident_id Required | Validation |
|-------|---------------------|------------|
| benefit_affidavits | YES | Validated in POST |
| medical_authorizations | NO | Not validated |
| refusal_of_treatments | NO | Not validated |
| prescription_cards | NO | Not validated |
| modified_duty_policies | NO | Not validated |

### Parent-Child Tables

| Parent Table | FK Fields | Validated |
|--------------|-----------|-----------|
| status_logs | incident_id, employee_id | Neither validated |
| mileage_reimbursements | incident_id, employee_id | Neither validated |

| Child Table | FK Field | Validated |
|-------------|----------|-----------|
| status_log_entries | status_log_id | Not validated |
| trip_entries | reimbursement_id | Not validated |

---

## Parent-Child Relationship Documentation

### 1. status_logs -> status_log_entries

```
status_logs (parent)
├── incident_id FK
├── employee_id FK
└── status_log_entries (child)
    └── status_log_id FK
```

**Characteristics:**
- Entries created individually via POST /api/status-log-entries
- Entries fetched separately (not nested in parent GET)
- No cascade delete implemented
- Status defaults: parent="draft", child="pending"

### 2. mileage_reimbursements -> trip_entries

```
mileage_reimbursements (parent)
├── incident_id FK
├── employee_id FK
└── trip_entries (child)
    └── reimbursement_id FK
```

**Characteristics:**
- Entries can be created nested in parent POST (N+1 pattern)
- Entries nested in parent GET response
- No cascade delete implemented
- Two creation paths: nested or direct POST

---

## Findings by Category

### High Priority (Performance/Data Integrity)

1. **N+1 Insertion Pattern** (mileage_reimbursements)
   - Location: `apps/web/src/app/api/mileage-reimbursements/route.js`
   - Issue: Loop with individual INSERTs for trip entries
   - Impact: Performance degradation with many entries
   - Fix: Use batch INSERT or PostgreSQL unnest

2. **Missing FK Validation** (8 of 9 tables)
   - Only benefit_affidavits validates incident_id
   - All parent tables missing employee_id validation
   - All child tables missing parent FK validation
   - Risk: Invalid FK values could be inserted

3. **No Cascade Delete** (both parent-child pairs)
   - DELETE on parent does not remove children
   - Risk: Orphaned records in database
   - Fix: Add ON DELETE CASCADE or API-level cleanup

### Medium Priority (Validation)

4. **Status Enum Validation** (7 of 9 tables)
   - Only modified_duty_policies validates status values
   - All others accept any string for status
   - Fix: Add allowlist validation

5. **Decision Enum Validation** (1 table)
   - modified_duty_policies validates decision field
   - Other tables with enum-like fields don't validate

### Low Priority (Data Quality)

6. **Numeric Validation Missing**
   - pain_scale in status_log_entries (should be 1-10)
   - round_trip_miles in trip_entries (should be positive)

7. **Signature URL Validation Missing**
   - All tables store signature URLs without format validation
   - Low risk if storage handles validation

---

## Table-by-Table Summary

### Form Tables (5)

| Table | Fields | Status Default | Signature Fields |
|-------|--------|----------------|------------------|
| benefit_affidavits | 11 | "pending" | employee, witness |
| medical_authorizations | 14 | "draft" | patient |
| refusal_of_treatments | 10 | "draft" | employee |
| prescription_cards | 14 | "draft" | investigator |
| modified_duty_policies | 18 | "draft" | employee, insured_rep |

### Parent-Child Tables (4)

| Table | Type | FK Count | Nested Response |
|-------|------|----------|-----------------|
| status_logs | Parent | 2 | No |
| status_log_entries | Child | 1 | No |
| mileage_reimbursements | Parent | 2 | Yes |
| trip_entries | Child | 1 | Yes (in parent GET) |

---

## Recommendations

### Immediate Actions

1. **Fix N+1 Pattern** (Critical)
   ```javascript
   // Replace loop with batch INSERT
   const values = trip_entries.map(e => [
     reimbursement.id, e.trip_date, e.start_address,
     e.medical_facility, e.final_destination, e.round_trip_miles
   ]);
   await sql`INSERT INTO trip_entries ... SELECT * FROM unnest(${values})`;
   ```

2. **Add FK Validation** (High)
   - Add required checks for incident_id in all form table POSTs
   - Add required checks for employee_id in parent tables
   - Add required checks for parent FK in child tables

3. **Implement Cascade Delete** (High)
   - Option A: Database-level `ON DELETE CASCADE`
   - Option B: API-level transaction with explicit deletes

### Future Improvements

4. **Status Enum Validation**
   - Define valid status values per table
   - Validate in POST and PUT handlers

5. **Transaction Wrappers**
   - Wrap parent+child creation in transactions
   - Ensure atomicity of nested operations

6. **Nested Fetch Options**
   - Add `?include=entries` to status-logs GET
   - Standardize nested response patterns

---

## Detailed Audit Notes

- Task 1: `.planning/phases/03-database-integrity/audit-notes/03-03-task1-form-tables.md`
- Task 2: `.planning/phases/03-database-integrity/audit-notes/03-03-task2-status-logs.md`
- Task 3: `.planning/phases/03-database-integrity/audit-notes/03-03-task3-mileage.md`

---

## Commits

1. `audit(03-03): verify 5 form tables FK and status validation`
2. `audit(03-03): verify status_logs and status_log_entries parent-child relationship`
3. `audit(03-03): verify mileage_reimbursements and trip_entries parent-child relationship`

---

*Plan 03-03 completed: 2026-01-17*
