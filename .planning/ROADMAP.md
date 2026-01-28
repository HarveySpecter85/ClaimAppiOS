
# Roadmap: Claim-Flow-App

## Overview

Prepare Claim-Flow-App for production launch by fixing critical security vulnerabilities, verifying all workflows work end-to-end, auditing database relationships, and completing a production readiness checklist. This is hardening and verification work on an existing brownfield codebase.

## Domain Expertise

None

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [x] **Phase 1: Security Hardening** - Remove backdoor, secure all unauthenticated routes
- [x] **Phase 2: Authentication Audit** - Verify JWT flow, session management, role assignment
- [x] **Phase 3: Database Integrity** - Audit foreign keys, relationships, constraints
- [x] **Phase 4: User Onboarding Workflow** - Registration → role assignment → client access
- [x] **Phase 5: Incident Lifecycle Workflow** - Create → assign → investigate → resolve → close
- [x] **Phase 6: Claims Processing Workflow** - Submission → review → approval flow
- [x] **Phase 7: API Data Validation** - Verify joins/includes return related data correctly
- [x] **Phase 8: Mobile Sync Verification** - Fix offline sync relationship issues
- [x] **Phase 9: Navigation & Error Handling** - Validate routes, links, error states
- [ ] **Phase 10: Production Readiness** - Final checklist, deployment verification

## Phase Details

### Phase 1: Security Hardening
**Goal**: Remove hardcoded admin backdoor and add authentication to all unprotected API routes
**Depends on**: Nothing (first phase — critical security)
**Research**: Unlikely (internal code fixes, existing auth patterns)
**Plans**: 5 plans

Plans:
- [x] 01-01: Remove hardcoded admin backdoor from login route
- [x] 01-02: Secure core entity routes (clients, employees, admin-users, audit-logs, job-positions, messages)
- [x] 01-03: Secure incident and investigation routes (incidents, interviews, evidence, corrective-actions)
- [x] 01-04: Secure document/form routes (benefits, medical, prescriptions, mileage, policies)
- [x] 01-05: Secure remaining routes and verify complete coverage

### Phase 2: Authentication Audit
**Goal**: Verify JWT token flow, session management, and role assignment work correctly
**Depends on**: Phase 1
**Research**: Unlikely (verify existing @auth/core setup)
**Plans**: 4 plans

Plans:
- [x] 02-01: Audit JWT token generation and validation (login, requireRole middleware)
- [x] 02-02: Audit session management (web cookies, mobile SecureStore, logout)
- [x] 02-03: Audit role assignment and role checking (admin-users, client-roles, RBAC)
- [x] 02-04: Audit temporary access flow and complete phase verification

### Phase 3: Database Integrity
**Goal**: Audit all foreign keys, relationships, and constraints in PostgreSQL schema
**Depends on**: Phase 1
**Research**: Unlikely (existing Neon PostgreSQL, schema verification)
**Plans**: 4 plans

Plans:
- [x] 03-01: Audit core tables (admin_users, user_client_roles, clients, employees)
- [x] 03-02: Audit incident and investigation tables (incidents, interviews, root_cause_analysis, corrective_actions)
- [x] 03-03: Audit form and documentation tables (forms, status_logs, mileage)
- [x] 03-04: Audit remaining tables and complete phase verification

### Phase 4: User Onboarding Workflow
**Goal**: Verify complete user journey: registration → role assignment → client access
**Depends on**: Phase 2, Phase 3
**Research**: Unlikely (verify existing flow works end-to-end)
**Plans**: 4 plans

Plans:
- [x] 04-01: Audit user creation and password flow
- [x] 04-02: Audit role assignment flow
- [x] 04-03: Audit client access enforcement
- [x] 04-04: Complete phase verification

### Phase 5: Incident Lifecycle Workflow
**Goal**: Verify complete incident journey: create → assign → investigate → resolve → close
**Depends on**: Phase 4
**Research**: Unlikely (verify existing flow works end-to-end)
**Plans**: 4 plans

Plans:
- [x] 05-01: Audit incident creation and assignment
- [x] 05-02: Audit investigation workflow
- [x] 05-03: Audit resolution and closure flow
- [x] 05-04: Complete phase verification

### Phase 6: Claims Processing Workflow
**Goal**: Verify claims journey: submission → review → approval
**Depends on**: Phase 5
**Research**: Unlikely (verify existing flow works end-to-end)
**Plans**: 4 plans

Plans:
- [x] 06-01: Audit form submission workflow (7 form types)
- [x] 06-02: Audit review and approval flow
- [x] 06-03: Audit status tracking and audit trail
- [x] 06-04: Complete phase verification

### Phase 7: API Data Validation
**Goal**: Verify all API endpoints return related data correctly with proper joins
**Depends on**: Phase 3
**Research**: Unlikely (internal verification of existing queries)
**Plans**: 4 plans

Plans:
- [x] 07-01: Audit incident-centric endpoints (list, detail, dossier, dashboard)
- [x] 07-02: Audit form-related endpoints (8 form types)
- [x] 07-03: Audit investigation endpoints (interviews, evidence, corrective-actions)
- [x] 07-04: Complete phase verification

### Phase 8: Mobile Sync Verification
**Goal**: Fix offline sync relationship issues and verify SyncContext works correctly
**Depends on**: Phase 7
**Research**: Unlikely (existing SyncContext patterns)
**Plans**: 4 plans

Plans:
- [x] 08-01: Audit SyncContext core functionality (sync flow, error handling)
- [x] 08-02: Audit offline queue and persistence (AsyncStorage, queue items)
- [x] 08-03: Audit relationship integrity during sync (employee, client, incident)
- [x] 08-04: Complete phase verification

### Phase 9: Navigation & Error Handling
**Goal**: Validate all navigation links, routes, and error states across web and mobile
**Depends on**: Phase 8
**Research**: Unlikely (internal patterns already established)
**Plans**: 4 plans

Plans:
- [x] 09-01: Audit web navigation (sidebar links, route structure, broken links)
- [x] 09-02: Audit mobile navigation (tabs, stack navigation, router.push calls)
- [x] 09-03: Audit error handling patterns (404/500 pages, error boundaries, loading states)
- [x] 09-04: Complete phase verification

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
| 1. Security Hardening | 5/5 | Complete | 2026-01-16 |
| 2. Authentication Audit | 4/4 | Complete | 2026-01-17 |
| 3. Database Integrity | 4/4 | Complete | 2026-01-17 |
| 4. User Onboarding Workflow | 4/4 | Complete | 2026-01-17 |
| 5. Incident Lifecycle Workflow | 4/4 | Complete | 2026-01-17 |
| 6. Claims Processing Workflow | 4/4 | Complete | 2026-01-17 |
| 7. API Data Validation | 4/4 | Complete | 2026-01-17 |
| 8. Mobile Sync Verification | 4/4 | Complete | 2026-01-17 |
| 9. Navigation & Error Handling | 4/4 | Complete | 2026-01-17 |
| 10. Production Readiness | 0/TBD | Not started | - |
