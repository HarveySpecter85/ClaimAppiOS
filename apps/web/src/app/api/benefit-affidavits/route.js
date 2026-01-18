import sql from "@/app/api/utils/sql";
import { requireRole } from "@/app/api/utils/auth";

export async function GET(request) {
  const { authorized, response, user } = await requireRole(request, []);
  if (!authorized) return response;

  try {
    const { searchParams } = new URL(request.url);
    const incidentId = searchParams.get("incident_id");

    let affidavits;
    if (incidentId) {
      affidavits = await sql`
        SELECT * FROM benefit_affidavits 
        WHERE incident_id = ${incidentId}
        ORDER BY created_at DESC
      `;
    } else {
      affidavits = await sql`
        SELECT * FROM benefit_affidavits 
        ORDER BY created_at DESC
      `;
    }

    return Response.json(affidavits);
  } catch (error) {
    console.error("Error fetching benefit affidavits:", error);
    return Response.json(
      { error: "Failed to fetch benefit affidavits" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  const { authorized, response, user } = await requireRole(request, []);
  if (!authorized) return response;

  try {
    const body = await request.json();
    const {
      incident_id,
      incident_date,
      date_signed,
      current_address,
      employee_signature_url,
      employee_printed_name,
      witness_signature_url,
      witness_printed_name,
      status = "pending",
    } = body;

    if (!incident_id || !incident_date || !date_signed) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Require employee signature for submitted legal documents
    if (status !== "draft" && !employee_signature_url) {
      return Response.json(
        { error: "employee_signature is required for submitted documents" },
        { status: 400 },
      );
    }

    const result = await sql`
      INSERT INTO benefit_affidavits (
        incident_id,
        incident_date,
        date_signed,
        current_address,
        employee_signature_url,
        employee_printed_name,
        witness_signature_url,
        witness_printed_name,
        status
      ) VALUES (
        ${incident_id},
        ${incident_date},
        ${date_signed},
        ${current_address},
        ${employee_signature_url},
        ${employee_printed_name},
        ${witness_signature_url},
        ${witness_printed_name},
        ${status}
      )
      RETURNING *
    `;

    return Response.json(result[0]);
  } catch (error) {
    console.error("Error creating benefit affidavit:", error);
    return Response.json(
      { error: "Failed to create benefit affidavit" },
      { status: 500 },
    );
  }
}
