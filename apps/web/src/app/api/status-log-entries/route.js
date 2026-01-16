import sql from "@/app/api/utils/sql";
import { requireRole } from "@/app/api/utils/auth";

export async function GET(request) {
  const { authorized, response } = await requireRole(request, []);
  if (!authorized) return response;

  const { searchParams } = new URL(request.url);
  const statusLogId = searchParams.get("status_log_id");
  const entryDate = searchParams.get("entry_date");

  let query = `SELECT * FROM status_log_entries WHERE 1=1`;
  const params = [];
  let paramCount = 0;

  if (statusLogId) {
    paramCount++;
    query += ` AND status_log_id = $${paramCount}`;
    params.push(statusLogId);
  }

  if (entryDate) {
    paramCount++;
    query += ` AND entry_date = $${paramCount}`;
    params.push(entryDate);
  }

  query += ` ORDER BY entry_date ASC`;

  const rows = await sql(query, params);
  return Response.json(rows);
}

export async function POST(request) {
  const { authorized, response } = await requireRole(request, []);
  if (!authorized) return response;

  const body = await request.json();

  const rows = await sql`
    INSERT INTO status_log_entries (
      status_log_id,
      entry_date,
      content_with_modified_duty,
      pain_scale,
      notes,
      hours_worked,
      client_rep_initials,
      employee_initials,
      status
    ) VALUES (
      ${body.status_log_id},
      ${body.entry_date},
      ${body.content_with_modified_duty || null},
      ${body.pain_scale || null},
      ${body.notes || null},
      ${body.hours_worked || null},
      ${body.client_rep_initials || null},
      ${body.employee_initials || null},
      ${body.status || "pending"}
    )
    RETURNING *
  `;

  return Response.json(rows[0]);
}
