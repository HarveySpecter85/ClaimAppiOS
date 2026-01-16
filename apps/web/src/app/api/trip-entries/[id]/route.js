import sql from "@/app/api/utils/sql";
import { requireRole } from "@/app/api/utils/auth";

export async function PUT(request, { params }) {
  const { authorized, response } = await requireRole(request, []);
  if (!authorized) return response;

  try {
    const { id } = params;
    const body = await request.json();
    const {
      trip_date,
      start_address,
      medical_facility,
      final_destination,
      round_trip_miles,
    } = body;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (trip_date !== undefined) {
      updates.push(`trip_date = $${paramCount++}`);
      values.push(trip_date);
    }
    if (start_address !== undefined) {
      updates.push(`start_address = $${paramCount++}`);
      values.push(start_address);
    }
    if (medical_facility !== undefined) {
      updates.push(`medical_facility = $${paramCount++}`);
      values.push(medical_facility);
    }
    if (final_destination !== undefined) {
      updates.push(`final_destination = $${paramCount++}`);
      values.push(final_destination);
    }
    if (round_trip_miles !== undefined) {
      updates.push(`round_trip_miles = $${paramCount++}`);
      values.push(round_trip_miles);
    }

    if (updates.length > 0) {
      values.push(id);
      const query = `UPDATE trip_entries SET ${updates.join(", ")} WHERE id = $${paramCount} RETURNING *`;
      const entries = await sql(query, values);

      if (entries.length === 0) {
        return Response.json(
          { error: "Trip entry not found" },
          { status: 404 },
        );
      }

      return Response.json(entries[0]);
    }

    const entries = await sql`SELECT * FROM trip_entries WHERE id = ${id}`;
    return Response.json(entries[0]);
  } catch (error) {
    console.error("Error updating trip entry:", error);
    return Response.json(
      { error: "Failed to update trip entry" },
      { status: 500 },
    );
  }
}

export async function DELETE(request, { params }) {
  const { authorized, response } = await requireRole(request, []);
  if (!authorized) return response;

  try {
    const { id } = params;

    await sql`DELETE FROM trip_entries WHERE id = ${id}`;

    return Response.json({ message: "Trip entry deleted successfully" });
  } catch (error) {
    console.error("Error deleting trip entry:", error);
    return Response.json(
      { error: "Failed to delete trip entry" },
      { status: 500 },
    );
  }
}
