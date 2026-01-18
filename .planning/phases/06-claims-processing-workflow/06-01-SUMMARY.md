# Audit Summary: 06-01 Form Submission Workflow

## Audit Date
2026-01-17

## Scope
Audit of all claim form type POST endpoints, draft/submit workflow, and mobile submission flow.

---

## Task 1: Form Type POST Endpoint Audit

### 1. Benefit Affidavits (`/api/benefit-affidavits/route.js`)

**Findings:**
- **incident_id linkage**: PRESENT - Required field validated (line 54)
- **Required fields**: Validates `incident_id`, `incident_date`, `date_signed` only
- **Signature capture**: Accepts `employee_signature_url` and `witness_signature_url` but NOT validated as required
- **Status default**: Defaults to `"pending"` (line 51)

**Gaps:**
- No validation for signature fields - affidavit can be created without signatures
- Status default is `"pending"` instead of `"draft"` (inconsistent with other forms)
- No validation that `incident_id` exists in incidents table (FK not enforced at API level)

---

### 2. Mileage Reimbursements (`/api/mileage-reimbursements/route.js`)

**Findings:**
- **incident_id linkage**: PRESENT - Extracted from body (line 11)
- **Trip entries relationship**: PRESENT - Supports nested `trip_entries` array and inserts into `trip_entries` table (lines 30-44)
- **Signature capture**: Accepts `employee_signature_url` but NOT required
- **Status default**: Defaults to `"draft"` (line 15)

**Gaps:**
- No validation on any required fields before INSERT
- `incident_id` not validated to exist
- `employee_id` not validated to exist
- Trip entries inserted in a loop without transaction - partial inserts possible on failure

---

### 3. Prescription Cards (`/api/prescription-cards/route.js`)

**Findings:**
- **incident_id linkage**: PRESENT - Extracted from body (line 36)
- **Required fields**: NO required field validation before INSERT
- **Signature capture**: Accepts `investigator_signature_url` but NOT required
- **Consent field**: Defaults to `false` if not provided (line 78)
- **Status default**: Defaults to `"draft"` (line 79)

**Gaps:**
- No validation on any required fields (patient_name, date_of_birth, etc.)
- `incident_id` not validated to exist
- All fields nullable - can create essentially empty prescription card

---

### 4. Medical Authorizations (`/api/medical-authorizations/route.js`)

**Findings:**
- **incident_id linkage**: PRESENT - Extracted from body (line 34)
- **Consent fields**: PRESENT - `include_hiv_aids`, `include_mental_health`, `include_drug_alcohol` booleans (default to false)
- **Signature capture**: Accepts `signature_url` and `patient_initials` but NOT required
- **Status default**: Defaults to `"draft"` (line 77)

**Gaps:**
- No validation on any required fields before INSERT
- `incident_id` not validated to exist
- `signed_by` defaults to `"patient"` without validation of allowed values
- Patient consent for sensitive categories not required for submission

---

### 5. Refusal of Treatment (`/api/refusal-of-treatments/route.js`)

**Findings:**
- **incident_id linkage**: PRESENT - Extracted from body (line 33)
- **Acknowledgment field**: PRESENT - `acknowledgment_text` field (line 40)
- **Signature capture**: Accepts `employee_signature_url` but NOT required
- **Status default**: Defaults to `"draft"` (line 65)

**Gaps:**
- No validation on any required fields before INSERT
- Acknowledgment text not required - defeats purpose of refusal documentation
- Employee signature not required for what is legally a waiver document
- `incident_id` not validated to exist

---

### 6. Modified Duty Policies (`/api/modified-duty-policies/route.js`)

**Findings:**
- **incident_id linkage**: PRESENT - Extracted from body (line 69)
- **Decision workflow**: PRESENT - Validates `decision` to be "accept" or "decline" (line 45)
- **Status validation**: PRESENT - Validates `status` to be "draft" or "submitted" (line 46)
- **Signature capture**: Accepts `employee_signature_url` and `insured_rep_signature_url` but NOT required
- **Status default**: Defaults to `"draft"` (line 46)

**Gaps:**
- No other required field validation before INSERT
- Both signatures not required even for "submitted" status
- `incident_id` not validated to exist
- Only form with status enum validation - should be consistent across all forms

---

### 7. Status Logs (`/api/status-logs/route.js`)

**Findings:**
- **incident_id linkage**: PRESENT - Extracted from body (line 57)
- **employee_id linkage**: PRESENT - Extracted from body (line 58)
- **Weekly tracking**: PRESENT - `week_ending` field for weekly log tracking (line 59)
- **Status default**: Defaults to `"draft"` (line 67)

**Gaps:**
- No validation on required fields (`incident_id`, `employee_id`, `week_ending`)
- Neither `incident_id` nor `employee_id` validated to exist
- GET endpoint uses dynamic SQL construction (lines 13-28) - potential security concern with string interpolation

---

### 8. Trip Entries (`/api/trip-entries/route.js`)

**Findings:**
- **reimbursement_id linkage**: PRESENT - Required for linking to parent mileage reimbursement (line 11)
- **Fields**: `trip_date`, `start_address`, `medical_facility`, `final_destination`, `round_trip_miles`

