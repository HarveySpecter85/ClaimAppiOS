# Codebase Structure

**Analysis Date:** 2026-01-16

## Directory Layout

```
Claim-Flow-App/
├── apps/
│   ├── web/                    # React Router SSR + Hono Backend
│   │   ├── src/
│   │   │   ├── app/            # Routes and API
│   │   │   ├── components/     # Shared UI components
│   │   │   ├── utils/          # Client utilities
│   │   │   └── __create/       # Build-time utilities
│   │   ├── __create/           # Server setup (Hono)
│   │   ├── plugins/            # Vite plugins
│   │   └── test/               # Test setup
│   └── mobile/                 # Expo/React Native App
│       ├── src/
│       │   ├── app/            # Expo Router screens
│       │   ├── components/     # UI components
│       │   ├── hooks/          # Custom React hooks
│       │   ├── context/        # React Context providers
│       │   ├── utils/          # Utilities
│       │   └── __create/       # Build utilities
│       ├── polyfills/          # Platform polyfills
│       ├── assets/             # Images and fonts
│       └── patches/            # Patch-package fixes
└── .planning/                  # GSD project planning
```

## Directory Purposes

**apps/web/src/app/**
- Purpose: Application routes and API endpoints
- Contains: Page components, API route handlers
- Key files: `root.tsx`, `routes.ts`, `page.jsx`
- Subdirectories: `api/` (backend), `(routes)/` (pages)

**apps/web/src/app/api/**
- Purpose: RESTful API endpoints
- Contains: Route handlers for each resource
- Key files: `route.js` files for GET/POST/PUT/DELETE
- Subdirectories: Resource-based (`incidents/`, `clients/`, `auth/`)

**apps/web/src/app/api/utils/**
- Purpose: Shared API utilities
- Contains: Database, auth, audit, notifications
- Key files: `sql.js`, `auth.js`, `audit.js`, `notifications.js`, `upload.js`

**apps/web/src/components/**
- Purpose: Reusable UI components
- Contains: Layout, forms, guards
- Key files: `Sidebar.jsx`, `RoleGuard.jsx`, `LayoutWrapper.jsx`

**apps/web/__create/**
- Purpose: Hono server initialization
- Contains: Server setup, auth adapter, route builder
- Key files: `index.ts`, `adapter.ts`, `route-builder.ts`

**apps/mobile/src/app/**
- Purpose: Expo Router screens
- Contains: Tab navigation, form screens
- Key files: `_layout.jsx`, `(tabs)/_layout.jsx`
- Subdirectories: Feature-based routes

**apps/mobile/src/components/**
- Purpose: Mobile UI components
- Contains: Forms, media, interviews
- Key files: Feature-grouped (`Interview/`, `NewIncident/`, `PrescriptionCard/`)

**apps/mobile/src/hooks/**
- Purpose: Custom React hooks
- Contains: Form logic, data fetching, actions
- Key files: `useIncidentForm.js`, `useInterview.js`, `usePushNotifications.js`

**apps/mobile/src/context/**
- Purpose: React Context providers
- Contains: Offline sync queue
- Key files: `SyncContext.jsx`

## Key File Locations

**Entry Points:**
- `apps/web/__create/index.ts` - Hono server initialization
- `apps/web/src/app/root.tsx` - Web root component
- `apps/mobile/src/app/_layout.jsx` - Mobile root layout

**Configuration:**
- `apps/web/vite.config.ts` - Vite build configuration
- `apps/web/react-router.config.ts` - React Router SSR config
- `apps/web/tsconfig.json` - TypeScript configuration
- `apps/web/tailwind.config.js` - Tailwind CSS config
- `apps/mobile/metro.config.js` - React Native bundler
- `apps/mobile/babel.config.js` - Babel configuration
- `apps/mobile/.env` - Environment variables

**Core Logic:**
- `apps/web/src/app/api/utils/sql.js` - Database wrapper
- `apps/web/src/app/api/utils/auth.js` - Authorization middleware
- `apps/web/src/app/api/utils/audit.js` - Audit logging
- `apps/web/src/app/api/utils/notifications.js` - Push notifications

**Testing:**
- `apps/web/vitest.config.ts` - Vitest configuration
- `apps/web/test/setupTests.ts` - Test setup
- `apps/mobile/__tests__/` - Mobile test directory

## Naming Conventions

**Files:**
- PascalCase for components: `AudioRecorder.jsx`, `Sidebar.jsx`
- camelCase for hooks: `useAuth.js`, `useUpload.js`
- kebab-case for API routes: `route.js` (framework convention)
- UPPERCASE for project files: `README.md`, `CLAUDE.md`

**Directories:**
- kebab-case for features: `new-incident/`, `prescription-card/`
- Plural for collections: `components/`, `hooks/`, `utils/`
- Parentheses for grouping: `(tabs)/`, `(routes)/`
- Brackets for parameters: `[id]/`, `[slug]/`
- Double underscore for internal: `__create/`, `__tests__/`

**Special Patterns:**
- `route.js` - API endpoint handler
- `page.jsx` - React Router page component
- `_layout.jsx` - Expo Router layout
- `[id]` - Dynamic route parameter

## Where to Add New Code

**New API Endpoint:**
- Definition: `apps/web/src/app/api/[resource]/route.js`
- Handler: Same file (export GET, POST, PUT, DELETE)
- Tests: `apps/web/src/app/api/[resource]/__tests__/`

**New Web Page:**
- Implementation: `apps/web/src/app/(routes)/[page]/page.jsx`
- Components: `apps/web/src/components/`

**New Mobile Screen:**
- Implementation: `apps/mobile/src/app/(tabs)/[screen]/`
- Components: `apps/mobile/src/components/[Feature]/`
- Hooks: `apps/mobile/src/hooks/use[Feature].js`

**New Component:**
- Web: `apps/web/src/components/[ComponentName].jsx`
- Mobile: `apps/mobile/src/components/[ComponentName].jsx`

**New Utility:**
- Web client: `apps/web/src/utils/[name].js`
- Web server: `apps/web/src/app/api/utils/[name].js`
- Mobile: `apps/mobile/src/utils/[name].js`

## Special Directories

**__create/**
- Purpose: Internal build and runtime utilities
- Source: Create platform scaffolding
- Committed: Yes

**polyfills/**
- Purpose: Platform compatibility shims
- Source: Manual additions for React Native
- Committed: Yes

**patches/**
- Purpose: patch-package fixes
- Source: Generated by `npx patch-package`
- Committed: Yes

**.planning/**
- Purpose: GSD project planning documents
- Source: Generated by Claude/GSD workflow
- Committed: Yes

---

*Structure analysis: 2026-01-16*
*Update when directory structure changes*
