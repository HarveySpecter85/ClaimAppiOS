import sql from "@/app/api/utils/sql";
import { notifyIncidentSubscribers } from "@/app/api/utils/notifications";
import { requireRole } from "@/app/api/utils/auth";

export async function GET(request) {
  const { authorized, response, user } = await requireRole(request, []);
  if (!authorized) return response;
  const { searchParams } = new URL(request.url);
  const incidentId = searchParams.get("incident_id");
  const status = searchParams.get("status");

  let query = `SELECT * FROM corrective_actions WHERE 1=1`;
  const params = [];
  let paramCount = 1;

  if (incidentId) {
    query += ` AND incident_id = $${paramCount}`;
    params.push(incidentId);
    paramCount++;
  }

  if (status) {
    query += ` AND status = $${paramCount}`;
    params.push(status);
    paramCount++;
  }

  query += ` ORDER BY created_at DESC`;

  const rows = await sql(query, params);
  return Response.json(rows);
}

export async function POST(request) {
  const { authorized, response, user } = await requireRole(request, []);
  if (!authorized) return response;
  const body = await request.json();

  const rows = await sql`
    INSERT INTO corrective_actions (
      incident_id,
      title,
      description,
      assignee_name,
      assignee_id,
      due_date,
      status,
      priority_level
    ) VALUES (
      ${body.incident_id},
      ${body.title},
      ${body.description || null},
      ${body.assignee_name || null},
      ${body.assignee_id || null},
      ${body.due_date || null},
      ${body.status || "open"},
      ${body.priority_level || null}
    )
    RETURNING *
  `;

  // Notify incident subscribers about the new action
  await notifyIncidentSubscribers(
    body.incident_id,
    "New Corrective Action Required",
    `Action: ${body.title} has been assigned.`,
  );

  return Response.json(rows[0]);
}
