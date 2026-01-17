import { requireRole } from "@/app/api/utils/auth";

export async function GET(request) {
  // Return the current authenticated user's profile
  const { authorized, user, response } = await requireRole(request, []);

  if (!authorized) {
    return (
      response ||
      new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
    );
  }

  return Response.json(user);
}
