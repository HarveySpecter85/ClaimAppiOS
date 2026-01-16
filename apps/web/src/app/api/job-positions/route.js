import sql from "@/app/api/utils/sql";
import { requireRole } from "@/app/api/utils/auth";

export async function GET(request) {
  const { authorized, response } = await requireRole(request, []);
  if (!authorized) return response;

  try {
    const rows = await sql`SELECT * FROM job_positions ORDER BY title ASC`;
    return Response.json(rows);
  } catch (error) {
    console.error("Error fetching job positions:", error);
    return Response.json(
      { error: "Failed to fetch job positions" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  const { authorized, response } = await requireRole(request, []);
  if (!authorized) return response;

  try {
    const { title } = await request.json();

    if (!title || typeof title !== "string") {
      return Response.json({ error: "Invalid title" }, { status: 400 });
    }

    const rows = await sql`
      INSERT INTO job_positions (title)
      VALUES (${title.trim()})
      ON CONFLICT (title) DO UPDATE SET title = EXCLUDED.title
      RETURNING *
    `;

    return Response.json(rows[0]);
  } catch (error) {
    console.error("Error creating job position:", error);
    return Response.json(
      { error: "Failed to create job position" },
      { status: 500 },
    );
  }
}
