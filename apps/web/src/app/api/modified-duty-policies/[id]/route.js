import sql from "@/app/api/utils/sql";
import { requireRole } from "@/app/api/utils/auth";

export async function GET(request, { params }) {
  const { authorized, response, user } = await requireRole(request, []);
  if (!authorized) return response;

  try {
    const { id } = params;

    const rows = await sql`
      SELECT *
      FROM modified_duty_policies
      WHERE id = ${id}
    `;

    if (rows.length === 0) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    return Response.json(rows[0]);
  } catch (error) {
    console.error("Error fetching modified duty policy:", error);
    return Response.json(
      { error: "Failed to fetch modified duty policy" },
      { status: 500 },
    );
  }
}

export async function PUT(request, { params }) {
  const { authorized, response, user } = await requireRole(request, []);
  if (!authorized) return response;

  try {
    const { id } = params;
    const body = await request.json();

    const updates = [];
    const values = [];
    let paramCount = 1;

    const allowedFields = [
      "employee_name",
      "employer",
      "location",
      "modified_position_offered",
      "date_offered",
      "date_begins",
      "hourly_pay_rate",
      "weekly_hours",
      "shift_start",
      "shift_end",
      "duties_description",
      "decision",
      "employee_signature_url",
      "employee_signature_date",
      "insured_rep_signature_url",
      "insured_rep_signature_date",
      "status",
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field === "decision") {
          const decision = body.decision === "decline" ? "decline" : "accept";
          updates.push(`${field} = $${paramCount}`);
          values.push(decision);
          paramCount++;
          continue;
        }

        if (field === "status") {
          const status = body.status === "submitted" ? "submitted" : "draft";
          updates.push(`${field} = $${paramCount}`);
          values.push(status);
          paramCount++;
          continue;
        }

        updates.push(`${field} = $${paramCount}`);
        values.push(body[field]);
        paramCount++;
      }
    }

    if (updates.length === 0) {
      return Response.json({ error: "No fields to update" }, { status: 400 });
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE modified_duty_policies
      SET ${updates.join(", ")}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const rows = await sql(query, values);
    return Response.json(rows[0]);
  } catch (error) {
    console.error("Error updating modified duty policy:", error);
    return Response.json(
      { error: "Failed to update modified duty policy" },
      { status: 500 },
    );
  }
}

export async function DELETE(request, { params }) {
  const { authorized, response, user } = await requireRole(request, []);
  if (!authorized) return response;

  try {
    const { id } = params;

    await sql`
      DELETE FROM modified_duty_policies
      WHERE id = ${id}
    `;

    return Response.json({ ok: true });
  } catch (error) {
    console.error("Error deleting modified duty policy:", error);
    return Response.json(
      { error: "Failed to delete modified duty policy" },
      { status: 500 },
    );
  }
}
