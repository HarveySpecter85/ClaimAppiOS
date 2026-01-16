import sql from "@/app/api/utils/sql";
import { requireRole } from "@/app/api/utils/auth";

export async function GET(request) {
  const { authorized, response } = await requireRole(request, []);
  if (!authorized) return response;

  const { searchParams } = new URL(request.url);
  const incidentId = searchParams.get("incident_id");

  if (incidentId) {
    const rows = await sql`
      SELECT * FROM root_cause_analysis
      WHERE incident_id = ${incidentId}
      ORDER BY why_level
    `;
    return Response.json(rows);
  }

  return Response.json([]);
}

export async function POST(request) {
  const { authorized, response } = await requireRole(request, []);
  if (!authorized) return response;

  const body = await request.json();

  const rows = await sql`
    INSERT INTO root_cause_analysis (
      incident_id,
      problem_statement,
      why_level,
      question,
      answer,
      supporting_evidence,
      conclusion,
      finalized
    ) VALUES (
      ${body.incident_id},
      ${body.problem_statement},
      ${body.why_level},
      ${body.question},
      ${body.answer || null},
      ${body.supporting_evidence || null},
      ${body.conclusion || null},
      ${body.finalized || false}
    )
    RETURNING *
  `;

  return Response.json(rows[0]);
}
