import sql from "@/app/api/utils/sql";
import { notifyAllDevices } from "@/app/api/utils/notifications";
import { requireRole } from "@/app/api/utils/auth";

export async function GET(request) {
  const { authorized, response, user } = await requireRole(request, []);
  if (!authorized) return response;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search");
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");
  const sortBy = searchParams.get("sortBy") || "created_at";

  let query = `
    SELECT 
      i.*,
      e.full_name as employee_name,
      c.name as client_name,
      c.location as client_location
    FROM incidents i
    LEFT JOIN employees e ON i.employee_id = e.id
    LEFT JOIN clients c ON i.client_id = c.id
    WHERE 1=1
  `;
  const params = [];
  let paramCount = 1;

  // Phase 3: Client Access Control
  if (user.system_role !== "global_admin") {
    if (user.client_ids.length === 0) {
      // User has no clients assigned, return empty list
      return Response.json([]);
    }
    // Filter by assigned clients
    // We can't easily use "IN ($1, $2)" with variable array length in this simple builder
    // So we use ANY($1) with an array
    query += ` AND i.client_id = ANY($${paramCount})`;
    params.push(user.client_ids);
    paramCount++;
  }

  if (search) {
    query += ` AND (
      LOWER(i.incident_number) LIKE LOWER($${paramCount})
      OR LOWER(i.incident_type) LIKE LOWER($${paramCount})
      OR LOWER(i.location) LIKE LOWER($${paramCount})
      OR LOWER(e.full_name) LIKE LOWER($${paramCount})
    )`;
    params.push(`%${search}%`);
    paramCount++;
  }

  if (status) {
    query += ` AND i.status = $${paramCount}`;
    params.push(status);
    paramCount++;
  }

  if (priority) {
    query += ` AND i.priority = $${paramCount}`;
    params.push(priority);
    paramCount++;
  }

  query += ` ORDER BY i.${sortBy} DESC`;

  const rows = await sql(query, params);
  return Response.json(rows);
}

export async function POST(request) {
  const body = await request.json();

  // Validate required client_id - no fallback to arbitrary values
  if (!body.client_id) {
    return Response.json(
      { error: "client_id is required" },
      { status: 400 }
    );
  }

  const incidentNumber = `INC-${Math.floor(Math.random() * 9000) + 1000}`;

  const rows = await sql`
    INSERT INTO incidents (
      incident_number,
      employee_id,
      client_id,
      incident_date,
      incident_time,
      incident_type,
      severity,
      location,
      site_area,
      address,
      description,
      body_parts_injured,
      date_reported_to_employer,
      reported_to_name,
      status,
      priority
    ) VALUES (
      ${incidentNumber},
      ${body.employee_id || null},
      ${body.client_id || null},
      ${body.incident_date},
      ${body.incident_time},
      ${body.incident_type},
      ${body.severity},
      ${body.location},
      ${body.site_area || null},
      ${body.address || null},
      ${body.description || null},
      ${body.body_parts_injured || []},
      ${body.date_reported_to_employer || null},
      ${body.reported_to_name || null},
      ${body.status || "open"},
      ${body.priority || "medium"}
    )
    RETURNING *
  `;

  if (body.analysis_data) {
    await sql`
      UPDATE incidents 
      SET analysis_data = ${JSON.stringify(body.analysis_data)}
      WHERE id = ${rows[0].id}
    `;
    rows[0].analysis_data = body.analysis_data;
  }

  // Notify Safety Team (All devices for now)
  const newIncident = rows[0];
  const severityEmoji =
    newIncident.severity === "critical"
      ? "🚨"
      : newIncident.severity === "high"
        ? "⚠️"
        : "📝";

  await notifyAllDevices(
    `${severityEmoji} New Incident: ${newIncident.incident_number}`,
    `${newIncident.incident_type} reported at ${newIncident.location}. Severity: ${newIncident.severity}`,
    { incidentId: newIncident.id },
  );

  return Response.json(rows[0]);
}
