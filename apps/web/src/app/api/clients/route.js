import sql from "@/app/api/utils/sql";
import { requireRole } from "@/app/api/utils/auth";

export async function GET(request) {
  const { authorized, response } = await requireRole(request, []);
  if (!authorized) return response;

  const rows = await sql`SELECT * FROM clients ORDER BY name`;
  return Response.json(rows);
}

export async function POST(request) {
  const { authorized, response } = await requireRole(request, ["global_admin"]);
  if (!authorized) return response;

  const body = await request.json();

  const rows = await sql`
    INSERT INTO clients (
      name,
      location,
      address,
      contact_name,
      contact_phone,
      contact_email,
      manager_name,
      manager_email,
      manager_phone,
      safety_coordinator_name,
      safety_coordinator_email,
      safety_coordinator_phone
    ) VALUES (
      ${body.name},
      ${body.location || null},
      ${body.address || null},
      ${body.contact_name || null},
      ${body.contact_phone || null},
      ${body.contact_email || null},
      ${body.manager_name || null},
      ${body.manager_email || null},
      ${body.manager_phone || null},
      ${body.safety_coordinator_name || null},
      ${body.safety_coordinator_email || null},
      ${body.safety_coordinator_phone || null}
    )
    RETURNING *
  `;

  return Response.json(rows[0]);
}
