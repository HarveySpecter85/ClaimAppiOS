import sql from "@/app/api/utils/sql";

const APP_VERSION = process.env.npm_package_version || "1.0.0";

export async function GET() {
  const timestamp = new Date().toISOString();

  try {
    // Test database connectivity with a simple query
    await sql`SELECT 1`;

    return Response.json(
      {
        status: "healthy",
        timestamp,
        database: "connected",
        version: APP_VERSION,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Health check failed:", error);

    return Response.json(
      {
        status: "unhealthy",
        timestamp,
        database: "disconnected",
        version: APP_VERSION,
        error: error.message,
      },
      { status: 503 }
    );
  }
}
