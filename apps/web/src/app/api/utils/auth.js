import { getToken } from "@auth/core/jwt";
import sql from "@/app/api/utils/sql";

export async function requireRole(request, allowedRoles = []) {
  const secret = process.env.AUTH_SECRET;

  // IMPORTANT: in dev/proxy environments the cookie can be either the secure
  // (__Secure-next-auth.session-token) or non-secure (next-auth.session-token)
  // variant. We try both to avoid "logged in but Access Denied" issues.
  const primarySecure = process.env.AUTH_URL?.startsWith("https") ?? false;

  let token = await getToken({
    req: request,
    secret,
    secureCookie: primarySecure,
  });

  if (!token) {
    token = await getToken({
      req: request,
      secret,
      secureCookie: !primarySecure,
    });
  }

  if (!token?.email) {
    return {
      authorized: false,
      response: new Response("Unauthorized", { status: 401 }),
      user: null,
    };
  }

  // Fetch user roles from DB
  const rows = await sql`
    SELECT id, name, email, role, system_role, avatar_url
    FROM admin_users
    WHERE LOWER(email) = LOWER(${token.email})
  `;

  const dbUser = rows[0];

  if (!dbUser) {
    return {
      authorized: false,
      response: new Response("Forbidden: User not found", { status: 403 }),
      user: null,
    };
  }

  // --- Authority separation (Phase 1.1) ---
  // system_role: global authority (global_admin | standard)
  // role: legacy field (kept for backward compatibility while we migrate)
  const effectiveSystemRole =
    dbUser.system_role ||
    (dbUser.role === "global_admin" ? "global_admin" : "standard");

  const user = {
    ...dbUser,
    system_role: effectiveSystemRole,
  };

  // Fetch client roles for this user
  const clientRoles = await sql`
    SELECT client_id, company_role 
    FROM user_client_roles 
    WHERE user_id = ${dbUser.id}
  `;

  user.client_roles = clientRoles;
  user.client_ids = clientRoles.map((r) => r.client_id);

  // If no specific roles required, just being a valid user is enough
  if (allowedRoles.length === 0) {
    return { authorized: true, user };
  }

  // Backward compatible match:
  // - allowRoles can contain system roles (global_admin/standard)
  // - OR legacy roles (plant_supervisor, etc)
  const matches =
    allowedRoles.includes(user.system_role) || allowedRoles.includes(user.role);

  if (matches) {
    return { authorized: true, user };
  }

  return {
    authorized: false,
    response: new Response("Forbidden: Insufficient permissions", {
      status: 403,
    }),
    user,
  };
}
