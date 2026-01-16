import sql from "@/app/api/utils/sql";
import { requireRole } from "@/app/api/utils/auth";

export async function GET(request) {
  const { authorized, response } = await requireRole(request, []);
  if (!authorized) return response;

  const { searchParams } = new URL(request.url);
  const incidentId = searchParams.get("incident_id");

  if (!incidentId) {
    return Response.json({ error: "incident_id is required" }, { status: 400 });
  }

  const rows = await sql`
    SELECT * FROM messages
    WHERE incident_id = ${incidentId}
    ORDER BY created_at DESC
  `;

  return Response.json(rows);
}

export async function POST(request) {
  const { authorized, response } = await requireRole(request, []);
  if (!authorized) return response;

  const body = await request.json();
  const { incident_id, sender_name, body: messageBody } = body;

  if (!incident_id || !messageBody) {
    return Response.json(
      { error: "incident_id and body are required" },
      { status: 400 },
    );
  }

  const rows = await sql`
    INSERT INTO messages (incident_id, sender_name, body)
    VALUES (${incident_id}, ${sender_name || "System"}, ${messageBody})
    RETURNING *
  `;

  // Send push notifications to all subscribed devices for this incident
  const subscriptions = await sql`
    SELECT DISTINCT expo_push_token
    FROM push_subscriptions
    WHERE incident_id = ${incident_id}
  `;

  if (subscriptions.length > 0) {
    const pushTokens = subscriptions.map((s) => s.expo_push_token);
    const messages = pushTokens.map((token) => ({
      to: token,
      sound: "default",
      title: `New message on incident`,
      body: messageBody.substring(0, 100),
      data: { incidentId: incident_id, type: "new_message" },
    }));

    // Send to Expo push notification service
    try {
      await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messages),
      });
    } catch (error) {
      console.error("Failed to send push notifications:", error);
    }
  }

  return Response.json(rows[0]);
}
