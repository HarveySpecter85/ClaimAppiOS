import sql from "@/app/api/utils/sql";
import argon2 from "argon2";
import { encode } from "@auth/core/jwt";

// Simple in-memory rate limiting
// 10 attempts per IP per minute
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_ATTEMPTS = 10;
const rateLimitStore = new Map();

function getRateLimitKey(request) {
  // Try to get the client IP from headers (common for proxied requests)
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const cfConnectingIp = request.headers.get("cf-connecting-ip");

  return cfConnectingIp || realIp || forwarded?.split(",")[0]?.trim() || "unknown";
}

function checkRateLimit(ip) {
  const now = Date.now();
  const record = rateLimitStore.get(ip);

  if (!record) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: MAX_ATTEMPTS - 1 };
  }

  // Reset if window expired
  if (now > record.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: MAX_ATTEMPTS - 1 };
  }

  // Check if limit exceeded
  if (record.count >= MAX_ATTEMPTS) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    return { allowed: false, remaining: 0, retryAfter };
  }

  // Increment count
  record.count++;
  return { allowed: true, remaining: MAX_ATTEMPTS - record.count };
}

// Clean up old entries periodically (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(ip);
    }
  }
}, 5 * 60 * 1000);

export async function POST(request) {
  // Check rate limit
  const clientIp = getRateLimitKey(request);
  const rateLimit = checkRateLimit(clientIp);

  if (!rateLimit.allowed) {
    return Response.json(
      {
        error: "Demasiados intentos de inicio de sesion. Intente de nuevo mas tarde.",
        retryAfter: rateLimit.retryAfter,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfter),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

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
