import { db } from '../db/connection.js';
import { v4 as uuidv4 } from 'uuid';
import { logAudit } from '../middleware/audit.js';

export async function escalateWorkplaceRequest(params: {
  requestId: string;
  triggerType: 'SLA_ESCALATION' | 'MANUAL_ESCALATION' | 'EMERGENCY_ESCALATION';
  triggeredBy?: string;
  triggeredByName: string;
  reason: string;
}) {
  const { requestId, triggerType, triggeredBy, triggeredByName, reason } = params;

  const reqRes = await db.query(
    `SELECT wr.*, d.head_user_id, t.lead_user_id
     FROM workplace_requests wr
     LEFT JOIN departments d ON wr.department_id = d.id
     LEFT JOIN teams t ON wr.team_id = t.id
     WHERE wr.id = $1`,
    [requestId]
  );

  const request = reqRes.rows[0];
  if (!request) throw new Error('Workplace request not found');

  // Escalation destination hierarchy: assigned user -> team lead -> department head -> HR director
  let nextAuthorityId = request.lead_user_id;
  if (!nextAuthorityId || nextAuthorityId === request.assigned_user_id) {
    nextAuthorityId = request.head_user_id;
  }
  if (!nextAuthorityId) {
    const hrLead = await db.query(`SELECT id FROM users WHERE role = 'HR_DIRECTOR' LIMIT 1`);
    nextAuthorityId = hrLead.rows[0]?.id || null;
  }

  const escId = `esc-${uuidv4()}`;
  const now = new Date().toISOString();

  // 1. Record escalation
  await db.query(
    `INSERT INTO request_escalations (id, request_id, trigger_type, triggered_by, from_authority_id, to_authority_id, reason, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'ACTIVE')`,
    [escId, requestId, triggerType, triggeredBy || null, request.assigned_user_id, nextAuthorityId, reason]
  );

  // 2. Update request status to ESCALATED
  await db.query(
    `UPDATE workplace_requests
     SET status = 'ESCALATED',
         assigned_user_id = COALESCE($1, assigned_user_id),
         updated_at = $2
     WHERE id = $3`,
    [nextAuthorityId, now, requestId]
  );

  // 3. Status history entry
  await db.query(
    `INSERT INTO request_status_history (id, request_id, actor_id, actor_name, previous_status, new_status, comment, action_type)
     VALUES ($1, $2, $3, $4, $5, 'ESCALATED', $6, $7)`,
    [`rsh-${uuidv4()}`, requestId, triggeredBy || null, triggeredByName, request.status, reason, triggerType]
  );

  // 4. In-app notification to escalated authority
  if (nextAuthorityId) {
    await db.query(
      `INSERT INTO notifications (id, user_id, title, message, type, reference_type, reference_id)
       VALUES ($1, $2, 'Escalated Request Attention Required', $3, 'ESCALATION', 'WORKPLACE_REQUEST', $4)`,
      [
        `notif-${uuidv4()}`,
        nextAuthorityId,
        `Case ${request.case_number} (${request.title}) has been escalated: ${reason}`,
        requestId,
      ]
    );
  }

  // 5. Notify employee that issue was escalated
  await db.query(
    `INSERT INTO notifications (id, user_id, title, message, type, reference_type, reference_id)
     VALUES ($1, $2, 'Case Escalation Notice', $3, 'INFO', 'WORKPLACE_REQUEST', $4)`,
    [
      `notif-${uuidv4()}`,
      request.employee_id,
      `Your request ${request.case_number} has been escalated to senior oversight to expedite resolution.`,
      requestId,
    ]
  );

  // 6. Audit log
  await logAudit({
    actorId: triggeredBy || null,
    actorName: triggeredByName,
    actorRole: 'SYSTEM_OR_USER',
    action: 'ESCALATE_WORKPLACE_REQUEST',
    entityType: 'WORKPLACE_REQUEST',
    entityId: requestId,
    previousState: { status: request.status, assignedUserId: request.assigned_user_id },
    newState: { status: 'ESCALATED', nextAuthorityId, triggerType, reason },
  });

  return { success: true, escalatedTo: nextAuthorityId };
}
