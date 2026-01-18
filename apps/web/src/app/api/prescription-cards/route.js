import sql from "@/app/api/utils/sql";
import { requireRole } from "@/app/api/utils/auth";

export async function GET(request) {
  const { authorized, response, user } = await requireRole(request, []);
  if (!authorized) return response;

  const { searchParams } = new URL(request.url);
  const incident_id = searchParams.get("incident_id");

  if (incident_id) {
    const rows = await sql`
      SELECT *
      FROM prescription_cards
      WHERE incident_id = ${incident_id}
      ORDER BY created_at DESC
    `;
    return Response.json(rows);
  }

  const rows = await sql`
    SELECT *
    FROM prescription_cards
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

  // Validate required fields
  if (!incident_id) {
    return Response.json({ error: "incident_id is required" }, { status: 400 });
  }

  const [row] = await sql`
    INSERT INTO prescription_cards (
      incident_id,
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
      status
    ) VALUES (
      ${incident_id},
      ${patient_full_name || null},
      ${date_of_birth || null},
      ${date_of_injury || null},
      ${bin_number || null},
      ${pcn || null},
      ${member_id || null},
      ${group_name || null},
      ${group_id || null},
      ${authorized_by || null},
      ${investigator_signature_url || null},
      ${consent ?? false},
      ${status || "draft"}
    )
    RETURNING *
  `;

  return Response.json(row);
}
