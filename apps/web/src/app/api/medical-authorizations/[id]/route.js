import sql from "@/app/api/utils/sql";
import { requireRole } from "@/app/api/utils/auth";

export async function GET(request, { params }) {
  const { authorized, response, user } = await requireRole(request, []);
  if (!authorized) return response;

  const { id } = params;

  const [authorization] = await sql`
    SELECT * FROM medical_authorizations
    WHERE id = ${id}
  `;

  if (!authorization) {
    return Response.json({ error: "Authorization not found" }, { status: 404 });
  }

  return Response.json(authorization);
}

export async function PUT(request, { params }) {
  const { authorized, response, user } = await requireRole(request, []);
  if (!authorized) return response;

  const { id } = params;
  const body = await request.json();

  const {
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

  const [authorization] = await sql`
    UPDATE medical_authorizations
    SET
      patient_name = COALESCE(${patient_name}, patient_name),
      date_of_birth = COALESCE(${date_of_birth}, date_of_birth),
      incident_date = COALESCE(${incident_date}, incident_date),
      provider = COALESCE(${provider}, provider),
      include_hiv_aids = COALESCE(${include_hiv_aids}, include_hiv_aids),
      include_mental_health = COALESCE(${include_mental_health}, include_mental_health),
      include_drug_alcohol = COALESCE(${include_drug_alcohol}, include_drug_alcohol),
      patient_initials = COALESCE(${patient_initials}, patient_initials),
      signature_url = COALESCE(${signature_url}, signature_url),
      signed_by = COALESCE(${signed_by}, signed_by),
      signature_date = COALESCE(${signature_date}, signature_date),
      status = COALESCE(${status}, status),
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;

  return Response.json(authorization);
}

export async function DELETE(request, { params }) {
  const { authorized, response, user } = await requireRole(request, []);
  if (!authorized) return response;

  const { id } = params;

  await sql`
    DELETE FROM medical_authorizations
    WHERE id = ${id}
  `;

  return Response.json({ success: true });
}
