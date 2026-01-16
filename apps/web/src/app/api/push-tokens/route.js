import sql from "@/app/api/utils/sql";
import { requireRole } from "@/app/api/utils/auth";

export async function POST(request) {
  const { authorized, response } = await requireRole(request, []);
  if (!authorized) return response;

  const body = await request.json();
  const { expo_push_token, device_id, platform } = body;

  if (!expo_push_token) {
    return Response.json(
      { error: "expo_push_token is required" },
      { status: 400 },
    );
  }

  // Upsert the push token
  const rows = await sql`
    INSERT INTO push_tokens (expo_push_token, device_id, platform, updated_at)
    VALUES (${expo_push_token}, ${device_id || null}, ${platform || null}, NOW())
    ON CONFLICT (expo_push_token)
    DO UPDATE SET
      device_id = EXCLUDED.device_id,
      platform = EXCLUDED.platform,
      updated_at = NOW()
    RETURNING *
  `;

  return Response.json(rows[0]);
}

export async function DELETE(request) {
  const { authorized, response } = await requireRole(request, []);
  if (!authorized) return response;

  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return Response.json({ error: "token is required" }, { status: 400 });
  }

  await sql`
    DELETE FROM push_tokens
    WHERE expo_push_token = ${token}
  `;

  return Response.json({ success: true });
}
