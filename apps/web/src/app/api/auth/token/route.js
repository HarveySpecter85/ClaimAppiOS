import { getToken } from "@auth/core/jwt";
import sql from "@/app/api/utils/sql";

export async function GET(request) {
  const primarySecure = process.env.AUTH_URL?.startsWith("https") ?? false;

  const [rawA, jwtA] = await Promise.all([
    getToken({
      req: request,
      secret: process.env.AUTH_SECRET,
      secureCookie: primarySecure,
      raw: true,
    }),
    getToken({
      req: request,
      secret: process.env.AUTH_SECRET,
      secureCookie: primarySecure,
    }),
  ]);

  // fallback to the opposite cookie style
  const [token, jwt] = jwtA
    ? [rawA, jwtA]
    : await Promise.all([
        getToken({
          req: request,
          secret: process.env.AUTH_SECRET,
          secureCookie: !primarySecure,
          raw: true,
        }),
        getToken({
          req: request,
          secret: process.env.AUTH_SECRET,
          secureCookie: !primarySecure,
        }),
      ]);

  if (!jwt) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  // Fetch user role from admin_users (case-insensitive)
  const userRows = await sql`
    SELECT role, system_role, id
    FROM admin_users
    WHERE LOWER(email) = LOWER(${jwt.email})
  `;

  const dbUser = userRows[0];

  const legacyRole = dbUser?.role || "user"; // Default legacy role
  const systemRole =
    dbUser?.system_role ||
    (legacyRole === "global_admin" ? "global_admin" : "standard");

  return new Response(
    JSON.stringify({
      jwt: token,
      user: {
        id: jwt.sub,
        email: jwt.email,
        name: jwt.name,
        role: legacyRole,
        system_role: systemRole,
        admin_id: dbUser?.id, // useful for linking
      },
    }),
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
}
