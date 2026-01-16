import sql from "@/app/api/utils/sql";
import { requireRole } from "@/app/api/utils/auth";

export async function GET(request) {
  const { authorized, response, user } = await requireRole(request, []);
  if (!authorized) return response;

  const { searchParams } = new URL(request.url);
  const incident_id = searchParams.get("incident_id");

  if (incident_id) {
    const rows = await sql`
      SELECT * FROM refusal_of_treatments
      WHERE incident_id = ${incident_id}
      ORDER BY created_at DESC
    `;
    return Response.json(rows);
  }

  const rows = await sql`
    SELECT * FROM refusal_of_treatments
    ORDER BY created_at DESC
  `;
  return Response.json(rows);
}

export async function POST(request) {
  const { authorized, response, user } = await requireRole(request, []);
  if (!authorized) return response;

  const body = await request.json();

  const {
    incident_id,
    employee_name,
    incident_date,
    employer,
    treatment_status,
    acknowledgment_text,
    employee_signature_url,
    date_signed,
    status,
  } = body;

  const [row] = await sql`
    INSERT INTO refusal_of_treatments (
      incident_id,
      employee_name,
      incident_date,
      employer,
      treatment_status,
      acknowledgment_text,
      employee_signature_url,
      date_signed,
      status
    ) VALUES (
      ${incident_id},
      ${employee_name || null},
      ${incident_date || null},
      ${employer || null},
      ${treatment_status || null},
      ${acknowledgment_text || null},
      ${employee_signature_url || null},
      ${date_signed || null},
      ${status || "draft"}
    )
    RETURNING *
  `;

  return Response.json(row);
}
