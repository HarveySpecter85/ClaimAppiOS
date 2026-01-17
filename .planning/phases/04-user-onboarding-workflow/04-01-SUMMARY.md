# 04-01 Audit Summary: User Creation and Password Flow

## Audit Date
2026-01-17

## Scope
Audit of user creation workflow and password initialization gap documentation

---

## Task 1: User Creation API Audit

### Files Audited
- `apps/web/src/app/api/admin-users/route.js`
- `apps/web/src/app/api/admin-users/[id]/route.js`
- `apps/web/src/app/settings/users/page.jsx`

### Findings

#### 1.1 Global Admin Requirement - VERIFIED
- **GET /api/admin-users**: Protected by `requireRole(request, ["global_admin"])` (line 6)
- **POST /api/admin-users**: Protected by `requireRole(request, ["global_admin"])` (line 19)
- **PUT /api/admin-users/[id]**: Protected by `requireRole(request, ["global_admin"])` (line 5)
- **DELETE /api/admin-users/[id]**: Protected by `requireRole(request, ["global_admin"])` (line 48)
- **Frontend**: Uses `RoleGuard` component with `roles={["global_admin"]}` (line 438)

**Status**: PASS - All user management endpoints require global_admin role

#### 1.2 Field Validation - VERIFIED
- POST endpoint validates required fields (line 25-27):
  ```javascript
  if (!email || !name) {
    return new Response("Missing required fields", { status: 400 });
  }
  ```
- Name and email are mandatory for user creation
- Role defaults to "user" if not provided (or "global_admin" if system_role is global_admin)
- System_role defaults to "standard" unless explicitly set to "global_admin"

**Status**: PASS - Basic validation in place

#### 1.3 Users Created WITHOUT Password - DOCUMENTED (GAP)
- **Critical Finding**: The POST endpoint creates users without a password field
- INSERT statement (lines 42-46):
  ```sql
  INSERT INTO admin_users (name, email, role, system_role, avatar_url)
  VALUES (${name}, ${email}, ${nextRole}, ${nextSystemRole}, ${body.avatar_url || null})
  ```
- No `password_hash` field is included in the INSERT
- This means newly created users CANNOT log in via `/api/auth/login` (which requires password_hash)

**Status**: GAP CONFIRMED - Users created without password cannot authenticate normally

#### 1.4 Email Uniqueness Check - NOT IMPLEMENTED
- **Finding**: No explicit email uniqueness check before INSERT
- The database likely has a UNIQUE constraint on email (would cause INSERT to fail)
- No explicit LOWER() pattern for case-insensitive email checking at creation time
- Error handling is generic: `return new Response("Error creating user", { status: 500 })`
- Login endpoint uses `LOWER(email) = LOWER(${email})` for case-insensitive lookup
- User creation does NOT use the LOWER pattern

**Status**: PARTIAL - Relies on database constraint, no explicit check or normalized email storage

#### 1.5 Password Initialization Logic - NOT PRESENT
- No password initialization logic exists in user creation flow
- No endpoint exists for setting initial password
- No invitation email or password setup link functionality

**Status**: GAP CONFIRMED - No password initialization mechanism

---

## Task 2: Temporary Access Flow Audit

### Files Audited
- `apps/web/src/app/api/auth/temporary-access/route.js`
- `apps/web/src/app/api/auth/validate-temporary-access/route.js`

### Findings

#### 2.1 Token Generation - VERIFIED
- Uses cryptographically secure random generation (line 15):
  ```javascript
  const rawToken = randomBytes(32).toString("hex");
  ```
- Token is hashed with SHA-256 before storage (line 16):
  ```javascript
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  ```
- Raw token returned to user; only hash stored in database

**Status**: PASS - Secure token generation implemented correctly

#### 2.2 Token Storage and Expiry - VERIFIED
- Default expiration: 5 minutes (line 19):
  ```javascript
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
  ```
- Stored in `secure_form_links` table with:
  - `token_hash`: SHA-256 hash of token
  - `form_type`: 'admin_panel_access'
  - `recipient_name`: User's name
  - `recipient_contact`: User's email
  - `expires_at`: Expiration timestamp
- Validation checks expiry: `expires_at > NOW()` (line 23)

