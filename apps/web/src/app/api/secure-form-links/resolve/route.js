import sql from "@/app/api/utils/sql";
import { createHash } from "crypto";

// NOTE: This endpoint intentionally does NOT use requireRole (JWT authentication).
// It is designed for external users (form recipients) to resolve and validate their
// secure token. The token itself provides authentication - it is SHA-256 hashed and
// validated against the database, with expiration and revocation checks.
// This enables the external form sharing feature to work without requiring login.

function sha256Hex(value) {
  return createHash("sha256").update(String(value)).digest("hex");
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return new Response("token is required", { status: 400 });
  }

  const tokenHash = sha256Hex(token);

  const [row] = await sql`
    SELECT id, incident_id, form_type, form_record_id, recipient_name,
           expires_at, require_access_code, created_at, revoked_at
    FROM secure_form_links
    WHERE token_hash = ${tokenHash}
    LIMIT 1
  `;

  if (!row) {
    return new Response("Not found", { status: 404 });
  }

  if (row.revoked_at) {
    return new Response("Link revoked", { status: 410 });
  }

  const expires = new Date(row.expires_at);
  if (Number.isNaN(expires.getTime()) || expires.getTime() <= Date.now()) {
    return new Response("Link expired", { status: 410 });
  }

  // If an access code is required, do NOT reveal incident_id or recipient info.
  if (row.require_access_code) {
    return Response.json({
      id: row.id,
      form_type: row.form_type,
      expires_at: row.expires_at,
      require_access_code: true,
      locked: true,
    });
  }

  // IMPORTANT: Do not return token_hash or access_code_hash
  return Response.json({
    ...row,
    locked: false,
    is_expired: false,
  });
}
