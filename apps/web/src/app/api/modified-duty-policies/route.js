import sql from "@/app/api/utils/sql";
import { requireRole } from "@/app/api/utils/auth";

export async function GET(request) {
  const { authorized, response, user } = await requireRole(request, []);
  if (!authorized) return response;

  try {
    const { searchParams } = new URL(request.url);
    const incidentId = searchParams.get("incident_id");

    if (incidentId) {
      const rows = await sql`
        SELECT *
        FROM modified_duty_policies
        WHERE incident_id = ${incidentId}
        ORDER BY created_at DESC
      `;
      return Response.json(rows);
    }

    const rows = await sql`
      SELECT *
      FROM modified_duty_policies
      ORDER BY created_at DESC
    `;

    return Response.json(rows);
  } catch (error) {
    console.error("Error fetching modified duty policies:", error);
    return Response.json(
      { error: "Failed to fetch modified duty policies" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  const { authorized, response, user } = await requireRole(request, []);
  if (!authorized) return response;

  try {
    const body = await request.json();

    const decision = body.decision === "decline" ? "decline" : "accept";
    const status = body.status === "submitted" ? "submitted" : "draft";

    const [row] = await sql`
      INSERT INTO modified_duty_policies (
        incident_id,
        employee_name,
        employer,
        location,
        modified_position_offered,
        date_offered,
        date_begins,
        hourly_pay_rate,
        weekly_hours,
        shift_start,
        shift_end,
        duties_description,
        decision,
        employee_signature_url,
        employee_signature_date,
        insured_rep_signature_url,
        insured_rep_signature_date,
        status
      ) VALUES (
        ${body.incident_id},
        ${body.employee_name || null},
        ${body.employer || null},
        ${body.location || null},
        ${body.modified_position_offered || null},
        ${body.date_offered || null},
        ${body.date_begins || null},
        ${body.hourly_pay_rate || null},
        ${body.weekly_hours || null},
        ${body.shift_start || null},
        ${body.shift_end || null},
        ${body.duties_description || null},
        ${decision},
        ${body.employee_signature_url || null},
        ${body.employee_signature_date || null},
        ${body.insured_rep_signature_url || null},
        ${body.insured_rep_signature_date || null},
        ${status}
      )
      RETURNING *
    `;

    return Response.json(row, { status: 201 });
  } catch (error) {
    console.error("Error creating modified duty policy:", error);
    return Response.json(
      { error: "Failed to create modified duty policy" },
      { status: 500 },
    );
  }
}