**Gaps:**
- No validation on any required fields before INSERT
- `reimbursement_id` not validated to exist
- No status field - always created as-is
- No validation that `round_trip_miles` is a positive number

---

## Task 2: Draft/Submit Workflow Audit

### Status Transitions

**Findings:**
- Forms support `status` field with values typically: `"draft"`, `"submitted"`, `"pending"`
- **Benefit Affidavits**: Defaults to `"pending"` (inconsistent)
- **All other forms**: Default to `"draft"`
- **Modified Duty Policies**: Only form with status enum validation (lines 45-46)

### Validation Gaps

| Form Type | Required Field Validation | Status Enum Validation | Signature Required for Submit |
|-----------|---------------------------|------------------------|------------------------------|
| Benefit Affidavits | Partial (3 fields) | NO | NO |
| Mileage Reimbursements | NO | NO | NO |
| Prescription Cards | NO | NO | NO |
| Medical Authorizations | NO | NO | NO |
| Refusal of Treatment | NO | NO | NO |
| Modified Duty Policies | NO | YES | NO |
| Status Logs | NO | NO | N/A |
| Trip Entries | NO | N/A | N/A |

### Critical Issues
1. **No status transition validation** - Forms can be created directly as "submitted" without completing required fields
2. **No signature requirements** - Legal documents (affidavits, refusals, authorizations) don't require signatures
3. **Inconsistent status defaults** - Benefit Affidavits uses "pending" while others use "draft"
4. **No enum validation** - Status values not validated (except Modified Duty Policies)

---

## Task 3: Mobile Submission Flow Audit

### Mobile Form Screens Reviewed
- `apps/mobile/src/app/(tabs)/benefit-affidavit/[id].jsx`
- `apps/mobile/src/app/(tabs)/mileage-reimbursement/[id].jsx`
- `apps/mobile/src/app/(tabs)/prescription-card/[id].jsx`
- `apps/mobile/src/app/(tabs)/status-log/[id].jsx`
- `apps/mobile/src/app/(tabs)/medical-authorization/[id].jsx`
- `apps/mobile/src/app/(tabs)/refusal-of-treatment/[id].jsx`
- `apps/mobile/src/app/(tabs)/modified-duty-policy/[id].jsx`

### Offline Queue Support

**Findings:**
- **SyncContext.jsx**: Implements offline queue with AsyncStorage
- **Supported operations**: Currently only `SUBMIT_INCIDENT` type (line 134-141)
- **Queue behavior**: Items saved to `offline_queue` key, synced when online
- **Error handling**: Retries on failure, keeps failed items in queue

**Gaps:**
- **Limited offline support** - Only incident submission is queued for offline
- **Form submissions NOT supported offline** - All 8 form types require online connectivity
- **No offline indicator** - Forms don't warn user when offline
- **No local draft storage** - Form data lost if app closes before save

### Mobile Form-Specific Findings

1. **Mileage Reimbursement Mobile**:
   - Implements explicit "Save Draft" and "Submit" buttons (lines 859-898)
   - Client-side validation for signature and required fields before submit (lines 173-180)
   - Shows validation errors via Alert

2. **Benefit Affidavit Mobile**:
   - Single "Save" action (no draft/submit distinction)
   - No client-side validation beyond checking incident_date and date_signed

3. **Status Log Mobile**:
   - Implements "Submit Weekly Log" workflow (lines 163-193)
   - Confirmation dialog before submission

4. **Prescription Card Mobile**:
   - Uses custom hook `usePrescriptionCard` for state management
   - PDF generation support for printing

---

## Summary of Gaps Discovered

### High Priority
1. **Missing required field validation** on all form POST endpoints
2. **No signature requirements** for legal documents (affidavits, refusals, authorizations)
3. **Inconsistent status defaults** (benefit_affidavits uses "pending", others use "draft")
4. **No status transition enforcement** - can submit incomplete forms
5. **No foreign key validation** at API level for incident_id, employee_id, reimbursement_id

### Medium Priority
6. **Limited offline support** - only incidents supported, not form submissions
7. **No status enum validation** on 7 of 8 form types
8. **Trip entry insertion without transaction** - partial inserts possible

### Low Priority
9. **Dynamic SQL construction** in status-logs GET endpoint (security concern)
10. **No local draft storage** for mobile forms

---

## Phase 10 Recommendations

### P1: Critical Fixes
1. Add required field validation to all form POST endpoints
2. Require signatures for legal documents before allowing "submitted" status
3. Standardize status defaults to "draft" for all forms
4. Add status enum validation to all forms (draft, submitted, approved, rejected)
5. Add foreign key existence checks before INSERT operations

### P2: Important Improvements
6. Extend offline queue to support all form types
7. Add transaction wrapping for multi-table inserts (mileage + trip_entries)
8. Add status transition rules (draft -> submitted -> approved/rejected)
9. Add client-side offline detection with user notification

### P3: Nice to Have
10. Add local draft storage for mobile forms
11. Refactor status-logs GET to use parameterized queries
12. Add validation timestamps (draft_saved_at, submitted_at, approved_at)
