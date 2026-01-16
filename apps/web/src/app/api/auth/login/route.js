import sql from "@/app/api/utils/sql";
import argon2 from "argon2";
import { encode } from "@auth/core/jwt";

export async function POST(request) {
  try {
    const body = await request.json();
    const rawEmail = body?.email;
    const password = body?.password;

    const email =
      typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";

    if (!email || !password) {
      return Response.json(
        { error: "Email y contraseña son requeridos" },
        { status: 400 },
      );
    }

    // SECURITY: All authentication must go through proper password verification.
    // No hardcoded credentials or bypass mechanisms allowed.

    // Buscar usuario en la base de datos (case-insensitive)
    const rows = await sql`
      SELECT * FROM admin_users WHERE LOWER(email) = LOWER(${email})
    `;
    let user = rows[0];

    // Verificar si el usuario existe y tiene contraseña configurada
    if (!user || !user.password_hash) {
      console.log("Login failed: User not found or no password hash", { user });
      return Response.json(
        { error: "Credenciales inválidas" },
        { status: 401 },
      );
    }

    // Verificar la contraseña encriptada
    try {
      const valid = await argon2.verify(user.password_hash, password);
      if (!valid) {
        console.log("Login failed: Password mismatch");
        return Response.json(
          { error: "Credenciales inválidas" },
          { status: 401 },
        );
      }
    } catch (err) {
      console.error("Argon2 verify error:", err);
      return Response.json(
        { error: "Error verifying password" },
        { status: 500 },
      );
    }

    // --- Authority separation (Phase 1.1) ---
    // system_role: global authority (global_admin | standard)
    // role: legacy field (kept while we migrate company-level roles)
    const effectiveSystemRole =
      user.system_role ||
      (user.role === "global_admin" ? "global_admin" : "standard");

    // Create JWT token for the session
    const token = {
      name: user.name,
      email: user.email,
      sub: user.id.toString(),
      picture: user.avatar_url,
      role: user.role,
      system_role: effectiveSystemRole,
    };

    const secret = process.env.AUTH_SECRET;

    // We'll set BOTH cookie variants to avoid issues between http/https/proxy
    const standardCookieName = "next-auth.session-token";
    const secureCookieName = "__Secure-next-auth.session-token";

    const [standardEncoded, secureEncoded] = await Promise.all([
      encode({ token, secret, salt: standardCookieName }),
      encode({ token, secret, salt: secureCookieName }),
    ]);

    const baseCookieAttrs = `Path=/; HttpOnly; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}`;

    const headers = new Headers();
    headers.append(
      "Set-Cookie",
      `${standardCookieName}=${standardEncoded}; ${baseCookieAttrs}`,
    );

    // Only mark the secure cookie as Secure when we're on https.
    // If we add "Secure" while you're browsing over http, the browser will ignore it.
    const reqUrl = new URL(request.url);
    const isHttps = reqUrl.protocol === "https:";
    if (isHttps) {
      headers.append(
        "Set-Cookie",
        `${secureCookieName}=${secureEncoded}; ${baseCookieAttrs}; Secure`,
      );
    }

    return Response.json(
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          system_role: effectiveSystemRole,
          avatar_url: user.avatar_url,
        },
        jwt: "mobile-session-token",
      },
      {
        headers,
      },
    );
  } catch (error) {
    console.error("Login error:", error);
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
