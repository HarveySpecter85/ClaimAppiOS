# Task 1: Form Tables Audit (5 tables)

**Date:** 2026-01-17
**Tables Audited:** benefit_affidavits, medical_authorizations, refusal_of_treatments, prescription_cards, modified_duty_policies

## Summary

All 5 form tables follow a similar pattern:
- Each has incident_id as a foreign key to incidents table
- Each has a status field with draft/pending/submitted values
- Each has signature URL fields for document signing
- All use Neon PostgreSQL with tagged template SQL queries

---

## 1. benefit_affidavits

### API Routes
- `apps/web/src/app/api/benefit-affidavits/route.js` (GET, POST)
- `apps/web/src/app/api/benefit-affidavits/[id]/route.js` (GET, PUT, DELETE)

### Fields Observed
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | UUID | PK | Auto-generated |
| incident_id | UUID | YES | FK to incidents |
| incident_date | DATE | YES | Required in POST |
| date_signed | DATE | YES | Required in POST |
| current_address | TEXT | NO | Optional |
| employee_signature_url | TEXT | NO | Signature storage |
| employee_printed_name | TEXT | NO | Signer name |
| witness_signature_url | TEXT | NO | Witness signature |
| witness_printed_name | TEXT | NO | Witness name |
| status | TEXT | NO | Default: "pending" |
| created_at | TIMESTAMP | AUTO | Timestamp |
| updated_at | TIMESTAMP | AUTO | Timestamp |

### FK Verification
- **incident_id**: Required in POST (validated with `!incident_id` check)
- No explicit FK validation against incidents table at application level

### Status Validation
- POST: Defaults to "pending" if not provided
- PUT: No validation - accepts any string value

### Findings
- GOOD: incident_id is required in POST
- GOOD: Has signature URL fields for employee and witness
- CONCERN: No status enum validation in PUT (accepts any value)
- CONCERN: PUT uses dynamic query building - allowedFields whitelist is secure

---

## 2. medical_authorizations

### API Routes
- `apps/web/src/app/api/medical-authorizations/route.js` (GET, POST)
- `apps/web/src/app/api/medical-authorizations/[id]/route.js` (GET, PUT, DELETE)

### Fields Observed
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | UUID | PK | Auto-generated |
| incident_id | UUID | YES | FK to incidents |
| patient_name | TEXT | NO | Patient info |
| date_of_birth | DATE | NO | Patient DOB |
| incident_date | DATE | NO | Date of incident |
| provider | TEXT | NO | Medical provider |
| include_hiv_aids | BOOLEAN | NO | Default: false |
| include_mental_health | BOOLEAN | NO | Default: false |
| include_drug_alcohol | BOOLEAN | NO | Default: false |
| patient_initials | TEXT | NO | Authorization initials |
| signature_url | TEXT | NO | Signature storage |
| signed_by | TEXT | NO | Default: "patient" |
| signature_date | DATE | NO | Date signed |
| status | TEXT | NO | Default: "draft" |
| created_at | TIMESTAMP | AUTO | Timestamp |
| updated_at | TIMESTAMP | AUTO | Timestamp |

### FK Verification
- **incident_id**: Used in INSERT but NOT validated as required
- Query uses `${incident_id}` without null check

### Status Validation
- POST: Defaults to "draft" if not provided
- PUT: Uses COALESCE - no enum validation

### Findings
- CONCERN: incident_id not validated as required in POST
- GOOD: Has include_* booleans for HIPAA authorization options
- GOOD: signed_by field tracks who signed
- CONCERN: No status enum validation

---

## 3. refusal_of_treatments

### API Routes
- `apps/web/src/app/api/refusal-of-treatments/route.js` (GET, POST)
- `apps/web/src/app/api/refusal-of-treatments/[id]/route.js` (GET, PUT, DELETE)

### Fields Observed
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | UUID | PK | Auto-generated |
| incident_id | UUID | YES | FK to incidents |
| employee_name | TEXT | NO | Employee info |
| incident_date | DATE | NO | Date of incident |
| employer | TEXT | NO | Employer name |
| treatment_status | TEXT | NO | Treatment state |
| acknowledgment_text | TEXT | NO | Acknowledgment content |
| employee_signature_url | TEXT | NO | Signature storage |
| date_signed | DATE | NO | Date signed |
| status | TEXT | NO | Default: "draft" |
| created_at | TIMESTAMP | AUTO | Timestamp |
| updated_at | TIMESTAMP | AUTO | Timestamp |

### FK Verification
- **incident_id**: Used in INSERT but NOT validated as required

