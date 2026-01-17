import sql from "@/app/api/utils/sql";
import { createHash, randomBytes } from "crypto";
import { requireRole } from "@/app/api/utils/auth";

export async function GET(request) {
  try {
    const { authorized, user, response } = await requireRole(request, []);
    if (!authorized) {
      return (
        response || Response.json({ error: "Unauthorized" }, { status: 401 })
      );
    }

    // Generate a secure random token
    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");

    // Set expiration (5 minutes from now)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Store the token in database (reuse secure_form_links table)
    await sql`
      INSERT INTO secure_form_links (
        token_hash,
        form_type,
        recipient_name,
        recipient_contact,
        delivery_method,
        expires_at,
        created_at
      ) VALUES (
        ${tokenHash},
        'admin_panel_access',
        ${user?.name || "User"},
        ${user?.email || null},
        'mobile_app',
        ${expiresAt.toISOString()},
        NOW()
      )
    `;

    return Response.json({
      token: rawToken,
      expiresAt: expiresAt.toISOString(),
      accessUrl: `${process.env.APP_URL || "http://localhost:4000"}/auto-login?token=${rawToken}`,
    });
  } catch (error) {
    console.error("Error generating temporary access token:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
