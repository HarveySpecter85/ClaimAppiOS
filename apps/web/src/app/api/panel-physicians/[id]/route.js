import sql from "@/app/api/utils/sql";
import { requireRole } from "@/app/api/utils/auth";

export async function DELETE(request, { params }) {
  const { authorized, response } = await requireRole(request, []);
  if (!authorized) return response;

  try {
    const { id } = params;

    await sql`
      DELETE FROM panel_physicians
      WHERE id = ${id}
    `;

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error deleting panel physician:", error);
    return Response.json(
      { error: "Failed to delete panel physician" },
      { status: 500 },
    );
  }
}
