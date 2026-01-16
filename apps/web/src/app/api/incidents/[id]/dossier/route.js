import sql from "@/app/api/utils/sql";
import { requireRole } from "@/app/api/utils/auth";

export async function GET(request, { params }) {
  const { authorized, response, user } = await requireRole(request, []);
  if (!authorized) return response;
  const { id } = params;

  try {
    // 1. Fetch Incident Details
    const incidents = await sql`
      SELECT 
        i.*,
        e.full_name as employee_name,
        e.employee_id as employee_number,
        e.job_position as employee_position,
        e.phone as employee_phone,
        c.name as client_name,
        c.location as client_location,
        c.contact_name as client_contact,
        c.contact_phone as client_phone,
        c.logo_url as client_logo_url,
        c.primary_color as client_primary_color
      FROM incidents i
      LEFT JOIN employees e ON i.employee_id = e.id
      LEFT JOIN clients c ON i.client_id = c.id
      WHERE i.id = ${id}
    `;

    if (incidents.length === 0) {
      return new Response("Incident not found", { status: 404 });
    }
    const incident = incidents[0];

    // 2. Fetch Evidence
    const evidence = await sql`
      SELECT * FROM evidence WHERE incident_id = ${id} ORDER BY created_at DESC
    `;

    // 3. Fetch Interviews
    const interviews = await sql`
      SELECT * FROM interviews WHERE incident_id = ${id} ORDER BY created_at DESC
    `;

    // 4. Fetch Corrective Actions
    const actions = await sql`
      SELECT * FROM corrective_actions WHERE incident_id = ${id} ORDER BY created_at DESC
    `;

    // 5. Fetch Root Cause Analysis
    const rootCause = await sql`
      SELECT * FROM root_cause_analysis WHERE incident_id = ${id} ORDER BY why_level ASC
    `;

    // 6. Fetch Witnesses
    // We need to loop through interviews to get witnesses or do a join.
    // Let's attach witnesses to their respective interviews if possible, or just send them separately.
    // For simplicity, let's just get all witnesses associated with these interviews.
    const interviewIds = interviews.map((i) => i.id);
    let witnesses = [];
    if (interviewIds.length > 0) {
      witnesses = await sql`
        SELECT * FROM interview_witnesses WHERE interview_id = ANY(${interviewIds})
      `;
    }

    // Attach witnesses to interviews
    const interviewsWithWitnesses = interviews.map((interview) => ({
      ...interview,
      witnesses: witnesses.filter((w) => w.interview_id === interview.id),
    }));

    return Response.json({
      incident,
      evidence,
      interviews: interviewsWithWitnesses,
      correctiveActions: actions,
      rootCause,
    });
  } catch (error) {
    console.error("Error fetching dossier:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
