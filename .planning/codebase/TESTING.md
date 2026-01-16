# Testing Patterns

**Analysis Date:** 2026-01-16

## Test Framework

**Web App:**
- Runner: Vitest 3.2.4
- Config: `apps/web/vitest.config.ts`

**Mobile App:**
- Runner: Jest ~29.7.0 with `jest-expo` preset
- Config: `apps/mobile/package.json` (lines 99-101)

**Assertion Library:**
- Web: Vitest built-in expect + @testing-library/jest-dom
- Mobile: Jest built-in expect

**Run Commands:**
```bash
# Web
cd apps/web
npm test                    # Run all tests
npm test -- --watch         # Watch mode

# Mobile
cd apps/mobile
npx jest                    # Run all tests
```

## Test File Organization

**Location:**
- Web: Co-located tests or `test/` directory
- Mobile: `__tests__/` directory

**Naming:**
- Web: `*.test.ts`, `*.spec.ts` (standard Vitest)
- Mobile: `*-test.jsx` (jest-expo convention)

**Structure:**
```
apps/web/
├── test/
│   └── setupTests.ts       # Test setup
├── vitest.config.ts        # Vitest config
└── src/app/api/
    └── vitest.config.ts    # API-specific config

apps/mobile/
├── __tests__/
│   └── README.md           # Test documentation
└── package.json            # Jest config
```

## Test Setup

**Web Setup (`apps/web/test/setupTests.ts`):**
```typescript
import '@testing-library/jest-dom';
```

**Web Config (`apps/web/vitest.config.ts`):**
```typescript
// Key settings:
environment: 'jsdom'
globals: true
setupFiles: './test/setupTests.ts'
resolve.alias: '@/' -> './src'
```

**Mobile Config (`apps/mobile/package.json`):**
```json
{
  "jest": {
    "preset": "jest-expo"
  }
}
```

## Test Structure

**Suite Organization:**
```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('ModuleName', () => {
  describe('functionName', () => {
    beforeEach(() => {
      // setup
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should handle success case', () => {
      // arrange
      // act
      // assert
    });

    it('should handle error case', () => {
      // test code
    });
  });
});
```

**Patterns:**
- Use beforeEach for per-test setup
- Use afterEach to restore mocks
- Arrange/Act/Assert pattern recommended
- One assertion focus per test

## Mocking

**Framework:**
- Web: Vitest built-in (`vi`)
- Mobile: Jest built-in (`jest`)

**Patterns:**
```typescript
// Vitest module mocking
vi.mock('./external-service', () => ({
  fetchData: vi.fn()
}));

// In test
const mockFetch = vi.mocked(fetchData);
mockFetch.mockResolvedValue({ data: 'test' });
```

**What to Mock:**
- External API calls
- Database operations
- File system operations
- Environment variables

**What NOT to Mock:**
- Internal pure functions
- Simple utilities
- TypeScript types

## Testing Libraries

**Web Dependencies (`apps/web/package.json`):**
- `@testing-library/jest-dom: ^6.6.4`
- `@testing-library/react: ^16.3.0`
- `jsdom: ^26.1.0`

**Mobile Dependencies (`apps/mobile/package.json`):**
- `@types/jest: ^30.0.0`
- `jest: ~29.7.0`
- `jest-expo: ~54.0.10`

## Coverage

**Requirements:**
- No enforced coverage target
- Coverage tracked for awareness

**Configuration:**
- Vitest: Built-in coverage via c8
- Jest: Built-in coverage

**View Coverage:**
```bash
# Web
npm test -- --coverage
open coverage/index.html

# Mobile
npx jest --coverage
```

## Test Types

**Unit Tests:**
- Test single function/component in isolation
- Mock external dependencies
- Fast execution (<100ms per test)

**Integration Tests:**
- Test multiple modules together
- Mock only external boundaries
- Use test database if available

**E2E Tests:**
- Not currently implemented
- Recommend: Playwright (web), Detox (mobile)

## Common Patterns

**Async Testing:**
```typescript
it('should handle async operation', async () => {
  const result = await asyncFunction();
  expect(result).toBe('expected');
});
```

**Error Testing:**
```typescript
it('should throw on invalid input', () => {
  expect(() => functionCall()).toThrow('error message');
});

// Async error
it('should reject on failure', async () => {
  await expect(asyncCall()).rejects.toThrow('error message');
});
```

**React Component Testing:**
```typescript
import { render, screen } from '@testing-library/react';

it('renders component', () => {
  render(<Component />);
  expect(screen.getByText('Expected text')).toBeInTheDocument();
});
```

## Current Test Coverage Status

**Note:** Test infrastructure is configured but minimal active tests exist.

**Gaps Identified:**
- Authentication routes: No tests
- Authorization logic: No tests
- Audit logging: No tests
- API endpoints: No tests
- Critical business logic: No tests

**Priority for Testing:**
1. Authentication (login, token validation)
2. Authorization (role checking)
3. Core API endpoints (incidents, clients)
4. Payment integration (Stripe)

---

*Testing analysis: 2026-01-16*
*Update when test patterns change*
