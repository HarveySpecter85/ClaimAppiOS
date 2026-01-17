import sql from "@/app/api/utils/sql";
import { requireRole } from "@/app/api/utils/auth";

export async function GET(request) {
  // Only global_admin can view all users
  const { authorized, response } = await requireRole(request, ["global_admin"]);
  if (!authorized) return response;

  const users = await sql`
    SELECT id, name, email, role, system_role, avatar_url, created_at
    FROM admin_users
    ORDER BY created_at DESC
  `;
  return Response.json(users);
}

export async function POST(request) {
  // Only global_admin can create users
  const { authorized, response } = await requireRole(request, ["global_admin"]);
  if (!authorized) return response;

  const body = await request.json();
  const { name, email, role, system_role } = body;

  if (!email || !name) {
    return new Response("Missing required fields", { status: 400 });
  }

  const nextRole =
    typeof role === "string" && role.length > 0
      ? role
      : system_role === "global_admin"
        ? "global_admin"
        : "user";

  const nextSystemRole =
    system_role === "global_admin" || nextRole === "global_admin"
      ? "global_admin"
      : "standard";

  try {
    const rows = await sql`
      INSERT INTO admin_users (name, email, role, system_role, avatar_url)
      VALUES (${name}, ${email}, ${nextRole}, ${nextSystemRole}, ${body.avatar_url || null})
      RETURNING id, name, email, role, system_role, avatar_url, created_at
    `;
    return Response.json(rows[0]);
  } catch (error) {
    console.error(error);
    return new Response("Error creating user", { status: 500 });
  }
}
