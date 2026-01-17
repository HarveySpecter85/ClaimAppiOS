import { getToken } from "@auth/core/jwt";

export async function POST(request) {
  // This route clears both the secure and non-secure session cookie variants.
  // We don't strictly need to validate a token here, but we do it defensively.
  try {
    await Promise.all([
      getToken({
        req: request,
        secret: process.env.AUTH_SECRET,
        secureCookie: true,
      }),
      getToken({
        req: request,
        secret: process.env.AUTH_SECRET,
        secureCookie: false,
      }),
    ]);
  } catch (e) {
    // ignore
  }

  const base = "Path=/; HttpOnly; SameSite=Lax; Max-Age=0";
  const standardCookieName = "next-auth.session-token";
  const secureCookieName = "__Secure-next-auth.session-token";

  const headers = new Headers();
  headers.append("Set-Cookie", `${standardCookieName}=; ${base}`);
  headers.append("Set-Cookie", `${secureCookieName}=; ${base}; Secure`);

  return Response.json({ ok: true }, { headers });
}
