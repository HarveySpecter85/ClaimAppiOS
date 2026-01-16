import sql from "@/app/api/utils/sql";
import argon2 from "argon2";
import { createHash, randomBytes } from "crypto";
import { requireRole } from "@/app/api/utils/auth";

function sha256Hex(value) {
  return createHash("sha256").update(String(value)).digest("hex");
}

function getBaseUrl(request) {
  // Prefer explicit APP_URL so links work outside of the current request context
  if (process.env.APP_URL) {
    return process.env.APP_URL;
  }
  return new URL(request.url).origin;
}

function expirationToHours(expiration) {
  if (expiration === "24h") return 24;
  if (expiration === "48h") return 48;
  if (expiration === "7d") return 24 * 7;
  // allow passing a number of hours as well
  const n = Number(expiration);
  if (Number.isFinite(n) && n > 0) return n;
  return null;
}

function generateAccessCode() {
  // 6-digit numeric code
  const n = Math.floor(100000 + Math.random() * 900000);
  return String(n);
}

export async function GET(request) {
  const { authorized, response } = await requireRole(request, []);
  if (!authorized) return response;

  const { searchParams } = new URL(request.url);
  const incident_id = searchParams.get("incident_id");
  const includeExpired = searchParams.get("include_expired") === "true";

  const where = [];
  const values = [];
  let idx = 1;

  if (incident_id) {
    where.push(`incident_id = $${idx++}`);
    values.push(incident_id);
  }

  // Only show non-revoked by default
  where.push("revoked_at IS NULL");

  if (!includeExpired) {
    where.push("expires_at > now()");
  }

  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const query = `
    SELECT id, incident_id, form_type, form_record_id, recipient_name, recipient_contact, delivery_method,
           expires_at, require_access_code, created_at, revoked_at
    FROM secure_form_links
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT 200
  `;

  const rows = await sql(query, values);
  return Response.json(rows);
}

export async function POST(request) {
  const { authorized, response } = await requireRole(request, []);
  if (!authorized) return response;

  const body = await request.json();

  const {
    incident_id,
    form_type,
    form_record_id,
    recipient_name,
    recipient_contact,
    delivery_method,
    expiration,
    require_access_code,
  } = body || {};

  if (!incident_id) {
    return new Response("incident_id is required", { status: 400 });
  }

  if (!form_type) {
    return new Response("form_type is required", { status: 400 });
  }

  const hours = expirationToHours(expiration || "24h");
  if (!hours || hours > 24 * 30) {
    return new Response("Invalid expiration", { status: 400 });
  }

  const token = randomBytes(24).toString("base64url");
  const tokenHash = sha256Hex(token);
  const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);

  let accessCode = null;
  let accessCodeHash = null;

  if (require_access_code) {
    accessCode = generateAccessCode();
    accessCodeHash = await argon2.hash(accessCode);
  }

  const [row] = await sql`
    INSERT INTO secure_form_links (
      token_hash,
      incident_id,
      form_type,
      form_record_id,
      recipient_name,
      recipient_contact,
      delivery_method,
      expires_at,
      require_access_code,
      access_code_hash
    ) VALUES (
      ${tokenHash},
      ${incident_id},
      ${form_type},
      ${form_record_id || null},
      ${recipient_name || null},
      ${recipient_contact || null},
      ${delivery_method || null},
      ${expiresAt},
      ${!!require_access_code},
      ${accessCodeHash}
    )
    RETURNING id, incident_id, form_type, form_record_id, expires_at, require_access_code, created_at
  `;

  const baseUrl = getBaseUrl(request);
  const url = `${baseUrl}/share/${token}`;

  return Response.json({
    ...row,
    url,
    access_code: accessCode,
  });
}
