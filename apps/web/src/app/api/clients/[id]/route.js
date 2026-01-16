import sql from "@/app/api/utils/sql";
import { logAudit } from "@/app/api/utils/audit";
import { requireRole } from "@/app/api/utils/auth";

export async function GET(request, { params }) {
  const { authorized, response, user } = await requireRole(request, []);
  if (!authorized) return response;
  const { id } = params;
  const rows = await sql`SELECT * FROM clients WHERE id = ${id}`;
  if (rows.length === 0) {
    return new Response("Not Found", { status: 404 });
  }
  return Response.json(rows[0]);
}

export async function PUT(request, { params }) {
  const { authorized, response, user } = await requireRole(request, []);
  if (!authorized) return response;
  const { id } = params;
  const body = await request.json();

  // 1. Fetch current state for Audit
  const currentRows = await sql`SELECT * FROM clients WHERE id = ${id}`;
  if (currentRows.length === 0) {
    return new Response("Not Found", { status: 404 });
  }
  const oldData = currentRows[0];

  const rows = await sql`
    UPDATE clients SET
      name = ${body.name},
      location = ${body.location || null},
      address = ${body.address || null},
      contact_name = ${body.contact_name || null},
      contact_phone = ${body.contact_phone || null},
      contact_email = ${body.contact_email || null},
      manager_name = ${body.manager_name || null},
      manager_email = ${body.manager_email || null},
      manager_phone = ${body.manager_phone || null},
      safety_coordinator_name = ${body.safety_coordinator_name || null},
      safety_coordinator_email = ${body.safety_coordinator_email || null},
      safety_coordinator_phone = ${body.safety_coordinator_phone || null},
      logo_url = ${body.logo_url || null},
      primary_color = ${body.primary_color || "#000000"},
      secondary_color = ${body.secondary_color || "#ffffff"}
    WHERE id = ${id}
    RETURNING *
  `;

  if (rows.length === 0) {
    return new Response("Not Found", { status: 404 });
  }

  const newData = rows[0];

  // 2. Log Audit
  const performedBy = body.performed_by_user
    ? body.performed_by_user
    : { id: null, name: "Anonymous/System" };

  await logAudit({
    entityType: "client",
    entityId: id,
    actionType: "UPDATE",
    performedBy,
    oldData,
    newData,
  });

  return Response.json(newData);
}

export async function DELETE(request, { params }) {
  const { authorized, response, user } = await requireRole(request, []);
  if (!authorized) return response;
  const { id } = params;
  await sql`DELETE FROM clients WHERE id = ${id}`;
  return Response.json({ success: true });
}
