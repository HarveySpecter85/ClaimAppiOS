# 09-02 Mobile Navigation Audit Summary

**Audit Date:** 2026-01-17
**Status:** Complete
**Phase:** 09 - Navigation & Error Handling

---

## 1. Tab Route Table

| Tab Name | Route File | Screen Name | Icon | Label | Status |
|----------|------------|-------------|------|-------|--------|
| Dashboard | `(tabs)/dashboard.jsx` | Dashboard | `Home` | `t("tab.home")` | EXISTS |
| Investigations | `(tabs)/investigations.jsx` | Investigations | `AlertTriangle` | `t("tab.incidents")` | EXISTS |
| New Incident | `(tabs)/new-incident.jsx` | NewIncident | `Plus` (FAB style) | (none) | EXISTS |
| Reports | `(tabs)/reports.jsx` | Reports | `FileText` | "Reviews" | EXISTS |
| Settings | `(tabs)/settings.jsx` | Settings | `Settings` | `t("tab.settings")` | EXISTS |

### Hidden Tab Routes (href: null)

These routes are registered in the tab layout but hidden from the tab bar:

| Route Name | Route File | Status |
|------------|------------|--------|
| `incident/[id]` | `(tabs)/incident/[id].jsx` | EXISTS |
| `interview/witness` | `(tabs)/interview/witness.jsx` | EXISTS |
| `interview/[id]` | `(tabs)/interview/[id].jsx` | EXISTS |
| `evidence/[id]` | `(tabs)/evidence/[id].jsx` | EXISTS |
| `root-cause/[id]` | `(tabs)/root-cause/[id].jsx` | EXISTS |
| `corrective-actions/[id]` | `(tabs)/corrective-actions/[id].jsx` | EXISTS |
| `benefit-affidavit/[id]` | `(tabs)/benefit-affidavit/[id].jsx` | EXISTS |
| `status-log/[id]` | `(tabs)/status-log/[id].jsx` | EXISTS |
| `medical-authorization/[id]` | `(tabs)/medical-authorization/[id].jsx` | EXISTS |
| `mileage-reimbursement/[id]` | `(tabs)/mileage-reimbursement/[id].jsx` | EXISTS |
| `modified-duty-policy/[id]` | `(tabs)/modified-duty-policy/[id].jsx` | EXISTS |
| `refusal-of-treatment/[id]` | `(tabs)/refusal-of-treatment/[id].jsx` | EXISTS |
| `prescription-card/[id]` | `(tabs)/prescription-card/[id].jsx` | EXISTS |
| `share-form` | `(tabs)/share-form.jsx` | EXISTS |

---

## 2. Stack Route Map

### Root Layout (`_layout.jsx`)

The root layout uses a `Stack` navigator with:
- `initialRouteName: "index"`
- `headerShown: false` for all screens

### Non-Tab Routes

| Route | File | Purpose |
|-------|------|---------|
| `/` (index) | `app/index.jsx` | Auth redirect - redirects to `/(tabs)/dashboard` or `/login` |
| `/login` | `app/login.jsx` | Login screen |
| `/clients` | `app/clients/index.jsx` | Clients list |
| `/clients/[id]` | `app/clients/[id].jsx` | Client form (new/edit) |
| `/panel-physicians` | `app/panel-physicians.jsx` | Panel physicians management |
| `+not-found` | `app/+not-found.tsx` | 404 Not Found screen |

### Deep Link Structure

```
claimflow://
  /                          -> Auth redirect
  /login                     -> Login
  /clients                   -> Clients list
  /clients/:id               -> Client detail
  /clients/new               -> New client (handled by [id].jsx with id="new")
  /panel-physicians          -> Panel physicians
  /(tabs)/
    /dashboard               -> Dashboard
    /investigations          -> Investigations list
    /new-incident            -> New incident form
    /reports                 -> Reports (placeholder)
    /settings                -> Settings
    /incident/:id            -> Incident detail
    /interview/:id           -> Interview form
    /interview/witness       -> Witness interview form
    /evidence/:id            -> Evidence collection
    /root-cause/:id          -> Root cause analysis
    /corrective-actions/:id  -> Corrective actions
    /benefit-affidavit/:id   -> Benefit affidavit form
    /status-log/:id          -> Status log
    /medical-authorization/:id -> Medical authorization
    /prescription-card/:id   -> Prescription card
    /mileage-reimbursement/:id -> Mileage reimbursement
    /modified-duty-policy/:id -> Modified duty policy
    /refusal-of-treatment/:id -> Refusal of treatment
    /share-form              -> Share form link generator
```

---

## 3. Navigation Calls Verification Table

