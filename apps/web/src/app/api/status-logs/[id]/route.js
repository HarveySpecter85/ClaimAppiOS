import sql from "@/app/api/utils/sql";
import { requireRole } from "@/app/api/utils/auth";

export async function GET(request, { params }) {
  const { authorized, response } = await requireRole(request, []);
  if (!authorized) return response;

  const { id } = params;

  const rows = await sql`
    SELECT sl.*,
           e.full_name as employee_name,
           i.incident_date
    FROM status_logs sl
    LEFT JOIN employees e ON sl.employee_id = e.id
    LEFT JOIN incidents i ON sl.incident_id = i.id
    WHERE sl.id = ${id}
  `;

  if (rows.length === 0) {
    return Response.json({ error: "Status log not found" }, { status: 404 });
  }

  return Response.json(rows[0]);
}

export async function PUT(request, { params }) {
  const { authorized, response } = await requireRole(request, []);
  if (!authorized) return response;

  const { id } = params;
  const body = await request.json();

  let query = `UPDATE status_logs SET updated_at = NOW()`;
  const params_array = [];
  let paramCount = 0;

  if (body.week_ending !== undefined) {
    paramCount++;
    query += `, week_ending = $${paramCount}`;
    params_array.push(body.week_ending);
  }

  if (body.employer !== undefined) {
    paramCount++;
    query += `, employer = $${paramCount}`;
    params_array.push(body.employer);
  }

  if (body.status !== undefined) {
    paramCount++;
    query += `, status = $${paramCount}`;
    params_array.push(body.status);

    if (body.status === "submitted") {
      paramCount++;
      query += `, submitted_at = NOW()`;
    }
  }

  paramCount++;
  query += ` WHERE id = $${paramCount} RETURNING *`;
  params_array.push(id);

  const rows = await sql(query, params_array);
  return Response.json(rows[0]);
}

export async function DELETE(request, { params }) {
  const { authorized, response } = await requireRole(request, []);
  if (!authorized) return response;

  const { id } = params;

  await sql`DELETE FROM status_logs WHERE id = ${id}`;
  return Response.json({ success: true });
}
