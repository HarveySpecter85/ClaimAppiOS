import sql from "@/app/api/utils/sql";
import { requireRole } from "@/app/api/utils/auth";

export async function GET(request, { params }) {
  const { authorized, response } = await requireRole(request, ["global_admin"]);
  if (!authorized) return response;

  const { id } = params;

  // Get all roles assigned to this user with client details
  const rows = await sql`
    SELECT 
      ucr.id,
      ucr.client_id,
      ucr.company_role,
      c.name as client_name
    FROM user_client_roles ucr
    JOIN clients c ON ucr.client_id = c.id
    WHERE ucr.user_id = ${id}
    ORDER BY c.name
  `;

  return Response.json(rows);
}

export async function POST(request, { params }) {
  const { authorized, response } = await requireRole(request, ["global_admin"]);
  if (!authorized) return response;

  const { id } = params;
  const { client_id, company_role } = await request.json();

  if (!client_id || !company_role) {
    return new Response("Missing client_id or company_role", { status: 400 });
  }

  // Insert or Update logic? Usually Insert for new role.
  // We should prevent duplicates for the same client.
  try {
    const rows = await sql`
      INSERT INTO user_client_roles (user_id, client_id, company_role, assigned_by)
      VALUES (${id}, ${client_id}, ${company_role}, ${request.headers.get("x-user-id") || null})
      ON CONFLICT (user_id, client_id) 
      DO UPDATE SET company_role = EXCLUDED.company_role
      RETURNING *
    `;
    return Response.json(rows[0]);
  } catch (error) {
    console.error("Error assigning client role:", error);
    return new Response("Failed to assign role", { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { authorized, response } = await requireRole(request, ["global_admin"]);
  if (!authorized) return response;

  const { id } = params; // This is the USER id, but we need the ROLE id?
  // Wait, standard REST would be /api/user-client-roles/[id] to delete a specific role entry.
  // But here we are under /api/admin-users/[id]/client-roles.
  // So maybe DELETE accepts a body with client_id? Or we pass the role ID in the query param?

  // Let's use search params for the role ID to delete
  const url = new URL(request.url);
  const roleId = url.searchParams.get("role_id");

  if (!roleId) {
    return new Response("Missing role_id param", { status: 400 });
  }

  await sql`
    DELETE FROM user_client_roles 
    WHERE id = ${roleId} AND user_id = ${id}
  `;

  return Response.json({ success: true });
}