| File | Navigation Call | Target Route | Route Exists |
|------|-----------------|--------------|--------------|
| `dashboard.jsx:760` | `router.push("/(tabs)/new-incident")` | `/(tabs)/new-incident` | YES |
| `investigations.jsx:187` | `router.push(\`/(tabs)/incident/${id}\`)` | `/(tabs)/incident/[id]` | YES |
| `incident/[id].jsx:171` | `router.push(\`/interview/${id}\`)` | `/interview/[id]` | **ISSUE** - Missing leading `/(tabs)` |
| `incident/[id].jsx:172` | `router.push(\`/(tabs)/evidence/${id}\`)` | `/(tabs)/evidence/[id]` | YES |
| `incident/[id].jsx:173` | `router.push(\`/(tabs)/root-cause/${id}\`)` | `/(tabs)/root-cause/[id]` | YES |
| `incident/[id].jsx:177` | `router.push(\`/(tabs)/corrective-actions/${id}\`)` | `/(tabs)/corrective-actions/[id]` | YES |
| `incident/[id].jsx:220-258` | Various form routes | All `/(tabs)/...` | YES |
| `incident/[id].jsx:802` | `router.push(\`/(tabs)/share-form?...\`)` | `/(tabs)/share-form` | YES |
| `settings.jsx:174` | `router.push("/clients")` | `/clients` | YES |
| `settings.jsx:496` | `router.push("/panel-physicians")` | `/panel-physicians` | YES |
| `login.jsx:64-66` | `router.replace("/(tabs)/dashboard")` | `/(tabs)/dashboard` | YES |
| `clients/index.jsx:83` | `router.push("/clients/new")` | `/clients/new` | **MISSING** |
| `clients/index.jsx:113` | `router.push(\`/clients/${id}\`)` | `/clients/[id]` | YES |
| `interview/[id].jsx:113` | `router.push({pathname: "/(tabs)/interview/witness", ...})` | `/(tabs)/interview/witness` | YES |
| `useIncidentForm.js:138` | `router.push(\`/(tabs)/incident/${id}\`)` | `/(tabs)/incident/[id]` | YES |
| `useIncidentForm.js:162` | `router.push("/(tabs)/dashboard")` | `/(tabs)/dashboard` | YES |
| `index.jsx:19` | `<Redirect href="/(tabs)/dashboard" />` | `/(tabs)/dashboard` | YES |
| `index.jsx:21` | `<Redirect href="/login" />` | `/login` | YES |
| `+not-found.tsx:80` | `router.replace('../(tabs)/index.jsx')` | Relative path | N/A |

---

## 4. Missing Routes List

### Critical Issues

1. **`/clients/new` - MISSING ROUTE FILE**
   - **Location:** Referenced in `clients/index.jsx:83`
   - **Current Behavior:** The `[id].jsx` file handles both new and edit by checking if `id === "new"`
   - **Impact:** Works correctly via the dynamic route, but route pattern is unconventional
   - **Recommendation:** This is working as designed - the `[id].jsx` file checks for `id === "new"` and renders a new client form

2. **`/interview/[id]` - INCONSISTENT PATH PREFIX**
   - **Location:** `incident/[id].jsx:171`
   - **Issue:** Route is defined as `/(tabs)/interview/[id]` but navigation uses `/interview/${id}` (missing `(tabs)` prefix)
   - **Impact:** May cause navigation failures or fall to `+not-found`
   - **Recommendation:** Update to `/(tabs)/interview/${id}` for consistency

### Non-Critical Observations

3. **Reports Screen is Placeholder**
   - The `reports.jsx` screen shows "Reports Coming Soon" with no functionality
   - Tab is labeled "Reviews" but file is `reports.jsx`
   - Recommendation: Consider hiding tab or implementing feature

4. **Settings Back Button**
   - Settings screen has a back button that calls `router.back()`
   - If user navigates directly to settings, back may behave unexpectedly
   - Minor UX issue, not a navigation bug

---

## 5. Navigation Dead-Ends

| Screen | Issue | Description |
|--------|-------|-------------|
| `reports.jsx` | Placeholder | "Coming Soon" - no actionable navigation |
| `+not-found.tsx` | Expected | Proper 404 handling with navigation to available routes |

---

## 6. Back Navigation Patterns

All detail screens correctly implement back navigation using:
- `router.back()` - Standard back navigation
- `<ChevronLeft>` icon with touchable area

### Screens with Back Navigation

- `incident/[id].jsx` - Header back button
- `interview/[id].jsx` - Via `InterviewHeader` component
- `evidence/[id].jsx` - Header back button
- `clients/index.jsx` - Header back button
- `clients/[id].jsx` - Header back button
- `panel-physicians.jsx` - Header back button
- `settings.jsx` - Header back button
- `share-form.jsx` - Cancel button (calls `router.back()`)
- `+not-found.tsx` - Back button with fallback to index

---

## 7. Phase 10 Recommendations

### High Priority

1. **Fix Interview Route Path**
   - Update `incident/[id].jsx` line 171 from `/interview/${id}` to `/(tabs)/interview/${id}`
   - Ensures consistent navigation within the tabs group

### Medium Priority

2. **Implement Reports Screen**
   - Replace placeholder with actual reporting functionality
   - Or hide the tab until feature is ready

3. **Add Type Safety for Routes**
   - Consider using expo-router's typed routes feature
   - Create a `routes.ts` constants file for navigation targets

### Low Priority

4. **Improve 404 Experience**
   - The `+not-found.tsx` is comprehensive but uses web-focused messaging
   - Consider mobile-friendly copy for native users

5. **Add Navigation Analytics**
   - Track navigation patterns for UX optimization
   - Identify common navigation failures

---

## Audit Conclusion

The mobile navigation structure is **well-organized** with:
- Clear tab/stack separation
- Comprehensive hidden routes for detail screens
- Proper back navigation throughout
- Good deep link support

**One critical issue** identified:
- The interview route in `incident/[id].jsx` uses an inconsistent path format

**All other navigation calls verify successfully** against existing route files.

---

*Audit completed by: Claude Opus 4.5*
*Next Phase: 09-03 (Error Handling)*
