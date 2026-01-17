import sql from "@/app/api/utils/sql";
import { createHash } from "crypto";
import { encode } from "@auth/core/jwt";

export async function GET(request) {
  try {
    // Get token from URL params instead of request body for GET request
    const url = new URL(request.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return Response.json({ error: "Token is required" }, { status: 400 });
    }

    // Hash the token to match against database
    const tokenHash = createHash("sha256").update(token).digest("hex");

    // Find and validate the token
    const tokenRows = await sql`
      SELECT * FROM secure_form_links 
      WHERE token_hash = ${tokenHash} 
      AND form_type = 'admin_panel_access'
      AND expires_at > NOW()
      AND revoked_at IS NULL
    `;

    const tokenRecord = tokenRows[0];
    if (!tokenRecord) {
      return Response.json(
        { error: "Invalid or expired token" },
        { status: 401 },
      );
    }

    // Revoke the token immediately (one-time use)
    await sql`
      UPDATE secure_form_links 
      SET revoked_at = NOW() 
      WHERE id = ${tokenRecord.id}
    `;

    // Find the user associated with this token
    const userRows = await sql`
      SELECT * FROM admin_users 
      WHERE LOWER(email) = LOWER(${tokenRecord.recipient_contact})
    `;

    const user = userRows[0];
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const effectiveSystemRole =
      user.system_role ||
      (user.role === "global_admin" ? "global_admin" : "standard");

    // Create JWT session for the user
    const token_data = {
      name: user.name,
      email: user.email,
      sub: user.id.toString(),
      picture: user.avatar_url,
      role: user.role,
      system_role: effectiveSystemRole,
    };

    const secret = process.env.AUTH_SECRET;

    // Set both cookie variants to ensure compatibility
    const standardCookieName = "next-auth.session-token";
    const secureCookieName = "__Secure-next-auth.session-token";

    const [standardEncoded, secureEncoded] = await Promise.all([
      encode({ token: token_data, secret, salt: standardCookieName }),
      encode({ token: token_data, secret, salt: secureCookieName }),
    ]);

    const baseCookieAttrs = `Path=/; HttpOnly; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}`;

    const headers = new Headers();
    headers.append(
      "Set-Cookie",
      `${standardCookieName}=${standardEncoded}; ${baseCookieAttrs}`,
    );

    // Add secure cookie if we're on HTTPS
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
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          system_role: effectiveSystemRole,
        },
      },
      { headers },
    );
  } catch (error) {
    console.error("Error validating temporary access token:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
