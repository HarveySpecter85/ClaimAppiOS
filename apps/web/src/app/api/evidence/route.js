import sql from "@/app/api/utils/sql";
import { requireRole } from "@/app/api/utils/auth";

export async function GET(request) {
  const { authorized, response, user } = await requireRole(request, []);
  if (!authorized) return response;
  const { searchParams } = new URL(request.url);
  const incidentId = searchParams.get("incident_id");
  const fileType = searchParams.get("file_type");

  let query = `SELECT * FROM evidence WHERE incident_id = $1`;
  const params = [incidentId];
  let paramCount = 2;

  if (fileType && fileType !== "all") {
    query += ` AND file_type = $${paramCount}`;
    params.push(fileType);
    paramCount++;
  }

  query += ` ORDER BY created_at DESC`;

  const rows = await sql(query, params);
  return Response.json(rows);
}

export async function POST(request) {
  const { authorized, response, user } = await requireRole(request, []);
  if (!authorized) return response;
  const body = await request.json();

  const rows = await sql`
    INSERT INTO evidence (
      incident_id,
      file_url,
      file_type,
      file_name,
      file_size,
      note_content,
      uploaded_by,
      upload_status
    ) VALUES (
      ${body.incident_id},
      ${body.file_url},
      ${body.file_type},
      ${body.file_name},
      ${body.file_size || null},
      ${body.note_content || null},
      ${body.uploaded_by || null},
      ${body.upload_status || "synced"}
    )
    RETURNING *
  `;

  return Response.json(rows[0]);
}
