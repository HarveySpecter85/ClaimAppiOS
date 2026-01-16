import sql from "@/app/api/utils/sql";
import { requireRole } from "@/app/api/utils/auth";

export async function GET(request, { params }) {
  const { authorized, response, user } = await requireRole(request, []);
  if (!authorized) return response;

  try {
    const { id } = params;
    const affidavit = await sql`
      SELECT * FROM benefit_affidavits WHERE id = ${id}
    `;

    if (affidavit.length === 0) {
      return Response.json(
        { error: "Benefit affidavit not found" },
        { status: 404 },
      );
    }

    return Response.json(affidavit[0]);
  } catch (error) {
    console.error("Error fetching benefit affidavit:", error);
    return Response.json(
      { error: "Failed to fetch benefit affidavit" },
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

    const setClauses = [];
    const values = [];
    let paramIndex = 1;

    const allowedFields = [
      "incident_date",
      "date_signed",
      "current_address",
      "employee_signature_url",
      "employee_printed_name",
      "witness_signature_url",
      "witness_printed_name",
      "status",
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        setClauses.push(`${field} = $${paramIndex}`);
        values.push(body[field]);
        paramIndex++;
      }
    }

    if (setClauses.length === 0) {
      return Response.json({ error: "No fields to update" }, { status: 400 });
    }

    setClauses.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE benefit_affidavits 
      SET ${setClauses.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await sql(query, values);

    if (result.length === 0) {
      return Response.json(
        { error: "Benefit affidavit not found" },
        { status: 404 },
      );
    }

    return Response.json(result[0]);
  } catch (error) {
    console.error("Error updating benefit affidavit:", error);
    return Response.json(
      { error: "Failed to update benefit affidavit" },
      { status: 500 },
    );
  }
}

export async function DELETE(request, { params }) {
  const { authorized, response, user } = await requireRole(request, []);
  if (!authorized) return response;

  try {
    const { id } = params;
    const result = await sql`
      DELETE FROM benefit_affidavits WHERE id = ${id} RETURNING *
    `;

    if (result.length === 0) {
      return Response.json(
        { error: "Benefit affidavit not found" },
        { status: 404 },
      );
    }

    return Response.json({ message: "Benefit affidavit deleted successfully" });
  } catch (error) {
    console.error("Error deleting benefit affidavit:", error);
    return Response.json(
      { error: "Failed to delete benefit affidavit" },
      { status: 500 },
    );
  }
}
