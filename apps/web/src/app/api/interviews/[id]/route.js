import sql from "@/app/api/utils/sql";
import { requireRole } from "@/app/api/utils/auth";

export async function GET(request, { params }) {
  const { authorized, response, user } = await requireRole(request, []);
  if (!authorized) return response;
  const { id } = params;

  const [interview] = await sql`
    SELECT 
      i.*,
      inc.incident_number,
      e.full_name as employee_name,
      e.employee_id as employee_number,
      e.job_position as employee_position
    FROM interviews i
    LEFT JOIN incidents inc ON i.incident_id = inc.id
    LEFT JOIN employees e ON i.employee_id = e.id
    WHERE i.id = ${id}
  `;

  if (!interview) {
    return Response.json({ error: "Interview not found" }, { status: 404 });
  }

  const witnesses = await sql`
    SELECT * FROM interview_witnesses
    WHERE interview_id = ${id}
    ORDER BY created_at
  `;

  return Response.json({ ...interview, witnesses });
}

export async function PATCH(request, { params }) {
  const { authorized, response, user } = await requireRole(request, []);
  if (!authorized) return response;
  const { id } = params;
  const body = await request.json();

  const updates = [];
  const values = [];
  let paramCount = 1;

  const allowedFields = [
    "audio_recording_url",
    "written_statement",
    "wearing_ppe",
    "area_adequately_lit",
    "witnessed_directly",
    "status",
  ];

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updates.push(`${field} = $${paramCount}`);
      values.push(body[field]);
      paramCount++;
    }
  }

  if (updates.length === 0) {
    return Response.json({ error: "No fields to update" }, { status: 400 });
  }

  values.push(id);

  const query = `
    UPDATE interviews
    SET ${updates.join(", ")}
    WHERE id = $${paramCount}
    RETURNING *
  `;

  const rows = await sql(query, values);
  return Response.json(rows[0]);
}
