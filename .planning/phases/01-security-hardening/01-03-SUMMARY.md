---
phase: 01-security-hardening
plan: 03
status: complete
started: 2026-01-16
completed: 2026-01-16
---

# Plan 01-03 Summary: Secure Incident Investigation Routes

## Objective

Add authentication to incident-related and investigation routes (incidents, interviews, evidence, corrective-actions) to require valid JWT for all operations.

## Tasks Completed

### Task 1: Secure incident sub-routes and client detail route
- **Files modified:**
  - `apps/web/src/app/api/incidents/[id]/route.js` (GET, PATCH)
  - `apps/web/src/app/api/incidents/[id]/dossier/route.js` (GET)
  - `apps/web/src/app/api/clients/[id]/route.js` (GET, PUT, DELETE)
- **Commit:** `1e4c110`

### Task 2: Secure interview routes
- **Files modified:**
  - `apps/web/src/app/api/interviews/route.js` (GET, POST, PUT)
  - `apps/web/src/app/api/interviews/[id]/route.js` (GET, PATCH)
  - `apps/web/src/app/api/interviews/[id]/analyze/route.js` (POST)
  - `apps/web/src/app/api/interview-witnesses/route.js` (POST)
- **Commit:** `02d8ba7`

### Task 3: Secure evidence and corrective actions routes
- **Files modified:**
  - `apps/web/src/app/api/evidence/route.js` (GET, POST)
  - `apps/web/src/app/api/corrective-actions/route.js` (GET, POST)
  - `apps/web/src/app/api/corrective-actions/[id]/route.js` (PATCH)
- **Commit:** `7d95d16`

## Implementation Details

All routes use the consistent auth pattern:
```javascript
import { requireRole } from "@/app/api/utils/auth";

export async function HANDLER(request, { params }) {
  const { authorized, response, user } = await requireRole(request, []);
  if (!authorized) return response;
  // ... rest of handler
}
```

- All routes require any authenticated user (`requireRole(request, [])`)
- Params destructuring placed AFTER auth check for [id] routes
- Original SQL queries and business logic unchanged

## Verification

- [x] All 10 files have requireRole import
- [x] All handlers check authorization (16 total handlers)
- [x] No syntax errors
- [x] Params handling preserved for [id] routes

## Files Modified

1. `apps/web/src/app/api/incidents/[id]/route.js`
2. `apps/web/src/app/api/incidents/[id]/dossier/route.js`
3. `apps/web/src/app/api/clients/[id]/route.js`
4. `apps/web/src/app/api/interviews/route.js`
5. `apps/web/src/app/api/interviews/[id]/route.js`
6. `apps/web/src/app/api/interviews/[id]/analyze/route.js`
7. `apps/web/src/app/api/interview-witnesses/route.js`
8. `apps/web/src/app/api/evidence/route.js`
9. `apps/web/src/app/api/corrective-actions/route.js`
10. `apps/web/src/app/api/corrective-actions/[id]/route.js`

## Deviations

None - all tasks executed as specified in the plan.
