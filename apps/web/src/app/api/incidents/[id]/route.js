import sql from "@/app/api/utils/sql";
import { logAudit } from "@/app/api/utils/audit";
import { notifyIncidentSubscribers } from "@/app/api/utils/notifications";
import { requireRole } from "@/app/api/utils/auth";

export async function GET(request, { params }) {
  const { authorized, response, user } = await requireRole(request, []);
  if (!authorized) return response;
  const { id } = params;

  const rows = await sql`
    SELECT 
      i.*,
      e.full_name as employee_name,
      e.employee_id as employee_number,
      e.job_position as employee_position,
      e.phone as employee_phone,
      c.name as client_name,
      c.location as client_location,
      c.contact_name as client_contact,
      c.contact_phone as client_phone,
      c.logo_url as client_logo_url,
      c.primary_color as client_primary_color,
      c.secondary_color as client_secondary_color
    FROM incidents i
    LEFT JOIN employees e ON i.employee_id = e.id
    LEFT JOIN clients c ON i.client_id = c.id
    WHERE i.id = ${id}
  `;

  if (rows.length === 0) {
    return Response.json({ error: "Incident not found" }, { status: 404 });
  }

  return Response.json(rows[0]);
}

export async function PATCH(request, { params }) {
  const { authorized, response, user } = await requireRole(request, []);
  if (!authorized) return response;
  const { id } = params;
  const body = await request.json();

  // 1. Fetch current state for Audit Log
  const currentRows = await sql`SELECT * FROM incidents WHERE id = ${id}`;
  if (currentRows.length === 0) {
    return Response.json({ error: "Incident not found" }, { status: 404 });
  }
  const oldData = currentRows[0];

  // 2. Enforce role for approval/rejection
  const isStatusChange =
    body.status && body.status !== oldData.status;
  const isApprovalOrRejection =
    body.status === "approved" || body.status === "rejected";

  if (isStatusChange && isApprovalOrRejection) {
    const reviewerRoles = ["reviewer", "admin", "global_admin"];
    const hasReviewerRole =
      reviewerRoles.includes(user.system_role) ||
      reviewerRoles.includes(user.role) ||
      user.client_roles?.some((cr) => reviewerRoles.includes(cr.company_role));

    if (!hasReviewerRole) {
      return Response.json(
        { error: "Forbidden: You do not have permission to approve or reject incidents" },
        { status: 403 }
      );
    }
  }

  const updates = [];
  const values = [];
  let paramCount = 1;

  const allowedFields = [
    "status",
    "priority",
    "severity",
    "incident_type",
    "location",
    "site_area",
    "description",
    "body_parts_injured",
    "employee_id",
    "client_id",
    "incident_date",
    "incident_time",
    "date_reported_to_employer",
    "reported_to_name",
    "initial_cause",
    // New Workflow Fields
    "reviewed_by",
    // "reviewed_at" is excluded - set server-side only
    "rejection_reason",
    "submission_date",
  ];

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updates.push(`${field} = $${paramCount}`);
      values.push(body[field]);
      paramCount++;
    }
  }

  // Set reviewed_at server-side when status changes to approved/rejected
  if (isStatusChange && isApprovalOrRejection) {
    updates.push(`reviewed_at = $${paramCount}`);
    values.push(new Date().toISOString());
    paramCount++;
  }

  if (updates.length === 0) {
    return Response.json({ error: "No fields to update" }, { status: 400 });
  }

  updates.push(`updated_at = NOW()`);
  values.push(id);

  const query = `
    UPDATE incidents
    SET ${updates.join(", ")}
    WHERE id = $${paramCount}
    RETURNING *
  `;

  const rows = await sql(query, values);
  const newData = rows[0];

  // 2. Log Audit
  // Attempt to identify user from body (if frontend sends it) or generic fallback
  const performedBy = body.performed_by_user
    ? body.performed_by_user
    : { id: null, name: "Anonymous/System" };

  await logAudit({
    entityType: "incident",
    entityId: id,
    actionType:
      body.status && body.status !== oldData.status
        ? "STATUS_CHANGE"
        : "UPDATE",
    performedBy,
    oldData,
    newData,
  });

  // 3. Notify Subscribers if Status Changed
  if (body.status && body.status !== oldData.status) {
    const statusLabel =
      body.status.charAt(0).toUpperCase() + body.status.slice(1);
    await notifyIncidentSubscribers(
      id,
      `Incident ${newData.incident_number} Update`,
      `Status has been updated to: ${statusLabel}`,
    );
  }

  return Response.json(newData);
}
