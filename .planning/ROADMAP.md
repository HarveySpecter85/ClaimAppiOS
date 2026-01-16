# Roadmap: Claim-Flow-App

## Overview

Prepare Claim-Flow-App for production launch by fixing critical security vulnerabilities, verifying all workflows work end-to-end, auditing database relationships, and completing a production readiness checklist. This is hardening and verification work on an existing brownfield codebase.

## Domain Expertise

None

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [ ] **Phase 1: Security Hardening** - Remove backdoor, secure all unauthenticated routes
- [ ] **Phase 2: Authentication Audit** - Verify JWT flow, session management, role assignment
- [ ] **Phase 3: Database Integrity** - Audit foreign keys, relationships, constraints
- [ ] **Phase 4: User Onboarding Workflow** - Registration → role assignment → client access
- [ ] **Phase 5: Incident Lifecycle Workflow** - Create → assign → investigate → resolve → close
- [ ] **Phase 6: Claims Processing Workflow** - Submission → review → approval flow
- [ ] **Phase 7: API Data Validation** - Verify joins/includes return related data correctly
- [ ] **Phase 8: Mobile Sync Verification** - Fix offline sync relationship issues
- [ ] **Phase 9: Navigation & Error Handling** - Validate routes, links, error states
- [ ] **Phase 10: Production Readiness** - Final checklist, deployment verification

## Phase Details

### Phase 1: Security Hardening
**Goal**: Remove hardcoded admin backdoor and add authentication to all unprotected API routes
**Depends on**: Nothing (first phase — critical security)
**Research**: Unlikely (internal code fixes, existing auth patterns)
**Plans**: TBD

### Phase 2: Authentication Audit
**Goal**: Verify JWT token flow, session management, and role assignment work correctly
**Depends on**: Phase 1
**Research**: Unlikely (verify existing @auth/core setup)
**Plans**: TBD

### Phase 3: Database Integrity
**Goal**: Audit all foreign keys, relationships, and constraints in PostgreSQL schema
**Depends on**: Phase 1
**Research**: Unlikely (existing Neon PostgreSQL, schema verification)
**Plans**: TBD

### Phase 4: User Onboarding Workflow
**Goal**: Verify complete user journey: registration → role assignment → client access
**Depends on**: Phase 2, Phase 3
**Research**: Unlikely (verify existing flow works end-to-end)
**Plans**: TBD

### Phase 5: Incident Lifecycle Workflow
**Goal**: Verify complete incident journey: create → assign → investigate → resolve → close
**Depends on**: Phase 4
**Research**: Unlikely (verify existing flow works end-to-end)
**Plans**: TBD

### Phase 6: Claims Processing Workflow
**Goal**: Verify claims journey: submission → review → approval
**Depends on**: Phase 5
**Research**: Unlikely (verify existing flow works end-to-end)
**Plans**: TBD

### Phase 7: API Data Validation
**Goal**: Verify all API endpoints return related data correctly with proper joins
**Depends on**: Phase 3
**Research**: Unlikely (internal verification of existing queries)
**Plans**: TBD

### Phase 8: Mobile Sync Verification
**Goal**: Fix offline sync relationship issues and verify SyncContext works correctly
**Depends on**: Phase 7
**Research**: Unlikely (existing SyncContext patterns)
**Plans**: TBD

### Phase 9: Navigation & Error Handling
**Goal**: Validate all navigation links, routes, and error states across web and mobile
**Depends on**: Phase 8
**Research**: Unlikely (internal patterns already established)
**Plans**: TBD

### Phase 10: Production Readiness
**Goal**: Complete production checklist — environment config, monitoring, final verification
**Depends on**: All previous phases
**Research**: Unlikely (checklist verification, no new tech)
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Security Hardening | 0/TBD | Not started | - |
| 2. Authentication Audit | 0/TBD | Not started | - |
| 3. Database Integrity | 0/TBD | Not started | - |
| 4. User Onboarding Workflow | 0/TBD | Not started | - |
| 5. Incident Lifecycle Workflow | 0/TBD | Not started | - |
| 6. Claims Processing Workflow | 0/TBD | Not started | - |
| 7. API Data Validation | 0/TBD | Not started | - |
| 8. Mobile Sync Verification | 0/TBD | Not started | - |
| 9. Navigation & Error Handling | 0/TBD | Not started | - |
| 10. Production Readiness | 0/TBD | Not started | - |
