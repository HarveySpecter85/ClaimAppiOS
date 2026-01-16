import sql from "@/app/api/utils/sql";
import { requireRole } from "@/app/api/utils/auth";

export async function GET(request) {
  const { authorized, response, user } = await requireRole(request, []);
  if (!authorized) return response;
  const { searchParams } = new URL(request.url);
  const incidentId = searchParams.get("incident_id");

  if (incidentId) {
    const rows = await sql`
      SELECT * FROM interviews
      WHERE incident_id = ${incidentId}
      ORDER BY created_at DESC
    `;
    return Response.json(rows);
  }

  return Response.json([]);
}

export async function POST(request) {
  const { authorized, response, user } = await requireRole(request, []);
  if (!authorized) return response;
  const body = await request.json();

  const rows = await sql`
    INSERT INTO interviews (
      incident_id,
      employee_id,
      interviewee_name,
      interviewee_role,
      type,
      audio_recording_url,
      video_recording_url,
      written_statement,
      wearing_ppe,
      area_adequately_lit,
      witnessed_directly,
      status
    ) VALUES (
      ${body.incident_id},
      ${body.employee_id || null},
      ${body.interviewee_name || null},
      ${body.interviewee_role || null},
      ${body.type || "primary"},
      ${body.audio_recording_url || null},
      ${body.video_recording_url || null},
      ${body.written_statement || null},
      ${body.wearing_ppe || null},
      ${body.area_adequately_lit || null},
      ${body.witnessed_directly || null},
      ${body.status || "pending"}
    )
    RETURNING *
  `;

  return Response.json(rows[0]);
}

export async function PUT(request) {
  const { authorized, response, user } = await requireRole(request, []);
  if (!authorized) return response;
  const body = await request.json();

  if (!body.id) {
    return Response.json(
      { error: "ID is required for updates" },
      { status: 400 },
    );
  }

  const updates = [];
  const values = [];
  let paramCount = 1;

  const allowedFields = [
    "audio_recording_url",
    "video_recording_url",
    "written_statement",
    "wearing_ppe",
    "area_adequately_lit",
    "witnessed_directly",
    "status",
  ];

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updates.push(`${field} = $${paramCount}`);
      values.push(body[field]);
      paramCount++;
    }
  }

  if (updates.length === 0) {
    return Response.json({ error: "No fields to update" }, { status: 400 });
  }

  values.push(body.id);

  const query = `
    UPDATE interviews
    SET ${updates.join(", ")}
    WHERE id = $${paramCount}
    RETURNING *
  `;

  const rows = await sql(query, values);
  return Response.json(rows[0]);
}
