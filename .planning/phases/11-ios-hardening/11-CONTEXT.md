# Phase 11: iOS Hardening - Context

**Gathered:** 2026-01-22
**Status:** Ready for planning

<vision>
## How This Should Work

The mobile app needs to be rock-solid for launch day. When a user's session expires, they shouldn't see cryptic "Network Error" messages — they should be cleanly redirected to login so they can sign back in. The app should work flawlessly on iOS without ATS blocking connections.

For returning users, FaceID/TouchID should make logging back in effortless — tap to unlock, credentials auto-fill, they're back in. No typing passwords in public.

The codebase should be clean with no dead code paths confusing future developers. Environment configuration should be bulletproof so production deployments don't fail with mysterious missing variable errors.

</vision>

<essential>
## What Must Be Nailed

- **401 handling** — When the backend returns "Unauthorized", the app immediately logs the user out and redirects to login. No cryptic errors, no stuck states.
- **HTTPS everywhere** — All API connections verified as HTTPS so iOS ATS doesn't block the app on day one.
- **Biometrics with auto-fill** — FaceID/TouchID unlocks saved credentials from Keychain, auto-fills login form. Seamless re-authentication.
- **Clean environment config** — Code references match `.env.example`, no production-only surprises.

</essential>

<boundaries>
## What's Out of Scope

- Refresh token implementation (backend capability unknown — using logout-on-expire instead)
- Complex biometric flows (no "unlock on app resume" — just credential auto-fill)
- External monitoring service setup (user will configure Uptime/PagerDuty separately)
- Backend changes (all fixes are mobile-side)

</boundaries>

<specifics>
## Specific Ideas

- **401 Interceptor**: Add to the API layer so all requests automatically handle token expiration
- **Biometrics**: Use `expo-local-authentication` + `expo-secure-store` for Keychain storage
- **Dead code**: Delete `AuthWebView.jsx`, `useAuthModal.jsx`, clean up `useAuth.js` references to modal
- **Account deletion**: Simple "Contact Admin to Delete Account" text in Settings (iOS compliance)
- **Env audit**: Compare all code references against `.env.example`, document any gaps

</specifics>

<notes>
## Additional Context

This work is driven by launch readiness concerns. The priority is preventing day-one failures that are hard to diagnose under pressure:
- Users seeing generic errors when sessions expire → support tickets, abandonment
- iOS ATS blocking HTTP connections → app doesn't work at all
- Missing env vars → production-only errors that are hardest to debug

The audit identified unused WebView authentication code that should be removed to prevent confusion for future developers.

</notes>

---

*Phase: 11-ios-hardening*
*Context gathered: 2026-01-22*
