# Phase 7: API Data Validation - Summary

## Phase Goal
Verify all API endpoints return related data correctly with proper joins

## Audit Date
2026-01-17

## Scope
Audit only - Document all gaps, defer fixes to Phase 10

---

## Plans Completed

| Plan | Focus | Commit |
|------|-------|--------|
| 07-01 | Incident-Centric Endpoints | `cd8ffea` |
| 07-02 | Form-Related Endpoints | `9e93f2a` |
| 07-03 | Investigation Endpoints | (see audit) |
| 07-04 | Phase Verification | (this summary) |

---

## Endpoint Status Map

### Endpoints WITH Proper JOINs (Working)

| Endpoint | JOINs | Related Data Returned |
|----------|-------|----------------------|
| GET /api/incidents | employees, clients | employee_name, client_name, client_location |
| GET /api/incidents/[id] | employees, clients | Full employee & client details (ALL mobile fields) |
| GET /api/incidents/[id]/dossier | employees, clients | Full incident + child collections |
| GET /api/employees | clients | client_name |
| GET /api/dashboard/stats | employees, clients | Recent activity with names |
| GET /api/status-logs | employees, incidents | employee_name, incident_date |
| GET /api/interviews/[id] | incidents, employees | incident_number, employee_name, witnesses |

**Total: 7 endpoints properly implemented**

### Endpoints WITHOUT JOINs (Need Fixes)

| Endpoint | Missing JOINs | Impact |
|----------|---------------|--------|
| GET /api/benefit-affidavits | incidents, employees | Must fetch incident separately |
| GET /api/mileage-reimbursements | incidents, employees, trip_entries | N+1 problem for trip entries |
| GET /api/trip-entries | reimbursements | No parent context |
| GET /api/prescription-cards | incidents | Missing injury context |
| GET /api/medical-authorizations | incidents | Missing patient context |
| GET /api/refusal-of-treatments | incidents | Missing employee context |
| GET /api/modified-duty-policies | incidents | Missing incident context |
| GET /api/interviews (list) | incidents, employees | Only single interview has JOINs |
| GET /api/evidence | employees (uploaded_by) | Can't show who uploaded |
| GET /api/corrective-actions | employees (assignee_id) | Uses denormalized assignee_name |
| GET /api/root-cause | incidents | No incident context |
| GET /api/interview-witnesses | N/A | No GET endpoint exists |

**Total: 12 endpoints need improvements**

---

## Critical Gaps Consolidated

### HIGH Priority (Fix in Phase 10)

| Issue | Endpoints Affected | Impact |
|-------|-------------------|--------|
| Dashboard no client isolation | /api/dashboard/stats | Shows ALL incidents to any user |
| Interview list missing JOINs | /api/interviews | Inconsistent with single interview |
| Mileage missing trip entries | /api/mileage-reimbursements | N+1 query problem |
| Evidence missing uploaded_by name | /api/evidence | Can't show who uploaded |

### MEDIUM Priority

| Issue | Endpoints Affected | Impact |
|-------|-------------------|--------|
| 7 form endpoints missing JOINs | All form routes | Must fetch incident separately |
| Corrective actions denormalized | /api/corrective-actions | Stale data if names change |
| No witness listing endpoint | /api/interview-witnesses | Can only POST, not GET |
| Inconsistent data enrichment | List vs single endpoints | Different data shapes |

### LOW Priority

| Issue | Endpoints Affected | Impact |
|-------|-------------------|--------|
| Incident list missing employee_number | /api/incidents | Minor field missing in list view |
| PATCH returns raw data | /api/incidents/[id] | No JOINed fields after update |
| Dossier missing secondary_color | /api/incidents/[id]/dossier | Minor inconsistency |

---

## Data Validation Status by Category

### Incident-Centric (07-01)
```
✓ Incident list - JOINs working (minor gap: employee_number)
✓ Incident detail - ALL mobile fields present
✓ Incident dossier - All child collections included
⚠ Dashboard stats - Missing client isolation
```

### Form Endpoints (07-02)
```
✓ status-logs - Properly implemented (reference pattern)
✗ benefit-affidavits - No JOINs
✗ mileage-reimbursements - No JOINs, no trip entries
✗ trip-entries - No JOINs
✗ prescription-cards - No JOINs
✗ medical-authorizations - No JOINs
✗ refusal-of-treatments - No JOINs
✗ modified-duty-policies - No JOINs
```

### Investigation Endpoints (07-03)
```
✓ interviews/[id] - JOINs + witnesses working
✗ interviews (list) - No JOINs
✗ evidence - Missing uploaded_by name
✗ corrective-actions - Denormalized names
✗ root-cause - No context
✗ interview-witnesses - No GET endpoint
```

---

## Phase 10 Recommendations by Priority

### P0: Critical (Security/Data Access)
1. **Add client isolation to dashboard** - Currently shows ALL incidents to any user
2. **Add JOINs to interview list** - Match single interview endpoint pattern

### P1: High (User Experience)
3. **Add trip entries to mileage response** - Eliminate N+1 query problem
4. **Add uploaded_by name to evidence** - Show who uploaded files
5. **Add JOINs to benefit-affidavits** - High-frequency form

### P2: Medium (Consistency)
6. Add JOINs to remaining form endpoints (medical, refusal, modified-duty, prescription)
7. Add GET endpoint for interview-witnesses
8. Consider normalizing assignee_name in corrective-actions
9. Add incident context to root-cause

### P3: Low (Polish)
10. Add employee_number to incident list
11. Return JOINed data after PATCH operations
12. Standardize client_secondary_color across endpoints

---

## Reference Pattern: status-logs

The status-logs endpoint is the best reference for how form endpoints should work:

```sql
SELECT sl.*,
       e.full_name as employee_name,
       i.incident_date
FROM status_logs sl
LEFT JOIN employees e ON sl.employee_id = e.id
LEFT JOIN incidents i ON sl.incident_id = i.id
WHERE ...
ORDER BY sl.created_at DESC
```

This pattern should be applied to all 7 form endpoints that currently lack JOINs.

---

## Verification Checklist

- [x] Incident endpoints verified (list, detail, dossier, dashboard)
- [x] All 8 form endpoints audited (1 working, 7 need JOINs)
- [x] Investigation endpoints audited (interviews, evidence, corrective-actions, root-cause)
- [x] Gaps documented with severity (4 HIGH, 4 MEDIUM, 3 LOW)
- [x] Phase 10 recommendations prioritized (12 total)
- [x] STATE.md shows Phase 7 complete at 70%
- [x] ROADMAP.md shows 4/4 plans complete

---

## Statistics

| Metric | Count |
|--------|-------|
| Total endpoints audited | 19 |
| Endpoints with proper JOINs | 7 (37%) |
| Endpoints needing improvements | 12 (63%) |
| Critical issues found | 1 (dashboard isolation) |
| High priority fixes | 4 |
| Medium priority fixes | 4 |
| Low priority fixes | 3 |

---

## What Works Well

1. **Incident detail endpoint** - Returns ALL expected mobile fields with correct aliases
2. **Dossier endpoint** - Includes all child collections with witnesses properly attached
3. **status-logs endpoint** - Reference implementation with proper JOINs
4. **Single interview endpoint** - Includes incident, employee data, and witnesses
5. **LEFT JOINs** - Handle missing relations gracefully (return NULL, not error)

---

*Phase: 07-api-data-validation*
*Completed: 2026-01-17*
