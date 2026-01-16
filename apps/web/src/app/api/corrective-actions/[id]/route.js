import sql from "@/app/api/utils/sql";
import { requireRole } from "@/app/api/utils/auth";

export async function PATCH(request, { params }) {
  const { authorized, response, user } = await requireRole(request, []);
  if (!authorized) return response;
  const { id } = params;
  const body = await request.json();

  const updates = [];
  const values = [];
  let paramCount = 1;

  const allowedFields = [
    "title",
    "description",
    "assignee_name",
    "due_date",
    "status",
    "priority_level",
  ];

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updates.push(`${field} = $${paramCount}`);
      values.push(body[field]);
      paramCount++;
    }
  }

  if (body.status === "completed" && body.completed_at === undefined) {
    updates.push(`completed_at = NOW()`);
  }

  if (updates.length === 0) {
    return Response.json({ error: "No fields to update" }, { status: 400 });
  }

  values.push(id);

  const query = `
    UPDATE corrective_actions
    SET ${updates.join(", ")}
    WHERE id = $${paramCount}
    RETURNING *
  `;

  const rows = await sql(query, values);
  return Response.json(rows[0]);
}
