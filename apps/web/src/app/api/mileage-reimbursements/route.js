import sql from "@/app/api/utils/sql";
import { requireRole } from "@/app/api/utils/auth";

export async function POST(request) {
  const { authorized, response, user } = await requireRole(request, []);
  if (!authorized) return response;

  try {
    const body = await request.json();
    const {
      incident_id,
      employee_id,
      employee_signature_url,
      date_signed,
      status = "draft",
      trip_entries = [],
    } = body;

    // Validate required fields
    if (!incident_id) {
      return Response.json({ error: "incident_id is required" }, { status: 400 });
    }

    // Create the reimbursement record
    const reimbursements = await sql`
      INSERT INTO mileage_reimbursements 
      (incident_id, employee_id, employee_signature_url, date_signed, status)
      VALUES (${incident_id}, ${employee_id}, ${employee_signature_url}, ${date_signed}, ${status})
      RETURNING *
    `;

    const reimbursement = reimbursements[0];

    // Insert trip entries if provided
    if (trip_entries.length > 0) {
      for (const entry of trip_entries) {
        await sql`
          INSERT INTO trip_entries 
          (reimbursement_id, trip_date, start_address, medical_facility, final_destination, round_trip_miles)
          VALUES (
            ${reimbursement.id},
            ${entry.trip_date},
            ${entry.start_address},
            ${entry.medical_facility},
            ${entry.final_destination},
            ${entry.round_trip_miles}
          )
        `;
      }
    }

    return Response.json(reimbursement, { status: 201 });
  } catch (error) {
    console.error("Error creating mileage reimbursement:", error);
    return Response.json(
      { error: "Failed to create mileage reimbursement" },
      { status: 500 },
    );
  }
}

export async function GET(request) {
  const { authorized, response, user } = await requireRole(request, []);
  if (!authorized) return response;

  try {
    const { searchParams } = new URL(request.url);
    const incident_id = searchParams.get("incident_id");

    if (incident_id) {
      const reimbursements = await sql`
        SELECT * FROM mileage_reimbursements 
        WHERE incident_id = ${incident_id}
        ORDER BY created_at DESC
      `;
      return Response.json(reimbursements);
    }

    const reimbursements = await sql`
      SELECT * FROM mileage_reimbursements 
      ORDER BY created_at DESC
    `;
    return Response.json(reimbursements);
  } catch (error) {
    console.error("Error fetching mileage reimbursements:", error);
    return Response.json(
      { error: "Failed to fetch mileage reimbursements" },
      { status: 500 },
    );
  }
}
