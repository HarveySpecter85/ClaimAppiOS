# Coding Conventions

**Analysis Date:** 2026-01-16

## Naming Patterns

**Files:**
- PascalCase for React components: `AudioRecorder.jsx`, `Sidebar.jsx`, `IncidentMessages.jsx`
- camelCase for hooks and utilities: `useAuth.js`, `useUpload.js`, `useIncidentForm.js`
- kebab-case for API routes: `route.js` (React Router convention)
- UPPERCASE for project files: `README.md`, `CLAUDE.md`

**Functions:**
- camelCase for all functions: `handleRecord()`, `togglePlayback()`, `onLogout()`
- `use` prefix for hooks: `useAuth`, `useIncidentForm`, `usePushNotifications`
- `handle` prefix for event handlers: `handleSubmit`, `handleClick`
- Async functions: No special prefix

**Variables:**
- camelCase for variables: `employeeData`, `isLoading`, `currentUser`
- UPPER_SNAKE_CASE for constants: `RecordingPresets.HIGH_QUALITY`
- No underscore prefix for private members

**Types:**
- PascalCase for interfaces and types: `ErrorBoundaryProps`, `Route.LoaderArgs`
- No `I` prefix for interfaces

## Code Style

**Formatting:**
- Tabs for indentation in JSX files
- 2-space indentation in TypeScript/JSON
- Double quotes for JSX attributes
- Semicolons required
- No Prettier/ESLint config detected (uses TypeScript strict mode)

**Linting:**
- TypeScript `strict: true` enforced in both apps
- No ESLint configuration detected
- Type checking serves as primary linting

## Import Organization

**Order:**
1. React and framework imports (`react`, `react-router`)
2. External packages (`@tanstack/react-query`, `recharts`)
3. Internal modules (`@/components`, `@/utils`)
4. Relative imports (`./`, `../`)
5. Type imports (`import type { ... }`)

**Path Aliases:**
- `@/*` maps to `./src/*` in both apps
- `@/__create/` for build utilities
- `@/app/api/utils/` for server utilities

**Examples:**
```javascript
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import RoleGuard from "@/components/RoleGuard";
import sql from "@/app/api/utils/sql";
```

## Error Handling

**Patterns:**
- Try-catch at API route handler level
- Return JSON with error message and status code
- Log errors with `console.error` before responding
- Silent failure for non-critical operations (audit logs)

**Error Response Format:**
```javascript
return Response.json({ error: "Error message" }, { status: 400 });
// OR
return new Response("Error message", { status: 500 });
```

**Async Error Handling:**
```javascript
try {
  const result = await asyncOperation();
  return Response.json(result);
} catch (error) {
  console.error("Operation failed:", error);
  return Response.json({ error: "Failed" }, { status: 500 });
}
```

## Logging

**Framework:**
- Console.log for normal output
- Console.error for errors
- Request ID injection via `hono/request-id`

**Patterns:**
- Log errors before throwing/returning
- Include context: `console.error("Error fetching:", error)`
- No structured logging library detected

## Comments

**When to Comment:**
- Document complex business logic
- Explain non-obvious behavior
- Mark TODO/FIXME items

**JSDoc Style:**
```javascript
/**
 * useHmrConnection()
 * ------------------
 * • `true`  → HMR socket is healthy
 * • `false` → socket lost
 */
```

**Inline Comments:**
```javascript
// 1. Fetch Incident Details
const incidents = await sql`...`;

// Notify incident subscribers about the new action
await notifyIncidentSubscribers(...);
```

**TODO Format:**
```javascript
// TODO: Implement save functionality
```

## Function Design

**Size:**
- Keep functions focused (single responsibility)
- Large components exist (settings.jsx ~850 lines - needs refactoring)

**Parameters:**
- Destructure objects in function parameters
- Use object parameters for multiple options

**Return Values:**
- Explicit return statements
- Return early for validation failures
- Async functions return Promises

**Examples:**
```javascript
export async function GET(request, { params }) {
  const { id } = params;

  if (!id) {
    return Response.json({ error: "ID required" }, { status: 400 });
  }

  // ... rest of function
}
```

## Module Design

**Exports:**
- Named exports for utilities: `export async function logAudit(...)`
- Default exports for React components: `export default function DashboardContent()`
- Mixed exports allowed

**API Route Pattern:**
```javascript
import sql from "@/app/api/utils/sql";

export async function GET(request) { ... }
export async function POST(request) { ... }
export async function PUT(request, { params }) { ... }
export async function DELETE(request, { params }) { ... }
```

**Component Pattern:**
```javascript
"use client";

import { useQuery } from "@tanstack/react-query";
import RoleGuard from "@/components/RoleGuard";

function ComponentContent() {
  // hooks and logic
}

export default function ComponentPage() {
  return (
    <RoleGuard allowedRoles={["admin"]}>
      <ComponentContent />
    </RoleGuard>
  );
}
```

## SQL Query Style

**Tagged Template Literals:**
```javascript
const rows = await sql`
  SELECT * FROM incidents
  WHERE client_id = ${clientId}
  ORDER BY created_at DESC
`;
```

**Dynamic Queries (when needed):**
```javascript
let query = `SELECT * FROM table WHERE 1=1`;
const params = [];
let paramCount = 1;

if (filter) {
  query += ` AND field = $${paramCount}`;
  params.push(filter);
  paramCount++;
}

const rows = await sql(query, params);
```

---

*Convention analysis: 2026-01-16*
*Update when patterns change*
