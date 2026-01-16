import sql from "@/app/api/utils/sql";
import { requireRole } from "@/app/api/utils/auth";

export async function GET(request, { params }) {
  const { authorized, response, user } = await requireRole(request, []);
  if (!authorized) return response;

  const { id } = params;

  const [row] = await sql`
    SELECT * FROM refusal_of_treatments
    WHERE id = ${id}
  `;

  if (!row) {
    return Response.json(
      { error: "Refusal record not found" },
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
    UPDATE refusal_of_treatments
    SET
      employee_name = COALESCE(${employee_name}, employee_name),
      incident_date = COALESCE(${incident_date}, incident_date),
      employer = COALESCE(${employer}, employer),
      treatment_status = COALESCE(${treatment_status}, treatment_status),
      acknowledgment_text = COALESCE(${acknowledgment_text}, acknowledgment_text),
      employee_signature_url = COALESCE(${employee_signature_url}, employee_signature_url),
      date_signed = COALESCE(${date_signed}, date_signed),
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
    DELETE FROM refusal_of_treatments
    WHERE id = ${id}
  `;

  return Response.json({ success: true });
}
