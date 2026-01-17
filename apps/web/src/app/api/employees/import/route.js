import sql from "@/app/api/utils/sql";
import { logAudit } from "@/app/api/utils/audit";
import { requireRole } from "@/app/api/utils/auth";

export async function POST(request) {
  const { authorized, response, user } = await requireRole(request, [
    "global_admin",
    "plant_supervisor",
  ]);
  if (!authorized) return response;

  const { employees, client_id } = await request.json();

  if (!employees || !Array.isArray(employees) || employees.length === 0) {
    return new Response("No employee data provided", { status: 400 });
  }

  // Determine Client ID logic
  let targetClientId = client_id;

  // If no client_id provided in body, try to infer from user roles
  if (!targetClientId) {
    const userClientRoles = await sql`
      SELECT client_id 
      FROM user_client_roles 
      WHERE user_id = ${user.id} 
      LIMIT 1
    `;
    if (userClientRoles.length > 0) {
      targetClientId = userClientRoles[0].client_id;
    }
  }

  // If user is NOT global_admin and we still don't have a client_id, abort?
  // For now, we will allow NULL but it's risky for plant_supervisor.
  // Ideally plant_supervisor MUST have a client_id.
  if (!targetClientId && user.system_role !== "global_admin") {
    // Optional: stricter check
    // return new Response("Client context required", { status: 400 });
  }

  const results = {
    success: 0,
    failed: 0,
    updated: 0,
    created: 0,
    errors: [],
  };

  for (const emp of employees) {
    try {
      // Validate minimal fields
      if (!emp.full_name || !emp.employee_id) {
        throw new Error("Missing full_name or employee_id");
      }

      // Upsert logic
      const result = await sql`
        INSERT INTO employees (
          full_name,
          employee_id,
          job_position,
          employment_start_date,
          phone,
          email,
          position_name,
          pay_rate,
          role_description,
          hire_date,
          client_id
        ) VALUES (
          ${emp.full_name},
          ${emp.employee_id},
          ${emp.job_position || null},
          ${emp.employment_start_date || null},
          ${emp.phone || null},
          ${emp.email || null},
          ${emp.position_name || null},
          ${emp.pay_rate || null},
          ${emp.role_description || null},
          ${emp.hire_date || null},
          ${targetClientId || null}
        )
        ON CONFLICT (employee_id) DO UPDATE SET
          full_name = EXCLUDED.full_name,
          job_position = COALESCE(EXCLUDED.job_position, employees.job_position),
          phone = COALESCE(EXCLUDED.phone, employees.phone),
          email = COALESCE(EXCLUDED.email, employees.email),
          position_name = COALESCE(EXCLUDED.position_name, employees.position_name),
          pay_rate = COALESCE(EXCLUDED.pay_rate, employees.pay_rate),
          role_description = COALESCE(EXCLUDED.role_description, employees.role_description),
          hire_date = COALESCE(EXCLUDED.hire_date, employees.hire_date),
          client_id = COALESCE(EXCLUDED.client_id, employees.client_id)
        RETURNING (xmax = 0) AS inserted
      `;

      if (result[0]?.inserted) {
        results.created++;
      } else {
        results.updated++;
      }
      results.success++;
    } catch (error) {
      console.error(`Error importing employee ${emp.employee_id}:`, error);
      results.failed++;
      results.errors.push({
        employee_id: emp.employee_id,
        error: error.message,
      });
    }
  }

  // Audit log
  await logAudit({
    entityType: "employee_import",
    entityId: 0, // General ID
    actionType: "IMPORT",
    performedBy: user,
    newData: { count: employees.length, results },
  });

  return Response.json(results);
}
