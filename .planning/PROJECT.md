# Claim-Flow-App

## What This Is

An incident management and worker's compensation claims platform with a web dashboard (React Router + Hono) and mobile app (Expo/React Native). Enables organizations to track workplace incidents, manage claims workflows, and maintain compliance through audit logging and role-based access control.

## Core Value

Complete, secure workflows from user onboarding through incident resolution — every user journey must work end-to-end with proper data integrity and authentication.

## Requirements

### Validated

<!-- Inferred from existing codebase -->

- ✓ User authentication with JWT tokens — existing
- ✓ Role-based access control (global_admin, standard) — existing
- ✓ Client isolation (users see only assigned clients) — existing
- ✓ Incident CRUD operations — existing
- ✓ Mobile app with offline sync queue — existing
- ✓ File upload via Uploadcare — existing
- ✓ Push notifications via Expo — existing
- ✓ Audit logging for entity changes — existing
- ✓ Interview/form data collection — existing
- ✓ Dashboard with analytics — existing

### Active

<!-- Current scope — preparing for production launch -->

- [ ] Fix security vulnerabilities (remove hardcoded backdoor, secure unauthenticated routes)
- [ ] Verify user onboarding workflow (registration → role assignment → client access)
- [ ] Verify incident lifecycle workflow (create → assign → investigate → resolve → close)
- [ ] Verify claims processing workflow (submission → review → approval)
- [ ] Audit database relationships (foreign keys properly linked)
- [ ] Verify API returns related data correctly (joins/includes)
- [ ] Fix mobile offline sync relationship issues
- [ ] Validate all navigation links and routes
- [ ] Ensure proper error handling throughout
- [ ] Production readiness checklist complete

### Out of Scope

<!-- Explicit boundaries for this launch -->

- Payment integration (Stripe/RevenueCat) — defer to post-launch
- New feature development — focus on fixing what exists
- Performance optimization — only if blocking launch

## Context

**Brownfield codebase** with existing functionality requiring security hardening and workflow verification before production launch.

**Critical security issues identified:**
- Hardcoded admin backdoor in `apps/web/src/app/api/auth/login/route.js` (lines 27-55)
- 10+ API routes missing `requireRole()` authentication

**Architecture:**
- Web: React Router 7 + Hono backend, Vite bundler
- Mobile: Expo SDK 53, React Native with file-based routing
- Database: Neon PostgreSQL (serverless)
- Auth: @auth/core with JWT strategy

**Codebase scope:**
- 28 API endpoints
- 12+ mobile screens
- Role-based access with client isolation

## Constraints

- **Security**: All routes must have proper authentication before launch
- **Data Integrity**: Relationships must be verified working across web and mobile
- **Workflows**: All user journeys must complete successfully end-to-end

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Defer payment integration | Focus on core functionality for launch | — Pending |
| Comprehensive planning depth | Complex brownfield codebase needs thorough coverage | — Pending |
| YOLO mode | User comfortable with auto-execution | — Pending |
| Parallel execution enabled | Speed up independent work streams | — Pending |

---
*Last updated: 2026-01-16 after initialization*
