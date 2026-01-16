# Technology Stack

**Analysis Date:** 2026-01-16

## Languages

**Primary:**
- TypeScript 5.8.3 (web), 5.9.2 (mobile) - All application code
- JavaScript - Legacy components, API routes, configuration files

**Secondary:**
- SQL - Database queries via tagged templates

## Runtime

**Environment:**
- Node.js - Backend runtime (Hono server)
- React Native 0.81.4 - Mobile runtime via Expo

**Package Manager:**
- Bun (web) - `apps/web/bun.lock`
- npm (mobile) - `apps/mobile/package-lock.json`

## Frameworks

**Core:**
- React 18.2.0 (web), 19.1.0 (mobile) - UI framework
- React Router 7.6.0 - Full-stack routing with SSR - `apps/web/package.json`
- Hono 3.x - Backend HTTP server via `react-router-hono-server` 2.13.0 - `apps/web/__create/index.ts`
- Expo 54.0.1 - React Native framework - `apps/mobile/package.json`
- Expo Router 6.0.0 - Mobile navigation - `apps/mobile/package.json`

**Testing:**
- Vitest 3.2.4 - Web unit tests - `apps/web/vitest.config.ts`
- Jest ~29.7.0 - Mobile tests with `jest-expo` preset - `apps/mobile/package.json`
- @testing-library/react 16.3.0 - Component testing - `apps/web/package.json`

**Build/Dev:**
- Vite 6.3.3 - Build tool and dev server - `apps/web/vite.config.ts`
- Babel 7.27.1 - JavaScript transpilation - `apps/web/package.json`
- Metro - React Native bundler - `apps/mobile/metro.config.js`

## Key Dependencies

**Critical:**
- @neondatabase/serverless 0.10.4 - PostgreSQL client - `apps/web/package.json`
- @auth/core 0.37.2 - Authentication framework - `apps/web/package.json`
- Argon2 0.43.0 - Password hashing - `apps/web/package.json`
- Stripe 18.2.1 - Payment processing - `apps/web/src/__create/stripe.ts`
- @uploadcare/upload-client 6.14.3 - File uploads - `apps/mobile/package.json`

**UI:**
- Chakra UI 2.8.2 - Component library - `apps/web/package.json`
- Tailwind CSS 3 - Utility-first styling - `apps/web/tailwind.config.js`
- Lucide React - Icon library - `apps/web/package.json`
- Recharts 2.12.0 - Chart library - `apps/web/package.json`

**State Management:**
- Zustand 5.0.3 - Client-side state - `apps/web/package.json`, `apps/mobile/package.json`
- TanStack React Query 5.72.2 - Server state - `apps/web/package.json`, `apps/mobile/package.json`

**Forms:**
- React Hook Form 7.55.0 - Form handling - `apps/web/package.json`
- Yup 1.6.1 - Schema validation - `apps/web/package.json`

**Utilities:**
- date-fns 4.1.0 - Date utilities
- lodash-es 4.17.21 - Utility functions
- PapaParse 5.5.2 - CSV parsing
- Three.js 0.175.0 (web), 0.166.0 (mobile) - 3D graphics

**Mobile-Specific:**
- react-native-purchases 9.6.0 - RevenueCat integration - `apps/mobile/package.json`
- expo-camera, expo-location, expo-secure-store - Device APIs
- react-native-maps 1.20.1 - Map integration
- react-native-reanimated - Animations

## Configuration

**Environment:**
- Web: `NEXT_PUBLIC_*` prefix for client-side variables - `apps/web/vite.config.ts`
- Mobile: `EXPO_PUBLIC_*` prefix - `apps/mobile/.env`
- Critical: `DATABASE_URL`, `AUTH_SECRET`, `CREATE_TEMP_API_KEY`

**Build:**
- `apps/web/vite.config.ts` - Vite configuration
- `apps/web/react-router.config.ts` - React Router SSR config
- `apps/web/tsconfig.json` - TypeScript with `@/*` path alias
- `apps/mobile/metro.config.js` - React Native bundler
- `apps/mobile/babel.config.js` - Babel preset: `babel-preset-expo`

## Platform Requirements

**Development:**
- macOS/Linux/Windows with Node.js
- Xcode (iOS development)
- Android Studio (Android development)

**Production:**
- Web: Serverless deployment (Create platform)
- Mobile: App Store / Google Play via Expo EAS

---

*Stack analysis: 2026-01-16*
*Update after major dependency changes*
