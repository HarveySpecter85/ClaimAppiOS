import sql from "@/app/api/utils/sql";

/**
 * Sends a push notification to a specific set of Expo Push Tokens.
 * @param {string[]} tokens - Array of Expo Push Tokens
 * @param {string} title - Notification Title
 * @param {string} body - Notification Body
 * @param {object} data - Extra data to send with the notification
 */
export async function sendPushNotifications(tokens, title, body, data = {}) {
  if (!tokens || tokens.length === 0) return;

  const messages = tokens.map((token) => ({
    to: token,
    sound: "default",
    title,
    body,
    data,
  }));

  try {
    // Expo allows sending up to 100 messages at once.
    // For a real production app, we should chunk this.
    // For this implementation, we'll assume < 100 tokens for now.
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messages),
    });

    if (!response.ok) {
      console.error("Failed to send push notifications", await response.text());
    }
  } catch (error) {
    console.error("Error sending push notifications:", error);
  }
}

/**
 * Notifies all devices subscribed to a specific incident.
 * @param {number} incidentId - The Incident ID
 * @param {string} title - Notification Title
 * @param {string} body - Notification Body
 * @param {object} extraData - Extra data
 */
export async function notifyIncidentSubscribers(
  incidentId,
  title,
  body,
  extraData = {},
) {
  try {
    const subscriptions = await sql`
      SELECT expo_push_token 
      FROM push_subscriptions 
      WHERE incident_id = ${incidentId}
    `;

    const tokens = subscriptions.map((sub) => sub.expo_push_token);

    // De-duplicate tokens just in case
    const uniqueTokens = [...new Set(tokens)];

    if (uniqueTokens.length > 0) {
      await sendPushNotifications(uniqueTokens, title, body, {
        incidentId,
        ...extraData,
      });
    }
  } catch (error) {
    console.error("Error notifying incident subscribers:", error);
  }
}

/**
 * Notifies ALL registered devices (Use carefully - typically for Admins/Broadcasts)
 * In a real app, this should filter by User Role.
 * @param {string} title
 * @param {string} body
 * @param {object} data
 */
export async function notifyAllDevices(title, body, data = {}) {
  try {
    // In a real scenario, join with a users table to filter by 'admin' role
    const devices = await sql`SELECT expo_push_token FROM push_tokens`;

    const tokens = devices.map((d) => d.expo_push_token);
    const uniqueTokens = [...new Set(tokens)];

    if (uniqueTokens.length > 0) {
      await sendPushNotifications(uniqueTokens, title, body, data);
    }
  } catch (error) {
    console.error("Error notifying all devices:", error);
  }
}