### Status Validation
- POST: Defaults to "draft" if not provided
- PUT: Uses COALESCE - no enum validation

### Findings
- CONCERN: incident_id not validated as required in POST
- CONCERN: treatment_status has no enum validation
- CONCERN: No status enum validation

---

## 4. prescription_cards

### API Routes
- `apps/web/src/app/api/prescription-cards/route.js` (GET, POST)
- `apps/web/src/app/api/prescription-cards/[id]/route.js` (GET, PUT, DELETE)

### Fields Observed
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | UUID | PK | Auto-generated |
| incident_id | UUID | YES | FK to incidents |
| patient_full_name | TEXT | NO | Patient name |
| date_of_birth | DATE | NO | Patient DOB |
| date_of_injury | DATE | NO | Injury date |
| bin_number | TEXT | NO | Pharmacy BIN |
| pcn | TEXT | NO | Processor Control Number |
| member_id | TEXT | NO | Member ID |
| group_name | TEXT | NO | Group name |
| group_id | TEXT | NO | Group ID |
| authorized_by | TEXT | NO | Authorizer name |
| investigator_signature_url | TEXT | NO | Signature storage |
| consent | BOOLEAN | NO | Default: false |
| status | TEXT | NO | Default: "draft" |
| created_at | TIMESTAMP | AUTO | Timestamp |
| updated_at | TIMESTAMP | AUTO | Timestamp |

### FK Verification
- **incident_id**: Used in INSERT but NOT validated as required

### Status Validation
- POST: Defaults to "draft" if not provided
- PUT: Uses COALESCE - no enum validation

### Findings
- CONCERN: incident_id not validated as required in POST
- GOOD: Has consent boolean for authorization
- GOOD: Contains prescription card details (BIN, PCN, etc.)
- CONCERN: No status enum validation

---

## 5. modified_duty_policies

### API Routes
- `apps/web/src/app/api/modified-duty-policies/route.js` (GET, POST)
- `apps/web/src/app/api/modified-duty-policies/[id]/route.js` (GET, PUT, DELETE)

### Fields Observed
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | UUID | PK | Auto-generated |
| incident_id | UUID | YES | FK to incidents |
| employee_name | TEXT | NO | Employee name |
| employer | TEXT | NO | Employer name |
| location | TEXT | NO | Work location |
| modified_position_offered | TEXT | NO | Position offered |
| date_offered | DATE | NO | Offer date |
| date_begins | DATE | NO | Start date |
| hourly_pay_rate | DECIMAL | NO | Pay rate |
| weekly_hours | DECIMAL | NO | Hours per week |
| shift_start | TIME | NO | Shift start time |
| shift_end | TIME | NO | Shift end time |
| duties_description | TEXT | NO | Duties details |
| decision | TEXT | NO | "accept" or "decline" |
| employee_signature_url | TEXT | NO | Employee signature |
| employee_signature_date | DATE | NO | Employee sign date |
| insured_rep_signature_url | TEXT | NO | Rep signature |
| insured_rep_signature_date | DATE | NO | Rep sign date |
| status | TEXT | NO | Default: "draft" |
| created_at | TIMESTAMP | AUTO | Timestamp |
| updated_at | TIMESTAMP | AUTO | Timestamp |

### FK Verification
- **incident_id**: Used in INSERT via `${body.incident_id}` but NOT validated

### Status/Decision Validation
- POST: decision validated to "accept" or "decline" (defaults to "accept")
- POST: status validated to "submitted" or "draft" (defaults to "draft")
- PUT: Same validation applied

### Findings
- BEST: Has enum validation for decision field
- BEST: Has enum validation for status field
- CONCERN: incident_id not validated as required in POST
- GOOD: Has dual signature fields (employee + insured rep)

---

## Cross-Table Findings

### Common Issues

1. **incident_id FK Validation**
   - Only benefit_affidavits validates incident_id as required
   - Other 4 tables insert without validating incident_id presence
   - Database likely has NOT NULL constraint, but API should validate

2. **Status Enum Validation**
   - Only modified_duty_policies validates status values
   - Other 4 tables accept any string for status
   - Recommendation: Add status enum validation to all tables

3. **Signature URL Fields**
   - All tables have appropriate signature URL fields
   - URLs likely stored in external storage (S3/Vercel Blob)
   - No URL validation at API level

### Recommendations

1. Add incident_id required validation to all 5 form table POST handlers
2. Implement status enum validation (draft/pending/submitted) across all tables
3. Consider adding FK existence check before insert (query incidents table)
4. Add URL format validation for signature URLs

---

*Audit completed: 2026-01-17*
