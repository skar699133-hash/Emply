import { db } from '../db/connection.js';
import { v4 as uuidv4 } from 'uuid';
import { logAudit } from '../middleware/audit.js';
export async function submitLeaveReconsideration(params) {
    const { leaveRequestId, employeeId, employeeName, reconsiderationReason } = params;
    // Verify leave request
    const leaveRes = await db.query(`SELECT lr.*, lt.importance_level, u.manager_id
     FROM leave_requests lr
     JOIN leave_types lt ON lr.leave_type_id = lt.id
     JOIN users u ON lr.employee_id = u.id
     WHERE lr.id = $1`, [leaveRequestId]);
    const leave = leaveRes.rows[0];
    if (!leave)
        throw new Error('Leave request not found');
    if (leave.employee_id !== employeeId) {
        throw new Error('Unauthorized: You can only request reconsideration for your own leave request');
    }
    if (leave.status !== 'REJECTED') {
        throw new Error(`Cannot request reconsideration from status: ${leave.status}. Only rejected requests are eligible.`);
    }
    if ((leave.reconsideration_count || 0) >= 1) {
        throw new Error('Organizational policy permits only one manager reconsideration per request.');
    }
    const reconId = `recon-${uuidv4()}`;
    const now = new Date().toISOString();
    // 1. Create reconsideration record
    await db.query(`INSERT INTO leave_reconsiderations (id, leave_request_id, requested_by, requested_at, reason, manager_id, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'PENDING')`, [reconId, leaveRequestId, employeeId, now, reconsiderationReason, leave.manager_id]);
    // 2. Update leave request state
    await db.query(`UPDATE leave_requests
     SET status = 'PENDING_MANAGER_RECONSIDERATION',
         reconsideration_count = reconsideration_count + 1,
         current_reviewing_authority_id = manager_id,
         current_reviewing_authority_role = 'MANAGER',
         updated_at = $1
     WHERE id = $2`, [now, leaveRequestId]);
    // 3. Log decision history
    await db.query(`INSERT INTO leave_decision_history (id, leave_request_id, actor_id, actor_name, actor_role, action, previous_status, new_status, reason, authorization_context)
     VALUES ($1, $2, $3, $4, 'EMPLOYEE', 'REQUEST_RECONSIDERATION', $5, 'PENDING_MANAGER_RECONSIDERATION', $6, 'Employee exercised 1-time reconsideration right under POL-LEV-02')`, [`ldh-${uuidv4()}`, leaveRequestId, employeeId, employeeName, leave.status, reconsiderationReason]);
    // 4. Create notification for manager
    await db.query(`INSERT INTO notifications (id, user_id, title, message, type, reference_type, reference_id)
     VALUES ($1, $2, 'Leave Reconsideration Requested', $3, 'ACTION_REQUIRED', 'LEAVE', $4)`, [
        `notif-${uuidv4()}`,
        leave.manager_id,
        `${employeeName} has requested a reconsideration for Leave Request ${leave.case_number}. Please review the updated context.`,
        leaveRequestId,
    ]);
    // 5. Audit log
    await logAudit({
        actorId: employeeId,
        actorName: employeeName,
        actorRole: 'EMPLOYEE',
        action: 'REQUEST_LEAVE_RECONSIDERATION',
        entityType: 'LEAVE_REQUEST',
        entityId: leaveRequestId,
        previousState: { status: leave.status },
        newState: { status: 'PENDING_MANAGER_RECONSIDERATION', reconsiderationReason },
    });
    return { success: true, newStatus: 'PENDING_MANAGER_RECONSIDERATION' };
}
export async function submitHigherLevelLeaveReview(params) {
    const { leaveRequestId, employeeId, employeeName, higherReviewReason } = params;
    const leaveRes = await db.query(`SELECT lr.*, u.skip_level_manager_id, u.department_id
     FROM leave_requests lr
     JOIN users u ON lr.employee_id = u.id
     WHERE lr.id = $1`, [leaveRequestId]);
    const leave = leaveRes.rows[0];
    if (!leave)
        throw new Error('Leave request not found');
    if (leave.employee_id !== employeeId) {
        throw new Error('Unauthorized');
    }
    if (leave.status !== 'REJECTED_AFTER_RECONSIDERATION') {
        throw new Error(`Higher-level review is only accessible after a second rejection following reconsideration. Current status: ${leave.status}`);
    }
    // Determine configured higher authority from hierarchy
    let higherAuthorityId = leave.skip_level_manager_id;
    let higherAuthorityRole = 'SKIP_LEVEL_MANAGER';
    if (!higherAuthorityId) {
        // If no skip-level, route to HR Director
        const hrRes = await db.query(`SELECT id FROM users WHERE role = 'HR_DIRECTOR' LIMIT 1`);
        higherAuthorityId = hrRes.rows[0]?.id || null;
        higherAuthorityRole = 'HR_DIRECTOR';
    }
    const now = new Date().toISOString();
    const escalationId = `lesc-${uuidv4()}`;
    // 1. Create leave escalation record
    await db.query(`INSERT INTO leave_escalations (id, leave_request_id, trigger_type, triggered_by, from_authority_id, to_authority_id, reason, status)
     VALUES ($1, $2, 'HIGHER_LEVEL_REVIEW', $3, $4, $5, $6, 'UNDER_REVIEW')`, [escalationId, leaveRequestId, employeeId, leave.manager_id, higherAuthorityId, higherReviewReason]);
    // 2. Update leave request status
    await db.query(`UPDATE leave_requests
     SET status = 'PENDING_HIGHER_REVIEW',
         current_reviewing_authority_id = $1,
         current_reviewing_authority_role = $2,
         higher_review_reason = $3,
         updated_at = $4
     WHERE id = $5`, [higherAuthorityId, higherAuthorityRole, higherReviewReason, now, leaveRequestId]);
    // 3. Log decision history
    await db.query(`INSERT INTO leave_decision_history (id, leave_request_id, actor_id, actor_name, actor_role, action, previous_status, new_status, reason, authorization_context)
     VALUES ($1, $2, $3, $4, 'EMPLOYEE', 'REQUEST_HIGHER_LEVEL_REVIEW', $5, 'PENDING_HIGHER_REVIEW', $6, 'Employee requested independent higher authority review under POL-LEV-02')`, [`ldh-${uuidv4()}`, leaveRequestId, employeeId, employeeName, leave.status, higherReviewReason]);
    // 4. Notify higher reviewer
    if (higherAuthorityId) {
        await db.query(`INSERT INTO notifications (id, user_id, title, message, type, reference_type, reference_id)
       VALUES ($1, $2, 'High-Importance Leave Escalation For Review', $3, 'ACTION_REQUIRED', 'LEAVE', $4)`, [
            `notif-${uuidv4()}`,
            higherAuthorityId,
            `Leave Request ${leave.case_number} has escalated for higher-level review following manager reconsideration rejections.`,
            leaveRequestId,
        ]);
    }
    // 5. Audit log
    await logAudit({
        actorId: employeeId,
        actorName: employeeName,
        actorRole: 'EMPLOYEE',
        action: 'ESCALATE_LEAVE_TO_HIGHER_AUTHORITY',
        entityType: 'LEAVE_REQUEST',
        entityId: leaveRequestId,
        previousState: { status: leave.status },
        newState: { status: 'PENDING_HIGHER_REVIEW', higherAuthorityId, higherAuthorityRole },
    });
    return { success: true, newStatus: 'PENDING_HIGHER_REVIEW' };
}
