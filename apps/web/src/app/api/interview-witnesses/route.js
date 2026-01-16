import sql from "@/app/api/utils/sql";
import { requireRole } from "@/app/api/utils/auth";

export async function POST(request) {
  const { authorized, response, user } = await requireRole(request, []);
  if (!authorized) return response;
  const body = await request.json();

  const rows = await sql`
    INSERT INTO interview_witnesses (
      interview_id,
      witness_name,
      witness_role
    ) VALUES (
      ${body.interview_id},
      ${body.witness_name},
      ${body.witness_role || null}
    )
    RETURNING *
  `;

  return Response.json(rows[0]);
}
