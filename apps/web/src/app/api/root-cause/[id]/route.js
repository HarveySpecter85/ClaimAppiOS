import sql from "@/app/api/utils/sql";
import { requireRole } from "@/app/api/utils/auth";

export async function PATCH(request, { params }) {
  const { authorized, response } = await requireRole(request, []);
  if (!authorized) return response;

  const { id } = params;
  const body = await request.json();

  const updates = [];
  const values = [];
  let paramCount = 1;

  const allowedFields = [
    "answer",
    "supporting_evidence",
    "conclusion",
    "finalized",
    "problem_statement",
  ];

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updates.push(`${field} = $${paramCount}`);
      values.push(body[field]);
      paramCount++;
    }
  }

  if (updates.length === 0) {
    return Response.json({ error: "No fields to update" }, { status: 400 });
  }

  values.push(id);

  const query = `
    UPDATE root_cause_analysis
    SET ${updates.join(", ")}
    WHERE id = $${paramCount}
    RETURNING *
  `;

  const rows = await sql(query, values);
  return Response.json(rows[0]);
}
