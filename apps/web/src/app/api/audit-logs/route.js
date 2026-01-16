import sql from "@/app/api/utils/sql";
import { requireRole } from "@/app/api/utils/auth";

export async function GET(request) {
  const { authorized, response } = await requireRole(request, ["global_admin"]);
  if (!authorized) return response;

  const { searchParams } = new URL(request.url);
  const entityType = searchParams.get("entityType");
  const entityId = searchParams.get("entityId");

  if (!entityType || !entityId) {
    return Response.json(
      { error: "Missing entityType or entityId" },
      { status: 400 },
    );
  }

  try {
    const logs = await sql`
      SELECT * 
      FROM audit_logs 
      WHERE entity_type = ${entityType} 
        AND entity_id = ${entityId}
      ORDER BY created_at DESC
    `;

    return Response.json(logs);
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
