# Codebase Concerns

**Analysis Date:** 2026-01-16

## Tech Debt

**Missing Authorization on API Routes:**
- Issue: 10+ API routes lack `requireRole()` authentication checks
- Files:
  - `apps/web/src/app/api/audit-logs/route.js`
  - `apps/web/src/app/api/benefit-affidavits/route.js`
  - `apps/web/src/app/api/clients/route.js`
  - `apps/web/src/app/api/corrective-actions/route.js`
  - `apps/web/src/app/api/evidence/route.js`
  - `apps/web/src/app/api/interview-witnesses/route.js`
  - `apps/web/src/app/api/interviews/route.js`
  - `apps/web/src/app/api/job-positions/route.js`
  - `apps/web/src/app/api/medical-authorizations/route.js`
  - `apps/web/src/app/api/messages/route.js`
- Why: Rapid development, inconsistent security patterns
- Impact: Unauthorized data access, data modification
- Fix approach: Add `requireRole()` to all API routes, create middleware wrapper

**Inconsistent Error Response Formats:**
- Issue: Some routes return `Response.json({ error })`, others return `new Response()`
- Files: Throughout `apps/web/src/app/api/`
- Why: Different developers, no enforced pattern
- Impact: Frontend must handle multiple error formats
- Fix approach: Create standard error response helper

**Large Component File:**
- Issue: Settings component is 850+ lines
- File: `apps/mobile/src/app/(tabs)/settings.jsx`
- Why: Accumulated features without refactoring
- Impact: Hard to maintain, test, and modify
- Fix approach: Extract into smaller feature components

## Known Bugs

**Settings Form Not Persisting:**
- Symptoms: User changes in settings are lost on app restart
- Trigger: Change any setting, close and reopen app
- File: `apps/mobile/src/app/(tabs)/settings.jsx` (line 38-45)
- Workaround: None - data always resets
- Root cause: Settings initialized with dummy data, no save implementation
- Fix: Implement AsyncStorage persistence for settings

**TODO: Implement Save Functionality:**
- Symptoms: Save button exists but does nothing
- File: `apps/mobile/src/app/(tabs)/settings.jsx` (line 48)
- Root cause: Incomplete implementation marked with TODO

## Security Considerations

**CRITICAL: Hardcoded Admin Backdoor:**
- Risk: Hardcoded credentials for `hrodelo@fnstaffing.com` with password `admin123`
- File: `apps/web/src/app/api/auth/login/route.js` (lines 27-55)
- Current mitigation: None
- Recommendations: **IMMEDIATELY REMOVE** this backdoor code

**Missing Input Validation:**
- Risk: Invalid data can be inserted into database
- Files:
  - `apps/web/src/app/api/interview-witnesses/route.js` - No validation
  - `apps/web/src/app/api/evidence/route.js` - No validation
  - `apps/web/src/app/api/employees/route.js` - Missing required field validation
- Current mitigation: Parameterized queries prevent SQL injection
- Recommendations: Add Yup/Zod validation at API boundary

**Audit Log Silent Failure:**
- Risk: Audit trail can be lost without any alert
- File: `apps/web/src/app/api/utils/audit.js` (line 62)
- Current mitigation: Console.error logging only
- Recommendations: Add error tracking (Sentry), don't swallow audit failures

**Environment Variables in Repository:**
- Risk: API keys exposed in `.env` file
- File: `apps/mobile/.env`
- Current mitigation: File contains empty/placeholder values
- Recommendations: Add `.env` to `.gitignore`, create `.env.example`

**Unvalidated File Uploads:**
- Risk: Malicious file uploads possible
- File: `apps/web/src/app/api/utils/upload.js`
- Current mitigation: None
- Recommendations: Add file type validation, size limits, virus scanning

## Performance Bottlenecks

**N+1 Query Pattern in Dossier Endpoint:**
- Problem: 6 sequential database queries to build incident dossier
- File: `apps/web/src/app/api/incidents/[id]/dossier/route.js` (lines 8-62)
- Measurement: Not measured, but sequential queries add latency
- Cause: Each related entity fetched separately
- Improvement path: Use JOINs or parallel queries, implement caching

**In-Memory Array Filtering:**
- Problem: Witnesses filtered client-side instead of database
- File: `apps/web/src/app/api/incidents/[id]/dossier/route.js` (lines 65-68)
- Cause: Simpler to implement than proper JOIN
- Improvement path: Use SQL JOIN to attach witnesses to interviews

## Fragile Areas

**Authentication Middleware:**
- File: `apps/web/src/app/api/utils/auth.js`
- Why fragile: Complex role logic (system_role vs legacy role), commented-out code
- Common failures: Permission denied on valid users
- Safe modification: Add comprehensive tests before changing
- Test coverage: None

**Settings Component:**
- File: `apps/mobile/src/app/(tabs)/settings.jsx`
- Why fragile: 850+ lines, many interdependent state variables
- Common failures: State inconsistencies
- Safe modification: Extract features into separate components first
- Test coverage: None

## Scaling Limits

**Database Connection Pool:**
- Current capacity: Neon serverless (scales automatically)
- Limit: Depends on Neon plan
- Symptoms at limit: Connection timeouts
- Scaling path: Upgrade Neon plan, add connection pooling

**Push Notification Batch Size:**
- Current capacity: Expo allows 100 messages per request
- File: `apps/web/src/app/api/utils/notifications.js` (line 22-23)
- Symptoms at limit: Notifications not sent to all devices
- Scaling path: Implement chunking for >100 tokens

## Dependencies at Risk

**react-native-calendars Custom Fork:**
- Risk: Using GitHub fork instead of npm package
- File: `apps/mobile/package.json` (line 66)
- Impact: No automatic updates, potential compatibility issues
- Migration plan: Submit PR to upstream or maintain fork

**Mixed Package Managers:**
- Risk: `package-lock.json` and `bun.lock` both exist
- Impact: Inconsistent dependency resolution
- Migration plan: Standardize on one package manager

## Missing Critical Features

**No Error Tracking:**
- Problem: Errors logged to console only
- Current workaround: Manual log review
- Blocks: Proactive issue detection, debugging production issues
- Implementation complexity: Low (add Sentry)

**No Analytics:**
- Problem: No visibility into user behavior
- Blocks: Data-driven decisions, funnel analysis
- Implementation complexity: Low (add Mixpanel/Amplitude)

**Missing .env.example:**
- Problem: Developers don't know required environment variables
- File: `apps/web/` missing `.env.example`
- Blocks: New developer onboarding
- Implementation complexity: Low (create template file)

## Test Coverage Gaps

**Authentication Routes:**
- What's not tested: Login, logout, token validation
- Files: `apps/web/src/app/api/auth/login/route.js`, `apps/web/src/app/api/auth/me/route.js`
- Risk: Auth bugs could break entire application
- Priority: Critical
- Difficulty: Medium (need to mock database)

**Authorization Logic:**
- What's not tested: `requireRole()` function
- File: `apps/web/src/app/api/utils/auth.js`
- Risk: Permission bypass vulnerabilities
- Priority: Critical
- Difficulty: Medium

**Audit Logging:**
- What's not tested: `logAudit()` function
- File: `apps/web/src/app/api/utils/audit.js`
- Risk: Silent audit failures, compliance issues
- Priority: High
- Difficulty: Low

**API Endpoints:**
- What's not tested: All 28 API resources
- Risk: Breaking changes go unnoticed
- Priority: High
- Difficulty: Medium

---

*Concerns audit: 2026-01-16*
*Update as issues are fixed or new ones discovered*
