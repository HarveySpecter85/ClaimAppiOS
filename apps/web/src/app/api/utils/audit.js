import sql from "@/app/api/utils/sql";

/**
 * Registra un evento de auditoría en la base de datos.
 *
 * @param {Object} params
 * @param {string} params.entityType - El nombre de la entidad (ej: 'incident', 'client')
 * @param {number} params.entityId - El ID de la entidad
 * @param {string} params.actionType - Tipo de acción ('CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE')
 * @param {Object} params.performedBy - Objeto con { id, name } del usuario que realizó la acción
 * @param {Object} [params.oldData] - Objeto con los datos ANTES del cambio (para UPDATE)
 * @param {Object} [params.newData] - Objeto con los datos DESPUES del cambio (para UPDATE)
 * @param {Object} [params.changes] - Si ya calculaste los cambios, pásalos directamente
 */
export async function logAudit({
  entityType,
  entityId,
  actionType,
  performedBy,
  oldData,
  newData,
  changes,
}) {
  try {
    let changeLog = changes || {};

    // Si no se pasaron cambios explícitos pero sí oldData y newData, calculamos la diferencia
    if (!changes && oldData && newData && actionType === "UPDATE") {
      changeLog = calculateDifferences(oldData, newData);

      // Si no hubo cambios reales, no guardamos log (opcional, pero reduce ruido)
      if (Object.keys(changeLog).length === 0) {
        return;
      }
    }

    // Si es CREATE, podemos guardar un snapshot inicial o dejar changes vacío
    if (actionType === "CREATE" && newData) {
      changeLog = { initial_state: newData };
    }

    await sql`
      INSERT INTO audit_logs (
        entity_type, 
        entity_id, 
        action_type, 
        performed_by_id, 
        performed_by_name, 
        changes
      ) VALUES (
        ${entityType},
        ${entityId},
        ${actionType},
        ${performedBy?.id || null},
        ${performedBy?.name || "System/Unknown"},
        ${JSON.stringify(changeLog)}
      )
    `;
  } catch (error) {
    // Fallar silenciosamente es una opción, pero para auditoría crítica es mejor saberlo.
    // En producción, esto debería ir a un servicio de logging de errores (Sentry, etc.)
    console.error("FAILED TO CREATE AUDIT LOG:", error);
  }
}

/**
 * Compara dos objetos y retorna las diferencias.
 * Formato: { key: { old: val1, new: val2 } }
 */
function calculateDifferences(oldObj, newObj) {
  const diff = {};

  // Claves combinadas de ambos objetos para asegurar que no perdemos nada
  const allKeys = new Set([
    ...Object.keys(oldObj || {}),
    ...Object.keys(newObj || {}),
  ]);

  // Campos a ignorar siempre (metadata de DB)
  const ignoredFields = ["updated_at", "created_at", "analysis_data"]; // analysis_data es complejo, quizás tratar aparte

  for (const key of allKeys) {
    if (ignoredFields.includes(key)) continue;

    const oldVal = oldObj ? oldObj[key] : undefined;
    const newVal = newObj ? newObj[key] : undefined;

    // Comparación simple (funciona para primitivos y fechas string ISO)
    // Para objetos complejos/arrays, JSON.stringify es una aproximación rápida
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      diff[key] = {
        old: oldVal,
        new: newVal,
      };
    }
  }

  return diff;
}
