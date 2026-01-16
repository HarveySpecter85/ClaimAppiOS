import sql from "@/app/api/utils/sql";
import { requireRole } from "@/app/api/utils/auth";

export async function GET(request) {
  const { authorized, response } = await requireRole(request, []);
  if (!authorized) return response;

  try {
    const physicians = await sql`
      SELECT * FROM panel_physicians
      ORDER BY location ASC, created_at DESC
    `;
    return Response.json(physicians);
  } catch (error) {
    console.error("Error fetching panel physicians:", error);
    return Response.json(
      { error: "Failed to fetch panel physicians" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  const { authorized, response } = await requireRole(request, []);
  if (!authorized) return response;

  try {
    const body = await request.json();
    const { location, file_url, file_name, file_type } = body;

    if (!location || !file_url || !file_name) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const [newPhysician] = await sql`
      INSERT INTO panel_physicians (location, file_url, file_name, file_type)
      VALUES (${location}, ${file_url}, ${file_name}, ${file_type})
      RETURNING *
    `;

    return Response.json(newPhysician);
  } catch (error) {
    console.error("Error creating panel physician:", error);
    return Response.json(
      { error: "Failed to create panel physician" },
      { status: 500 },
    );
  }
}