**Status**: PASS - Token storage and expiry implemented correctly

#### 2.3 Session Creation on Validation - VERIFIED
- On valid token, creates JWT session with user data (lines 58-65):
  ```javascript
  const token_data = {
    name: user.name,
    email: user.email,
    sub: user.id.toString(),
    picture: user.avatar_url,
    role: user.role,
    system_role: effectiveSystemRole,
  };
  ```
- Sets both standard and secure cookies (lines 70-94)
- Session duration: 30 days (via Max-Age)

**Status**: PASS - Session creation working correctly

#### 2.4 Grants Session Without Password Set - DOCUMENTED (GAP)
- **Critical Finding**: Temporary access grants full session without setting permanent password
- User can access the system via temporary link
- Once session expires (30 days), user would need another temporary link
- No mechanism to set permanent password after access

**Status**: GAP CONFIRMED - Temporary access is workaround, not solution

#### 2.5 One-Time Use Enforcement - VERIFIED
- Token immediately revoked upon use (lines 36-39):
  ```javascript
  await sql`
    UPDATE secure_form_links
    SET revoked_at = NOW()
    WHERE id = ${tokenRecord.id}
  `;
  ```
- Validation checks `revoked_at IS NULL` (line 24)

**Status**: PASS - One-time use properly enforced

---

## Task 3: Password Flow Gap Analysis

### Current State Summary

| Aspect | Status | Notes |
|--------|--------|-------|
| User Creation | Works | Creates user without password |
| Password Setting | MISSING | No endpoint exists |
| Password Reset | MISSING | No self-service reset |
| Normal Login | BLOCKED | Requires password_hash field |
| Temporary Access | Works | Workaround via secure tokens |
| Session Management | Works | JWT with 30-day expiry |

### Gap Details

#### 3.1 No Password Initialization Endpoint
- When admin creates user, there is no mechanism to:
  - Set initial password
  - Send password setup email/link
  - Allow user to create their own password
- **Impact**: New users cannot log in normally

#### 3.2 No Self-Service Password Reset Flow
- No `/api/auth/forgot-password` endpoint
- No `/api/auth/reset-password` endpoint
- No password reset email functionality
- **Impact**: Users who forget password have no recovery option

#### 3.3 Temporary Access as Current Workaround
- Admin must generate temporary access link for each user
- Link expires in 5 minutes
- Session lasts 30 days
- User must request new link when session expires
- **Impact**: Operational overhead, not scalable

### Recommendations for Phase 10

1. **Password Initialization Endpoint**
   - Create `POST /api/auth/set-initial-password`
   - Accept token + new password
   - Generate secure setup link on user creation
   - Send email with setup link

2. **Password Reset Flow**
   - Create `POST /api/auth/forgot-password` - initiates reset
   - Create `POST /api/auth/reset-password` - completes reset
   - Implement email delivery with reset tokens
   - Use same token pattern as temporary-access (SHA-256 hash, expiry)

3. **Password Requirements**
   - Enforce minimum length (12+ characters)
   - Use argon2 for hashing (already used in login)
   - Consider password strength validation

4. **User Creation Enhancement**
   - After creating user, auto-generate password setup token
   - Send setup email to new user
   - Mark user as "pending_setup" until password set

5. **Email Integration**
   - Integrate email service (SendGrid, Postmark, etc.)
   - Create email templates for password setup/reset
   - Implement rate limiting on email sends

---

## Security Observations

### Positive Findings
1. Proper role-based access control on all admin endpoints
2. Cryptographically secure token generation
3. One-time use tokens with short expiry
4. Password hashing with argon2 (industry standard)
5. Case-insensitive email lookup in login

### Areas for Improvement
1. Email uniqueness should use LOWER() normalization at INSERT time
2. Better error messages for duplicate email (currently generic 500)
3. Rate limiting on temporary access token generation
4. Audit logging for user creation/modification events

---

## Conclusion

The user creation and temporary access flows are implemented correctly for their current scope. However, a **critical gap exists**: users created by admins have no way to set a password and must rely on temporary access tokens. This should be addressed in Phase 10 with a proper password initialization and reset flow.

**Priority**: HIGH - Essential for production-ready user onboarding
