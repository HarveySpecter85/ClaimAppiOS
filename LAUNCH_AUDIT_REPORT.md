# Launch Checklist Audit Report

This document summarizes the findings of the pre-launch audit for the `web` and `mobile` applications.

## Summary

| Category | Status | Notes |
|----------|--------|-------|
| Environment Configuration | ⚠️ Partial | Missing documentation for some used variables; mobile keys mismatch. |
| Database | ✅ Pass | `DATABASE_URL` configured and used. |
| Security Verification | ✅ Pass | Headers, CORS, Rate Limiting, and Auth checks are present. |
| Monitoring Setup | ⚠️ Partial | Health check exists but logging/uptime monitoring needs external verification. |
| CI/CD | ⚠️ Partial | CI pipeline exists but lacks automated testing steps. |

---

## Detailed Findings

### 1. Environment Configuration

- **Web (`apps/web`)**:
  - ✅ `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`, `CORS_ORIGINS` are used and documented.
  - ✅ `NEXT_PUBLIC_CREATE_API_BASE_URL` and `NEXT_PUBLIC_PROJECT_GROUP_ID` are used and documented.
  - ⚠️ `OPENAI_API_KEY` is used in `apps/web/src/app/api/interviews/[id]/analyze/route.js` but **missing** from `.env.example`.
  - ⚠️ `APP_URL` is used in multiple places (`secure-form-links`, `interviews`) but **missing** from `.env.example`.
  - ℹ️ `CREATE_TEMP_API_KEY` is in `.env.example` and used in `stripe.ts`.

- **Mobile (`apps/mobile`)**:
  - ✅ `EXPO_PUBLIC_UPLOADCARE_PUBLIC_KEY` is used and documented.
  - ⚠️ `EXPO_PUBLIC_BASE_URL` (used in code) vs `EXPO_PUBLIC_API_URL` (in `.env.example`). Mismatch in naming.
  - ⚠️ `EXPO_PUBLIC_PROXY_BASE_URL`, `EXPO_PUBLIC_HOST` are used in `src/__create/fetch.ts` but **missing** from `.env.example`.

### 2. Security Verification

- **Admin Backdoor**:
  - ✅ Verified `apps/web/src/app/api/auth/login/route.js`. Explicit comments forbid hardcoded credentials. Logic strictly verifies passwords against `admin_users` table using Argon2. No backdoors found.
- **Authentication**:
  - ✅ All API routes under `/api` are served by Hono.
  - ℹ️ Dual auth paths detected:
    1. `@hono/auth-js` via `apps/web/__create/index.ts` (using `auth_users` table).
    2. Custom login route at `apps/web/src/app/api/auth/login/route.js` (using `admin_users` table).
    - *Action*: Ensure this separation is intentional (e.g. End Users vs Admins).
- **Rate Limiting**:
  - ✅ Implemented in `apps/web/src/app/api/auth/login/route.js`.
  - Logic: In-memory, 10 attempts per minute per IP. Returns 429 status.
- **Security Headers**:
  - ✅ Configured in `apps/web/__create/index.ts` (X-Frame-Options, X-Content-Type-Options, etc.).
- **CORS**:
  - ✅ Configured in `apps/web/__create/index.ts` using `CORS_ORIGINS` env var.

### 3. Monitoring Setup

- **Health Check**:
  - ✅ Endpoint found at `apps/web/src/app/api/health/route.js`.
  - Logic: Returns 200 OK and tests DB connection (`SELECT 1`).
  - URL: `/api/health` (mounted by route builder).
- **Logging**:
  - ✅ `apps/web/__create/index.ts` implements request ID tracking and console logging wrapped with trace IDs.

### 4. CI/CD

- **Workflow**:
  - ✅ `.github/workflows/ci.yml` exists and runs on push/PR to `main`.
  - Checks: `npm ci`, `npm run typecheck`, `npm run build`.
- **Missing Tests**:
  - ❌ `apps/web/package.json` has `vitest` installed but **no `test` script** defined in `scripts`.
  - ❌ CI workflow does not run tests.
  - *Action*: Add `"test": "vitest run"` to `package.json` and add `npm test` step to `ci.yml`.

### 5. Mobile Audit

- **Uploadcare**:
  - ✅ Configured with `EXPO_PUBLIC_UPLOADCARE_PUBLIC_KEY`.
  - Implements fallback to presigned uploads via `/_create/api/upload/presign/` (proxied to web backend).

---

## Action Items

1.  **Update `.env.example` (Web)**: Add `OPENAI_API_KEY` and `APP_URL`.
2.  **Update `.env.example` (Mobile)**: Add `EXPO_PUBLIC_BASE_URL` (rename from `API_URL`), `EXPO_PUBLIC_PROXY_BASE_URL`, and `EXPO_PUBLIC_HOST`.
3.  **Add Test Script**: Add `"test": "vitest"` to `apps/web/package.json`.
4.  **Update CI**: Add testing step to `.github/workflows/ci.yml`.
5.  **Verify Auth separation**: Confirm if having both `auth_users` and `admin_users` is the desired architecture.
