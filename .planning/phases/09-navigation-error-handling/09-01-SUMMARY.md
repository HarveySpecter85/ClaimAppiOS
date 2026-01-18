# 09-01: Web Navigation Audit Summary

**Audit Date:** 2026-01-17
**Status:** Complete
**Scope:** Audit only - Document gaps, defer fixes to Phase 10

---

## 1. Route Map

### Available Page Routes

| Route | File Path | Has Navigation Link | Notes |
|-------|-----------|---------------------|-------|
| `/` | `app/page.jsx` | Yes (Dashboard) | Main dashboard with stats |
| `/login` | `app/login/page.jsx` | No | Public auth page |
| `/reviews` | `app/reviews/page.jsx` | Yes (Reviews) | Incident review list |
| `/reviews/[id]` | `app/reviews/[id]/page.jsx` | Internal link | Review detail page |
| `/incidents/[id]/dossier` | `app/incidents/[id]/dossier/page.jsx` | Internal link | Incident dossier (print view) |
| `/settings` | `app/settings/page.jsx` | Yes (Settings) | Settings hub page |
| `/settings/users` | `app/settings/users/page.jsx` | Internal link | User management (Admin Panel) |
| `/settings/employees/import` | `app/settings/employees/import/page.jsx` | Internal link | Employee CSV import |
| `/share/[token]` | `app/share/[token]/page.jsx` | No | Public secure form landing |
| `/auto-login` | `app/auto-login/page.jsx` | No | Token-based auto login |
| `/admin/auto-login` | `app/admin/auto-login/page.jsx` | No | Admin token-based auto login |

### Dynamic Routes

| Pattern | Description |
|---------|-------------|
| `/reviews/[id]` | Review detail by incident ID |
| `/incidents/[id]/dossier` | Incident dossier by incident ID |
| `/share/[token]` | Secure form link by token |

---

## 2. Sidebar Navigation Verification

**Location:** `/apps/web/src/components/Sidebar.jsx`

| Sidebar Link | Target Route | Route Exists? | Status |
|--------------|--------------|---------------|--------|
| Dashboard | `/` | Yes | Valid |
| Incidents | `/incidents` | **NO** | **MISSING PAGE** |
| Reviews | `/reviews` | Yes | Valid |
| Settings | `/settings` | Yes | Valid |

### Missing Page: `/incidents`

The sidebar has a link to `/incidents` but there is **NO `page.jsx`** at `app/incidents/`. The only pages under `/incidents` are:
- `/incidents/[id]/dossier/page.jsx` - Dynamic route for dossier

**Impact:** Clicking "Incidents" in sidebar results in 404 or not-found page.

---

## 3. Internal Page Links Verification

### Dashboard (`/`) - page.jsx
- **No internal links** - Dashboard is display-only with stats

### Reviews List (`/reviews`) - page.jsx
| Link | Target | Valid? |
|------|--------|--------|
| Review button per row | `/reviews/${incident.id}` | Yes |

### Review Detail (`/reviews/[id]`) - page.jsx
| Link | Target | Valid? |
|------|--------|--------|
| Back button | `/reviews` | Yes |
| Download Dossier | `/incidents/${id}/dossier` (window.open) | Yes |

### Incident Dossier (`/incidents/[id]/dossier`) - page.jsx
| Link | Target | Valid? |
|------|--------|--------|
| Back button | `window.close()` | N/A (closes tab) |

### Settings (`/settings`) - page.jsx
| Link | Target | Valid? |
|------|--------|--------|
| Admin Panel | `/settings/users` | Yes (conditional: Global Admin only) |
| Employee Import | `/settings/employees/import` | Yes |
| Security Settings | None (Coming soon) | N/A |
| Organization Settings | None (Coming soon) | N/A |

### User Management (`/settings/users`) - page.jsx
- **No internal navigation links** - Actions are modals/inline

### Employee Import (`/settings/employees/import`) - page.jsx
- **No internal navigation links** - Self-contained form

### Login (`/login`) - page.jsx
| Link | Target | Valid? |
|------|--------|--------|
| Redirect on success | `/` | Yes (window.location.href) |

### Auto-Login Pages (`/auto-login`, `/admin/auto-login`) - page.jsx
| Link | Target | Valid? |
|------|--------|--------|
| Redirect on success | `/settings/users` | Yes |
| Go to Login button | `/login` | Yes |

### Share Form (`/share/[token]`) - page.jsx
- **No internal navigation links** - Public landing page

### Sidebar.jsx
| Link | Target | Valid? |
|------|--------|--------|
| Logout | `/login` (after API call) | Yes |

---

## 4. Orphan Routes (Pages with no navigation to them)

| Route | Reachable Via |
|-------|---------------|
| `/auto-login` | Direct URL with token (from mobile app) |
| `/admin/auto-login` | Direct URL with token (from mobile app) |
| `/share/[token]` | Direct URL (from secure link SMS/email) |

These are intentionally public/direct-access routes and are **not orphans** - they are accessed via external links.

---

## 5. Navigation Gaps Summary

### Critical Issues

1. **Missing `/incidents` Page**
   - **Severity:** High
   - **Issue:** Sidebar links to `/incidents` but no page exists
   - **User Impact:** 404 error when clicking "Incidents" in sidebar
   - **Fix Required:** Create `/app/incidents/page.jsx` with incident list

### Minor Issues

1. **No breadcrumb navigation**
   - Currently no breadcrumb components exist
   - Navigation relies on back buttons and sidebar

2. **Dossier page uses `window.close()`**
   - Back button on dossier closes tab instead of navigating
   - Works as designed (opens in new tab) but could be improved

3. **Settings "Coming Soon" items**
   - Security Settings and Organization Settings show as disabled
   - Not a navigation issue - intentional placeholder

---

## 6. Phase 10 Recommendations

### P1 - Must Fix

1. **Create `/incidents` page**
   - Add `apps/web/src/app/incidents/page.jsx`
   - Should display list of incidents (similar to reviews list)
   - Include link to dossier view for each incident

### P2 - Should Fix

2. **Add breadcrumb navigation**
   - Create reusable `Breadcrumbs` component
   - Add to review detail, dossier, settings sub-pages

3. **Improve dossier navigation**
   - Add proper back navigation instead of `window.close()`
   - Or keep current behavior but ensure parent page handles it gracefully

### P3 - Nice to Have

4. **Add "back to settings" link on settings sub-pages**
   - User management and employee import could have breadcrumb or back link

---

## Files Reviewed

- `/apps/web/src/components/Sidebar.jsx` - Navigation component
- `/apps/web/src/components/LayoutWrapper.jsx` - Layout with sidebar
- `/apps/web/src/app/routes.ts` - Route generation logic
- `/apps/web/src/app/page.jsx` - Dashboard
- `/apps/web/src/app/login/page.jsx` - Login
- `/apps/web/src/app/reviews/page.jsx` - Reviews list
- `/apps/web/src/app/reviews/[id]/page.jsx` - Review detail
- `/apps/web/src/app/incidents/[id]/dossier/page.jsx` - Incident dossier
- `/apps/web/src/app/settings/page.jsx` - Settings hub
- `/apps/web/src/app/settings/users/page.jsx` - User management
- `/apps/web/src/app/settings/employees/import/page.jsx` - Employee import
- `/apps/web/src/app/share/[token]/page.jsx` - Secure form landing
- `/apps/web/src/app/auto-login/page.jsx` - Auto login
- `/apps/web/src/app/admin/auto-login/page.jsx` - Admin auto login
