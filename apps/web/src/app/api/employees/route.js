import sql from "@/app/api/utils/sql";
import { logAudit } from "@/app/api/utils/audit";
import { requireRole } from "@/app/api/utils/auth";

export async function GET(request) {
  const { authorized, response, user } = await requireRole(request, []);
  if (!authorized) return response;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search");
  const clientId = searchParams.get("client_id");
  const positionName = searchParams.get("position_name");
  const employeeId = searchParams.get("employee_id");

  // Build dynamic query
  let query = `SELECT e.*, c.name as client_name FROM employees e LEFT JOIN clients c ON e.client_id = c.id WHERE 1=1`;
  const params = [];
  let paramCount = 0;

  // Phase 3: Client Access Control
  if (user.system_role !== "global_admin") {
    if (user.client_ids.length === 0) {
      return Response.json([]);
    }
    paramCount++;
    query += ` AND e.client_id = ANY($${paramCount})`;
    params.push(user.client_ids);
  }

  if (search) {
    paramCount++;
    query += ` AND (LOWER(e.full_name) LIKE LOWER($${paramCount}) OR LOWER(e.employee_id) LIKE LOWER($${paramCount}))`;
    params.push(`%${search}%`);
  }

  if (clientId) {
    paramCount++;
    query += ` AND e.client_id = $${paramCount}`;
    params.push(clientId);
  }

  if (positionName) {
    paramCount++;
    query += ` AND LOWER(e.position_name) LIKE LOWER($${paramCount})`;
    params.push(`%${positionName}%`);
  }

  if (employeeId) {
    paramCount++;
    query += ` AND LOWER(e.employee_id) LIKE LOWER($${paramCount})`;
    params.push(`%${employeeId}%`);
  }

  query += ` ORDER BY e.full_name`;

  if (search) {
    query += ` LIMIT 10`;
  }

  const rows = await sql(query, params);
  return Response.json(rows);
}

export async function POST(request) {
  const { authorized, response } = await requireRole(request, []);
  if (!authorized) return response;

  const body = await request.json();

  const rows = await sql`
    INSERT INTO employees (
      full_name,
      employee_id,
      job_position,
      employment_start_date,
      phone,
      client_id,
      position_name,
      pay_rate,
      role_description,
      hire_date,
      email
    ) VALUES (
      ${body.full_name},
      ${body.employee_id},
      ${body.job_position || null},
      ${body.employment_start_date || null},
      ${body.phone || null},
      ${body.client_id || null},
      ${body.position_name || null},
      ${body.pay_rate || null},
      ${body.role_description || null},
      ${body.hire_date || null},
      ${body.email || null}
    )
    RETURNING *
  `;

  const newData = rows[0];

  // Log Audit for Employee Creation
  const performedBy = body.performed_by_user
    ? body.performed_by_user
    : { id: null, name: "Anonymous/System" };

  await logAudit({
    entityType: "employee",
    entityId: newData.id,
    actionType: "CREATE",
    performedBy,
    newData,
  });

  return Response.json(newData);
}
