import sql from "@/app/api/utils/sql";
import argon2 from "argon2";
import { createHash } from "crypto";

// NOTE: This endpoint intentionally does NOT use requireRole (JWT authentication).
// It is designed for external users (form recipients) who authenticate via:
// 1. A secure token (SHA-256 hashed and validated against the database)
// 2. An optional 6-digit access code (Argon2 hashed)
// This enables unauthenticated external form submissions while maintaining security.

function sha256Hex(value) {
  return createHash("sha256").update(String(value)).digest("hex");
}

export async function POST(request) {
  const body = await request.json();
  const token = body?.token;
  const access_code = body?.access_code;

  if (!token) {
    return new Response("token is required", { status: 400 });
  }

  const tokenHash = sha256Hex(token);

  const [row] = await sql`
    SELECT id, incident_id, form_type, form_record_id, recipient_name,
           expires_at, require_access_code, access_code_hash, created_at, revoked_at
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

  if (row.require_access_code) {
    if (!access_code) {
      return new Response("access_code is required", { status: 400 });
    }

    const ok = await argon2.verify(
      row.access_code_hash || "",
      String(access_code),
    );
    if (!ok) {
      return new Response("Invalid access code", { status: 401 });
    }
  }

  // Successful verification (or no code required)
  return Response.json({
    id: row.id,
    incident_id: row.incident_id,
    form_type: row.form_type,
    form_record_id: row.form_record_id,
    recipient_name: row.recipient_name,
    expires_at: row.expires_at,
    require_access_code: row.require_access_code,
    created_at: row.created_at,
    locked: false,
  });
}
