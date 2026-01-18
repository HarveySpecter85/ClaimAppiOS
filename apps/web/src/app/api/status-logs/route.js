import sql from "@/app/api/utils/sql";
import { requireRole } from "@/app/api/utils/auth";

export async function GET(request) {
  const { authorized, response } = await requireRole(request, []);
  if (!authorized) return response;

  const { searchParams } = new URL(request.url);
  const incidentId = searchParams.get("incident_id");
  const employeeId = searchParams.get("employee_id");
  const statusLogId = searchParams.get("status_log_id");

  let query = `
    SELECT sl.*, 
           e.full_name as employee_name,
           i.incident_date
    FROM status_logs sl
    LEFT JOIN employees e ON sl.employee_id = e.id
    LEFT JOIN incidents i ON sl.incident_id = i.id
    WHERE 1=1
  `;
  const params = [];
  let paramCount = 0;

  if (incidentId) {
    paramCount++;
    query += ` AND sl.incident_id = $${paramCount}`;
    params.push(incidentId);
  }

  if (employeeId) {
    paramCount++;
    query += ` AND sl.employee_id = $${paramCount}`;
    params.push(employeeId);
  }

  if (statusLogId) {
    paramCount++;
    query += ` AND sl.id = $${paramCount}`;
    params.push(statusLogId);
  }

  query += ` ORDER BY sl.week_ending DESC`;

  const rows = await sql(query, params);
  return Response.json(rows);
}

export async function POST(request) {
  const { authorized, response } = await requireRole(request, []);
  if (!authorized) return response;

  const body = await request.json();

  // Validate required fields
  if (!body.incident_id) {
    return Response.json({ error: "incident_id is required" }, { status: 400 });
  }

  const rows = await sql`
    INSERT INTO status_logs (
      incident_id,
      employee_id,
      week_ending,
      employer,
      status
    ) VALUES (
      ${body.incident_id},
      ${body.employee_id},
      ${body.week_ending},
      ${body.employer || null},
      ${body.status || "draft"}
    )
    RETURNING *
  `;

  return Response.json(rows[0]);
}
