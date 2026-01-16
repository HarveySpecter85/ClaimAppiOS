import sql from "@/app/api/utils/sql";
import { requireRole } from "@/app/api/utils/auth";

export async function GET(request) {
  const { authorized, response } = await requireRole(request, []);
  if (!authorized) return response;

  const [totalIncidents] = await sql`
    SELECT COUNT(*) as count FROM incidents
  `;

  const [openIncidents] = await sql`
    SELECT COUNT(*) as count FROM incidents WHERE status = 'open'
  `;

  const [criticalIncidents] = await sql`
    SELECT COUNT(*) as count FROM incidents WHERE severity = 'critical'
  `;

  const statusBreakdown = await sql`
    SELECT status, COUNT(*) as count
    FROM incidents
    GROUP BY status
  `;

  const recentActivity = await sql`
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
  `;

  const trend = await sql`
    SELECT 
      to_char(created_at, 'Dy') as day,
      COUNT(*) as count
    FROM incidents 
    WHERE created_at > NOW() - INTERVAL '7 days'
    GROUP BY day, created_at::date
    ORDER BY created_at::date ASC
  `;

  const typeBreakdown = await sql`
    SELECT incident_type, COUNT(*) as count 
    FROM incidents 
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
