import sql from "@/app/api/utils/sql";
import { requireRole } from "@/app/api/utils/auth";

export async function GET(request, { params }) {
  const { authorized, response, user } = await requireRole(request, []);
  if (!authorized) return response;

  const { id } = params;

  const [row] = await sql`
    SELECT *
    FROM prescription_cards
    WHERE id = ${id}
  `;

  if (!row) {
    return Response.json(
      { error: "Prescription card not found" },
      { status: 404 },
    );
  }

  return Response.json(row);
}

export async function PUT(request, { params }) {
  const { authorized, response, user } = await requireRole(request, []);
  if (!authorized) return response;

  const { id } = params;
  const body = await request.json();

  const {
    patient_full_name,
    date_of_birth,
    date_of_injury,
    bin_number,
    pcn,
    member_id,
    group_name,
    group_id,
    authorized_by,
    investigator_signature_url,
    consent,
    status,
  } = body;

  const [row] = await sql`
    UPDATE prescription_cards
    SET
      patient_full_name = COALESCE(${patient_full_name}, patient_full_name),
      date_of_birth = COALESCE(${date_of_birth}, date_of_birth),
      date_of_injury = COALESCE(${date_of_injury}, date_of_injury),
      bin_number = COALESCE(${bin_number}, bin_number),
      pcn = COALESCE(${pcn}, pcn),
      member_id = COALESCE(${member_id}, member_id),
      group_name = COALESCE(${group_name}, group_name),
      group_id = COALESCE(${group_id}, group_id),
      authorized_by = COALESCE(${authorized_by}, authorized_by),
      investigator_signature_url = COALESCE(${investigator_signature_url}, investigator_signature_url),
      consent = COALESCE(${consent}, consent),
      status = COALESCE(${status}, status),
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;

  return Response.json(row);
}

export async function DELETE(request, { params }) {
  const { authorized, response, user } = await requireRole(request, []);
  if (!authorized) return response;

  const { id } = params;

  await sql`
    DELETE FROM prescription_cards
    WHERE id = ${id}
  `;

  return Response.json({ success: true });
}
