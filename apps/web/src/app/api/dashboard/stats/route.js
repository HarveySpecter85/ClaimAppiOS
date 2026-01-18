import sql from "@/app/api/utils/sql";
import { requireRole } from "@/app/api/utils/auth";

export async function GET(request) {
  const { authorized, response, user } = await requireRole(request, []);
  if (!authorized) return response;

  // Client isolation: global_admin sees all, others see only their clients' data
  const isGlobalAdmin = user.system_role === "global_admin";
  const clientIds = user.client_ids || [];

  // If user has no client access and is not global admin, return empty stats
  if (!isGlobalAdmin && clientIds.length === 0) {
    return Response.json({
      total: 0,
      open: 0,
      critical: 0,
      statusBreakdown: [],
      recentActivity: [],
      trend: [],
      typeBreakdown: [],
    });
  }

  // Build client filter for queries
  const clientFilter = isGlobalAdmin ? sql`` : sql`WHERE client_id = ANY(${clientIds})`;
  const clientFilterAnd = isGlobalAdmin ? sql`` : sql`AND client_id = ANY(${clientIds})`;

  const [totalIncidents] = await sql`
    SELECT COUNT(*) as count FROM incidents ${clientFilter}
  `;

  const [openIncidents] = await sql`
    SELECT COUNT(*) as count FROM incidents WHERE status = 'open' ${clientFilterAnd}
  `;

  const [criticalIncidents] = await sql`
    SELECT COUNT(*) as count FROM incidents WHERE severity = 'critical' ${clientFilterAnd}
  `;

  const statusBreakdown = isGlobalAdmin
    ? await sql`
        SELECT status, COUNT(*) as count
        FROM incidents
        GROUP BY status
      `
    : await sql`
        SELECT status, COUNT(*) as count
        FROM incidents
        WHERE client_id = ANY(${clientIds})
        GROUP BY status
      `;

  const recentActivity = isGlobalAdmin
    ? await sql`
        SELECT
          i.incident_number,
          i.incident_type,
          i.status,
          i.created_at,
          e.full_name as employee_name,
          c.name as client_name
        FROM incidents i
        LEFT JOIN employees e ON i.employee_id = e.id
        LEFT JOIN clients c ON i.client_id = c.id
        ORDER BY i.created_at DESC
        LIMIT 5
      `
    : await sql`
        SELECT
          i.incident_number,
          i.incident_type,
          i.status,
          i.created_at,
          e.full_name as employee_name,
          c.name as client_name
        FROM incidents i
        LEFT JOIN employees e ON i.employee_id = e.id
        LEFT JOIN clients c ON i.client_id = c.id
        WHERE i.client_id = ANY(${clientIds})
        ORDER BY i.created_at DESC
        LIMIT 5
      `;

  const trend = isGlobalAdmin
    ? await sql`
        SELECT
          to_char(created_at, 'Dy') as day,
          COUNT(*) as count
        FROM incidents
        WHERE created_at > NOW() - INTERVAL '7 days'
        GROUP BY day, created_at::date
        ORDER BY created_at::date ASC
      `
    : await sql`
        SELECT
          to_char(created_at, 'Dy') as day,
          COUNT(*) as count
        FROM incidents
        WHERE created_at > NOW() - INTERVAL '7 days'
          AND client_id = ANY(${clientIds})
        GROUP BY day, created_at::date
        ORDER BY created_at::date ASC
      `;

  const typeBreakdown = isGlobalAdmin
    ? await sql`
        SELECT incident_type, COUNT(*) as count
        FROM incidents
        GROUP BY incident_type
        ORDER BY count DESC
        LIMIT 5
      `
    : await sql`
        SELECT incident_type, COUNT(*) as count
        FROM incidents
        WHERE client_id = ANY(${clientIds})
        GROUP BY incident_type
        ORDER BY count DESC
        LIMIT 5
      `;

  return Response.json({
    total: parseInt(totalIncidents.count),
    open: parseInt(openIncidents.count),
    critical: parseInt(criticalIncidents.count),
    statusBreakdown,
    recentActivity,
    trend,
    typeBreakdown,
  });
}
