import sql from "@/app/api/utils/sql";
import { requireRole } from "@/app/api/utils/auth";

export async function GET(request) {
  const { authorized, response, user } = await requireRole(request, []);
  if (!authorized) return response;

  const { searchParams } = new URL(request.url);
  const incident_id = searchParams.get("incident_id");

  if (incident_id) {
    const authorizations = await sql`
      SELECT * FROM medical_authorizations
      WHERE incident_id = ${incident_id}
      ORDER BY created_at DESC
    `;
    return Response.json(authorizations);
  }

  const authorizations = await sql`
    SELECT * FROM medical_authorizations
    ORDER BY created_at DESC
  `;
  return Response.json(authorizations);
}

export async function POST(request) {
  const { authorized, response, user } = await requireRole(request, []);
  if (!authorized) return response;

  const body = await request.json();

  const {
    incident_id,
    patient_name,
    date_of_birth,
    incident_date,
    provider,
    include_hiv_aids,
    include_mental_health,
    include_drug_alcohol,
    patient_initials,
    signature_url,
    signed_by,
    signature_date,
    status,
  } = body;

  // Validate required fields
  if (!incident_id) {
    return Response.json({ error: "incident_id is required" }, { status: 400 });
  }

  const [authorization] = await sql`
    INSERT INTO medical_authorizations (
      incident_id,
      patient_name,
      date_of_birth,
      incident_date,
      provider,
      include_hiv_aids,
      include_mental_health,
      include_drug_alcohol,
      patient_initials,
      signature_url,
      signed_by,
      signature_date,
      status
    ) VALUES (
      ${incident_id},
      ${patient_name || null},
      ${date_of_birth || null},
      ${incident_date || null},
      ${provider || null},
      ${include_hiv_aids || false},
      ${include_mental_health || false},
      ${include_drug_alcohol || false},
      ${patient_initials || null},
      ${signature_url || null},
      ${signed_by || "patient"},
      ${signature_date || null},
      ${status || "draft"}
    )
    RETURNING *
  `;

  return Response.json(authorization);
}
