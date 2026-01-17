export async function GET(request) {
  try {
    return Response.json({
      message: "Test endpoint working",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in test endpoint:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
