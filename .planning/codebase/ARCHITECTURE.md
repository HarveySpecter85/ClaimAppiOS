# Architecture

**Analysis Date:** 2026-01-16

## Pattern Overview

**Overall:** Full-Stack Monorepo with Layered Architecture

**Key Characteristics:**
- Multi-app monorepo (web + mobile)
- Server-side rendering for web platform
- REST API with JWT authentication
- Offline-first mobile with sync queue
- Role-based access control with client isolation

## Layers

**Presentation Layer:**
- Purpose: User interface and interaction
- Contains: React components, pages, forms
- Web: `apps/web/src/app/` (React Router pages)
- Mobile: `apps/mobile/src/app/` (Expo Router screens)
- Depends on: API layer via fetch/React Query
- Used by: End users

**API Layer:**
- Purpose: HTTP request handling, authentication, authorization
- Contains: Route handlers, middleware, validation
- Location: `apps/web/src/app/api/` (Hono handlers)
- Depends on: Data layer, utility services
- Used by: Presentation layer

**Data Access Layer:**
- Purpose: Database operations
- Contains: SQL queries via tagged templates
- Location: `apps/web/src/app/api/utils/sql.js`
- Depends on: Neon PostgreSQL driver
- Used by: API handlers

**Utility Layer:**
- Purpose: Shared services and helpers
- Contains: Auth, audit logging, notifications, uploads
- Location: `apps/web/src/app/api/utils/`
- Depends on: External services
- Used by: API handlers

## Data Flow

**Web HTTP Request:**

1. Client sends request to React Router endpoint
2. Hono middleware processes (requestId, CORS, bodyLimit)
3. Route handler receives request
4. `requireRole()` validates JWT and checks permissions
5. SQL queries execute via Neon driver
6. Optional: Audit logging, notifications triggered
7. JSON response returned to client

**Mobile App Request:**

1. Expo app sends HTTP request
2. `SyncContext` queues if offline
3. Request includes JWT from SecureStore
4. Same API handlers process request
5. Response cached via React Query
6. UI updates reactively

**State Management:**
- Client state: Zustand stores
- Server state: React Query with caching
- Offline queue: AsyncStorage (mobile)
- Sessions: JWT in cookies (web) / SecureStore (mobile)

## Key Abstractions

**API Route Handler:**
- Purpose: RESTful endpoint for a resource
- Examples: `apps/web/src/app/api/incidents/route.js`, `apps/web/src/app/api/clients/route.js`
- Pattern: Export async functions for HTTP methods (GET, POST, PUT, DELETE)

**requireRole() Middleware:**
- Purpose: Authentication and authorization
- Examples: `requireRole(request, ["global_admin", "standard"])`
- Pattern: Extracts JWT, validates roles, returns user or 401/403
- Location: `apps/web/src/app/api/utils/auth.js`

**logAudit() Service:**
- Purpose: Record entity changes for compliance
- Examples: Called on incident updates, status changes
- Pattern: Entity type, ID, action type, performer, changes diff
- Location: `apps/web/src/app/api/utils/audit.js`

**Custom Hooks:**
- Purpose: Encapsulate complex logic
- Examples: `useIncidentForm.js`, `useInterview.js`, `usePushNotifications.js`
- Pattern: State + actions + side effects
- Location: `apps/mobile/src/hooks/`

## Entry Points

**Web Application:**
- Server Entry: `apps/web/__create/index.ts` (Hono app initialization)
- Root Layout: `apps/web/src/app/root.tsx` (SessionProvider, fonts, error handling)
- Route Builder: `apps/web/src/app/routes.ts` (file-based routing)
- Triggers: HTTP requests, SSR navigation

**Mobile Application:**
- Root Layout: `apps/mobile/src/app/_layout.jsx` (providers, auth init)
- Tab Navigation: `apps/mobile/src/app/(tabs)/_layout.jsx`
- Triggers: User interaction, push notifications

**API Endpoints:**
- Location: `apps/web/src/app/api/[resource]/route.js`
- Triggers: HTTP requests from web or mobile clients

## Error Handling

**Strategy:** Try-catch at handler level, consistent JSON error responses

**Patterns:**
- API routes wrap operations in try-catch
- Return `Response.json({ error: "..." }, { status: 4xx/5xx })`
- Log errors with console.error before responding
- Audit log failures silently caught (risk: lost audit trail)

**Error Boundary:**
- Web: `ErrorBoundary` component in `apps/web/src/app/root.tsx`
- Captures React rendering errors with screenshot capability

## Cross-Cutting Concerns

**Logging:**
- Request ID injection via `hono/request-id`
- Console logging throughout
- Audit logging for entity changes

**Validation:**
- Manual validation in route handlers
- Yup schemas for complex forms
- TypeScript for compile-time checking

**Authentication:**
- JWT strategy via @auth/core
- Credentials provider (email/password)
- Role-based access: `system_role` (global_admin, standard)
- Client isolation: Users see only assigned clients' data

**Internationalization:**
- Mobile: i18n store in `apps/mobile/src/utils/i18n/`
- Translations directory with language files

---

*Architecture analysis: 2026-01-16*
*Update when major patterns change*
