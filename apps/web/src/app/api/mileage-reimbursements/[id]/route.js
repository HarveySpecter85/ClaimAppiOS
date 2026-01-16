import sql from "@/app/api/utils/sql";
import { requireRole } from "@/app/api/utils/auth";

export async function GET(request, { params }) {
  const { authorized, response, user } = await requireRole(request, []);
  if (!authorized) return response;

  try {
    const { id } = params;

    const reimbursements = await sql`
      SELECT * FROM mileage_reimbursements WHERE id = ${id}
    `;

    if (reimbursements.length === 0) {
      return Response.json(
        { error: "Reimbursement not found" },
        { status: 404 },
      );
    }

    // Also fetch trip entries
    const tripEntries = await sql`
      SELECT * FROM trip_entries 
      WHERE reimbursement_id = ${id}
      ORDER BY trip_date DESC
    `;

    const reimbursement = reimbursements[0];
    reimbursement.trip_entries = tripEntries;

    return Response.json(reimbursement);
  } catch (error) {
    console.error("Error fetching mileage reimbursement:", error);
    return Response.json(
      { error: "Failed to fetch mileage reimbursement" },
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
    const { employee_signature_url, date_signed, status, trip_entries } = body;

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (employee_signature_url !== undefined) {
      updates.push(`employee_signature_url = $${paramCount++}`);
      values.push(employee_signature_url);
    }
    if (date_signed !== undefined) {
      updates.push(`date_signed = $${paramCount++}`);
      values.push(date_signed);
    }
    if (status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      values.push(status);
    }

    updates.push(`updated_at = NOW()`);

    if (updates.length > 0) {
      values.push(id);
      const query = `UPDATE mileage_reimbursements SET ${updates.join(", ")} WHERE id = $${paramCount} RETURNING *`;
      const reimbursements = await sql(query, values);

      if (reimbursements.length === 0) {
        return Response.json(
          { error: "Reimbursement not found" },
          { status: 404 },
        );
      }

      return Response.json(reimbursements[0]);
    }

    const reimbursements =
      await sql`SELECT * FROM mileage_reimbursements WHERE id = ${id}`;
    return Response.json(reimbursements[0]);
  } catch (error) {
    console.error("Error updating mileage reimbursement:", error);
    return Response.json(
      { error: "Failed to update mileage reimbursement" },
      { status: 500 },
    );
  }
}

export async function DELETE(request, { params }) {
  const { authorized, response, user } = await requireRole(request, []);
  if (!authorized) return response;

  try {
    const { id } = params;

    await sql`DELETE FROM mileage_reimbursements WHERE id = ${id}`;

    return Response.json({ message: "Reimbursement deleted successfully" });
  } catch (error) {
    console.error("Error deleting mileage reimbursement:", error);
    return Response.json(
      { error: "Failed to delete mileage reimbursement" },
      { status: 500 },
    );
  }
}
