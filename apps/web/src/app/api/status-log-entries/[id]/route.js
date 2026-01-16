import sql from "@/app/api/utils/sql";
import { requireRole } from "@/app/api/utils/auth";

export async function GET(request, { params }) {
  const { authorized, response } = await requireRole(request, []);
  if (!authorized) return response;

  const { id } = params;

  const rows = await sql`
    SELECT * FROM status_log_entries WHERE id = ${id}
  `;

  if (rows.length === 0) {
    return Response.json({ error: "Entry not found" }, { status: 404 });
  }

  return Response.json(rows[0]);
}

export async function PUT(request, { params }) {
  const { authorized, response } = await requireRole(request, []);
  if (!authorized) return response;

  const { id } = params;
  const body = await request.json();

  let query = `UPDATE status_log_entries SET updated_at = NOW()`;
  const params_array = [];
  let paramCount = 0;

  if (body.content_with_modified_duty !== undefined) {
    paramCount++;
    query += `, content_with_modified_duty = $${paramCount}`;
    params_array.push(body.content_with_modified_duty);
  }

  if (body.pain_scale !== undefined) {
    paramCount++;
    query += `, pain_scale = $${paramCount}`;
    params_array.push(body.pain_scale);
  }

  if (body.notes !== undefined) {
    paramCount++;
    query += `, notes = $${paramCount}`;
    params_array.push(body.notes);
  }

  if (body.hours_worked !== undefined) {
    paramCount++;
    query += `, hours_worked = $${paramCount}`;
    params_array.push(body.hours_worked);
  }

  if (body.client_rep_initials !== undefined) {
    paramCount++;
    query += `, client_rep_initials = $${paramCount}`;
    params_array.push(body.client_rep_initials);
  }

  if (body.employee_initials !== undefined) {
    paramCount++;
    query += `, employee_initials = $${paramCount}`;
    params_array.push(body.employee_initials);
  }

  if (body.status !== undefined) {
    paramCount++;
    query += `, status = $${paramCount}`;
    params_array.push(body.status);
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

  await sql`DELETE FROM status_log_entries WHERE id = ${id}`;
  return Response.json({ success: true });
}
