import sql from "@/app/api/utils/sql";
import { requireRole } from "@/app/api/utils/auth";

export async function PUT(request, { params }) {
  const { authorized, response } = await requireRole(request, ["global_admin"]);
  if (!authorized) return response;

  const { id } = params;
  const body = await request.json();
  const { role, name, system_role } = body;

  const existingRows = await sql`
    SELECT role, system_role
    FROM admin_users
    WHERE id = ${id}
  `;
  const existing = existingRows[0];

  if (!existing) {
    return new Response("User not found", { status: 404 });
  }

  const nextRole =
    typeof role === "string" && role.length > 0 ? role : existing.role;

  const nextSystemRoleRaw =
    typeof system_role === "string" && system_role.length > 0
      ? system_role
      : existing.system_role ||
        (nextRole === "global_admin" ? "global_admin" : "standard");

  const nextSystemRole =
    nextSystemRoleRaw === "global_admin" ? "global_admin" : "standard";

  const rows = await sql`
    UPDATE admin_users
    SET role = ${nextRole},
        system_role = ${nextSystemRole},
        name = ${name}
    WHERE id = ${id}
    RETURNING id, name, email, role, system_role, avatar_url, created_at
  `;

  return Response.json(rows[0]);
}

export async function DELETE(request, { params }) {
  const { authorized, response } = await requireRole(request, ["global_admin"]);
  if (!authorized) return response;

  const { id } = params;

  await sql`DELETE FROM admin_users WHERE id = ${id}`;

  return Response.json({ success: true });
}
