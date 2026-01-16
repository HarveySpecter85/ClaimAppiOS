import sql from "@/app/api/utils/sql";
import { requireRole } from "@/app/api/utils/auth";

export async function POST(request) {
  const { authorized, response } = await requireRole(request, []);
  if (!authorized) return response;

  try {
    const body = await request.json();
    const {
      reimbursement_id,
      trip_date,
      start_address,
      medical_facility,
      final_destination,
      round_trip_miles,
    } = body;

    const entries = await sql`
      INSERT INTO trip_entries
      (reimbursement_id, trip_date, start_address, medical_facility, final_destination, round_trip_miles)
      VALUES (${reimbursement_id}, ${trip_date}, ${start_address}, ${medical_facility}, ${final_destination}, ${round_trip_miles})
      RETURNING *
    `;

    return Response.json(entries[0], { status: 201 });
  } catch (error) {
    console.error("Error creating trip entry:", error);
    return Response.json(
      { error: "Failed to create trip entry" },
      { status: 500 },
    );
  }
}

export async function GET(request) {
  const { authorized, response } = await requireRole(request, []);
  if (!authorized) return response;

  try {
    const { searchParams } = new URL(request.url);
    const reimbursement_id = searchParams.get("reimbursement_id");

    if (reimbursement_id) {
      const entries = await sql`
        SELECT * FROM trip_entries 
        WHERE reimbursement_id = ${reimbursement_id}
        ORDER BY trip_date DESC
      `;
      return Response.json(entries);
    }

    const entries = await sql`
      SELECT * FROM trip_entries 
      ORDER BY created_at DESC
    `;
    return Response.json(entries);
  } catch (error) {
    console.error("Error fetching trip entries:", error);
    return Response.json(
      { error: "Failed to fetch trip entries" },
      { status: 500 },
    );
  }
}
