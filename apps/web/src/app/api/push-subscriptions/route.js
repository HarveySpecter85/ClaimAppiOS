import sql from "@/app/api/utils/sql";
import { requireRole } from "@/app/api/utils/auth";

export async function POST(request) {
  const { authorized, response } = await requireRole(request, []);
  if (!authorized) return response;

  const body = await request.json();
  const { incident_id, expo_push_token } = body;

  if (!incident_id || !expo_push_token) {
    return Response.json(
      { error: "incident_id and expo_push_token are required" },
      { status: 400 },
    );
  }

  // Subscribe to incident notifications
  const rows = await sql`
    INSERT INTO push_subscriptions (incident_id, expo_push_token)
    VALUES (${incident_id}, ${expo_push_token})
    ON CONFLICT (incident_id, expo_push_token) DO NOTHING
    RETURNING *
  `;

  return Response.json(rows[0] || { success: true });
}

export async function DELETE(request) {
  const { authorized, response } = await requireRole(request, []);
  if (!authorized) return response;

  const { searchParams } = new URL(request.url);
  const incidentId = searchParams.get("incident_id");
  const token = searchParams.get("token");

  if (!incidentId || !token) {
    return Response.json(
      { error: "incident_id and token are required" },
      { status: 400 },
    );
  }

  await sql`
    DELETE FROM push_subscriptions
    WHERE incident_id = ${incidentId} AND expo_push_token = ${token}
  `;

  return Response.json({ success: true });
}
