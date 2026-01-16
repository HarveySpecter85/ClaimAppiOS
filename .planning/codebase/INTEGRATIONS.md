# External Integrations

**Analysis Date:** 2026-01-16

## APIs & External Services

**Payment Processing:**
- Stripe v18.2.1 - Subscription billing and one-time payments
  - SDK/Client: Proxied through Create platform API
  - Auth: `CREATE_TEMP_API_KEY` + `NEXT_PUBLIC_PROJECT_GROUP_ID`
  - Endpoints: Checkout sessions, customers, subscriptions, invoices, refunds
  - Reference: `apps/web/src/__create/stripe.ts`

**File Upload:**
- Uploadcare v6.14.3 - File upload service
  - SDK/Client: `@uploadcare/upload-client`
  - Auth: `EXPO_PUBLIC_UPLOADCARE_PUBLIC_KEY`
  - Features: Presigned uploads, secure signatures
  - Reference: `apps/mobile/src/utils/useUpload.js`

- CreateAnything Upload API - Backend file storage
  - Endpoint: `https://api.createanything.com/v0/upload`
  - Reference: `apps/web/src/app/api/utils/upload.js`

## Data Storage

**Databases:**
- PostgreSQL (Neon Serverless) - Primary data store
  - Connection: `DATABASE_URL` environment variable
  - Client: `@neondatabase/serverless` v0.10.4
  - Features: WebSocket support, connection pooling
  - Reference: `apps/web/src/app/api/utils/sql.js`, `apps/web/__create/index.ts`

**File Storage:**
- Uploadcare CDN - User uploads
  - URL Pattern: `raw.createusercontent.com/{uuid}/`
  - Reference: `apps/mobile/src/utils/useUpload.js`

**Caching:**
- None currently implemented

## Authentication & Identity

**Auth Provider:**
- Auth.js (@auth/core v0.37.2) - Authentication framework
  - Implementation: Credentials provider (email/password)
  - Token storage: JWT in httpOnly cookies
  - Session management: JWT strategy with refresh
  - Password hashing: Argon2 v0.43.0
  - Reference: `apps/web/__create/index.ts`

**OAuth Integrations:**
- Not currently configured (framework supports Google, GitHub, etc.)

## Maps & Location

**Google Maps API:**
- Library: `@vis.gl/react-google-maps` v0.8.3 (web)
- Configuration: `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`
- Reference: `apps/web/package.json`

**React Native Maps:**
- Library: `react-native-maps` v1.20.1 (mobile)
- Reference: `apps/mobile/package.json`

**Expo Location:**
- Library: `expo-location` ~19.0.6
- Features: Geolocation services
- Reference: `apps/mobile/package.json`

## Push Notifications

**Expo Push Notifications:**
- Endpoint: `https://exp.host/--/api/v2/push/send`
- Token storage: `expo_push_token` in database
- Features: Incident subscriptions, broadcast notifications
- Reference: `apps/web/src/app/api/utils/notifications.js`

## In-App Purchases

**RevenueCat:**
- Library: `react-native-purchases` v9.6.0
- UI Components: `react-native-purchases-ui` v9.6.0
- Features: Cross-platform subscription management
- Reference: `apps/mobile/package.json`

## Monitoring & Observability

**Error Tracking:**
- Not detected (recommend Sentry)

**Analytics:**
- Not detected

**Logs:**
- Console logging with request ID tracing
- Reference: `apps/web/__create/index.ts`

## CI/CD & Deployment

**Hosting:**
- Web: Create platform (serverless)
- Mobile: Expo EAS for builds

**CI Pipeline:**
- Not detected in repository

## Environment Configuration

**Development:**
- Required env vars: `DATABASE_URL`, `AUTH_SECRET`
- Secrets location: `.env` files (gitignored)
- Reference: `apps/mobile/.env` (template)

**Staging:**
- Not explicitly configured

**Production:**
- Environment: `EXPO_PUBLIC_CREATE_ENV=PRODUCTION`
- API Base: `NEXT_PUBLIC_CREATE_API_BASE_URL`
- Project Group: `NEXT_PUBLIC_PROJECT_GROUP_ID`

## Webhooks & Callbacks

**Incoming:**
- None detected

**Outgoing:**
- Push notifications via Expo Push API
- Reference: `apps/web/src/app/api/utils/notifications.js`

---

*Integration audit: 2026-01-16*
*Update when adding/removing external services*
