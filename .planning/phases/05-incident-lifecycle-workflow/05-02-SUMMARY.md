# Audit Summary: 05-02 Investigation Workflow

## Overview
This audit examined the investigation data collection APIs including interviews, evidence, and root cause analysis (RCA) workflows.

---

## Task 1: Interview Workflow

### Files Audited
- `apps/web/src/app/api/interviews/route.js`
- `apps/web/src/app/api/interviews/[id]/route.js`
- `apps/web/src/app/api/interviews/[id]/analyze/route.js`
- `apps/web/src/app/api/interview-witnesses/route.js`

### Findings

#### Interview Creation Linked to incident_id
**Status: VERIFIED**
- POST `/api/interviews` requires `incident_id` in request body (line 42)
- GET `/api/interviews` filters by `incident_id` query parameter (lines 8-16)
- Interview records are properly associated with incidents via `incident_id` field

#### AI Transcription/Analysis Flow
**Status: VERIFIED**
- POST `/api/interviews/[id]/analyze` implements full AI pipeline:
  1. Downloads media file from provided URL (lines 47-51)
  2. Transcribes using OpenAI Whisper API (`whisper-1` model) (lines 54-68)
  3. Stores transcription as `written_statement` in database (lines 82-86)
  4. Analyzes with GPT-4o to suggest evidence collection (lines 89-131)
- Graceful fallback with mock response when OPENAI_API_KEY not set (lines 23-43)
- Returns transcription text and AI-generated evidence suggestions

#### Witness Relationship
**Status: VERIFIED**
- `interview_witnesses` table linked via `interview_id` foreign key
- POST `/api/interview-witnesses` creates witness records with:
  - `interview_id` (required)
  - `witness_name` (required)
  - `witness_role` (optional)
- GET `/api/interviews/[id]` fetches witnesses in same query response (lines 26-32)

### Gaps Identified

1. **No Interview Date/Time Tracking**
   - Only `created_at` timestamp exists
   - No dedicated `interview_date` or `interview_time` fields
   - Cannot track when the actual interview occurred vs. when record was created

2. **No Interviewer Tracking**
   - No field to record who conducted the interview
   - Cannot audit who performed which interviews

3. **Empty Role Array for Authorization**
   - `requireRole(request, [])` allows any authenticated user
   - No role-based restrictions on interview operations

4. **No Interview Completion/Review Workflow**
   - Status field exists but no enforced workflow transitions
   - No supervisor review or sign-off mechanism

---

## Task 2: Evidence Collection

### Files Audited
- `apps/web/src/app/api/evidence/route.js`

### Findings

#### Evidence Linked to incident_id
**Status: VERIFIED**
- POST `/api/evidence` requires `incident_id` in request body (line 43)
- GET `/api/evidence` requires `incident_id` query parameter (line 8)
- All evidence queries filter by incident (line 11)

#### File Types Supported
**Status: DOCUMENTED**
- Evidence is categorized by `file_type` field
- GET endpoint supports filtering by `file_type` query parameter (lines 15-19)
- Supported types appear to be: photo, document, video (based on code patterns)
- `note_content` field allows text notes to be attached to evidence

### Gaps Identified

1. **No Chain of Custody Tracking**
   - No timestamp history for evidence handling
   - No tracking of who accessed/viewed evidence
   - No custody transfer records
   - No integrity verification (checksums)

2. **uploaded_by is String, Not FK**
   - `uploaded_by` field is plain text (line 49)
   - Not a foreign key reference to users/employees table
   - Cannot reliably link evidence to authenticated user who uploaded it
   - Cannot enforce referential integrity

3. **No Evidence Verification Status**
   - No field to mark evidence as verified/authenticated
   - No approval workflow for evidence

4. **No Evidence Categorization**
   - Beyond `file_type`, no way to categorize evidence (e.g., "scene photo", "equipment photo", "document")

5. **No Maximum File Size Enforcement**
   - `file_size` captured but no validation/limits

---

## Task 3: Root Cause Analysis

### Files Audited
- `apps/web/src/app/api/root-cause/route.js`
- `apps/web/src/app/api/root-cause/[id]/route.js`

### Findings

#### 5 Whys Structure
**Status: VERIFIED**
- `why_level` field supports 1-5 levels (lines 33, 16)
- GET endpoint orders results by `why_level` (line 16)
- Each level contains:
  - `problem_statement` - the problem being analyzed
  - `question` - the "why" question
  - `answer` - the response/finding
  - `supporting_evidence` - text reference to evidence
  - `conclusion` - root cause conclusion

#### Finalization Workflow
**Status: VERIFIED**
- `finalized` boolean field exists (lines 38, 47)
- PATCH endpoint allows setting `finalized` status (line 19)
- `conclusion` field captures final root cause determination

### Gaps Identified

1. **RCA Not Linked to Corrective Actions**
   - No foreign key or reference to corrective actions
   - Root cause findings are isolated from remediation
   - Cannot trace from RCA conclusion to implemented fixes

2. **supporting_evidence is Text, Not FK**
   - `supporting_evidence` is plain text field (line 36)
   - Not linked to evidence table records
   - Cannot programmatically verify supporting evidence exists

3. **No RCA Review/Approval Workflow**
   - `finalized` is a simple boolean
   - No approval by supervisor or safety manager
   - No review history or comments

4. **No Contributor Tracking**
   - No field recording who performed the RCA
   - No audit trail of who added/modified each "why" level

5. **Single Problem Statement Per Level**
   - Only one `problem_statement` per why level
   - Cannot handle branching root causes

---

## Additional Findings

### Messages API (Supporting Investigation)
- File: `apps/web/src/app/api/messages/route.js`
- Properly linked to incidents via `incident_id`
- Includes push notification integration
- No message threading or reply-to functionality

---

## Phase 10 Recommendations

### High Priority

1. **Add Chain of Custody for Evidence**
   - Create `evidence_custody_log` table
   - Track all access/transfers with timestamps and user IDs
   - Add integrity checksums for files

2. **Convert Text Fields to Foreign Keys**
   - `uploaded_by` in evidence table -> FK to users/employees
   - `supporting_evidence` in RCA -> FK or junction table to evidence

3. **Link RCA to Corrective Actions**
   - Create relationship between root_cause_analysis and corrective_actions tables
   - Enable traceability from root cause to remediation

### Medium Priority

4. **Add Interview Scheduling Fields**
   - Add `interview_date`, `interview_time`, `interviewer_id` columns
   - Enable proper scheduling and tracking

5. **Implement Role-Based Access Control**
   - Define specific roles for investigation operations
   - Replace empty role arrays with appropriate permission checks

6. **Add Approval Workflows**
   - Interview review status (supervisor sign-off)
   - Evidence verification status
   - RCA approval chain (investigator -> supervisor -> safety manager)

### Lower Priority

7. **Evidence Categorization**
   - Add `evidence_category` field or related lookup table
   - Enable better organization and reporting

8. **RCA Branching Support**
   - Consider supporting multiple branches in 5 Whys analysis
   - Add `parent_why_id` for hierarchical structure

9. **Audit Trail Enhancement**
   - Add `updated_by`, `updated_at` to all investigation tables
   - Create audit log for sensitive operations

---

## Verification Checklist

- [x] Interview workflow documented
- [x] Evidence collection documented
- [x] RCA workflow documented
- [x] Gaps identified for Phase 10
- [x] SUMMARY.md created with findings
