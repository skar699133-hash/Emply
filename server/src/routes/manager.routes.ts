import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/connection.js';
import { authenticate, authorize, AuthenticatedRequest } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';

const router = Router();

// GET /api/manager/dashboard - Manager overview of team and assigned items
router.get('/dashboard', authenticate, authorize('MANAGER', 'SKIP_LEVEL_MANAGER', 'HR_DIRECTOR', 'ADMIN'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;

    // 1. Pending leave reviews assigned to this manager (both 1st review & reconsideration)
    const pendingLeavesRes = await db.query(
      `SELECT lr.*, u.full_name as employee_name, u.email as employee_email, u.avatar_url, lt.name as leave_type_name
       FROM leave_requests lr
       JOIN users u ON lr.employee_id = u.id
       JOIN leave_types lt ON lr.leave_type_id = lt.id
       WHERE (lr.manager_id = $1 OR lr.current_reviewing_authority_id = $1)
         AND lr.status IN ('PENDING_MANAGER_REVIEW', 'PENDING_MANAGER_RECONSIDERATION')
       ORDER BY lr.created_at ASC`,
      [user.userId]
    );

    // 2. Assigned workplace requests
    const assignedRequestsRes = await db.query(
      `SELECT wr.*, u.full_name as employee_name, u.avatar_url, d.name as department_name, t.name as team_name
       FROM workplace_requests wr
       JOIN users u ON wr.employee_id = u.id
       LEFT JOIN departments d ON wr.department_id = d.id
       LEFT JOIN teams t ON wr.team_id = t.id
       WHERE (wr.assigned_user_id = $1 OR wr.manager_id = $1)
         AND wr.status NOT IN ('RESOLVED', 'CLOSED')
         AND wr.confidential = false
       ORDER BY wr.priority DESC, wr.created_at ASC`,
      [user.userId]
    );

    // 3. Team members and live availability
    const teamMembersRes = await db.query(
      `SELECT u.id, u.full_name, u.email, u.job_title, u.avatar_url
       FROM users u
       WHERE u.manager_id = $1`,
      [user.userId]
    );

    res.json({
      pendingLeaves: pendingLeavesRes.rows,
      assignedRequests: assignedRequestsRes.rows,
      teamMembers: teamMembersRes.rows,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/manager/leave/:id/decide - First Manager Decision (APPROVE / REJECT / CLARIFY)
router.post('/leave/:id/decide', authenticate, authorize('MANAGER', 'SKIP_LEVEL_MANAGER', 'HR_DIRECTOR', 'ADMIN'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const { action, reason } = req.body; // action: 'APPROVE' | 'REJECT' | 'CLARIFY'

    if (!action) {
      res.status(400).json({ error: 'Action is required' });
      return;
    }

    if (action === 'REJECT' && !reason) {
      res.status(400).json({ error: 'An objective rejection reason is mandatory by corporate policy' });
      return;
    }

    const leaveRes = await db.query(
      `SELECT lr.*, u.full_name as employee_name, u.email, lt.name as leave_type_name
       FROM leave_requests lr
       JOIN users u ON lr.employee_id = u.id
       JOIN leave_types lt ON lr.leave_type_id = lt.id
       WHERE lr.id = $1`,
      [id]
    );
    const leave = leaveRes.rows[0];
    if (!leave) {
      res.status(404).json({ error: 'Leave request not found' });
      return;
    }

    const now = new Date().toISOString();
    let newStatus = 'PENDING_MANAGER_REVIEW';

    if (action === 'APPROVE') {
      newStatus = 'APPROVED';
      // Deduct days from leave_balances
      await db.query(
        `UPDATE leave_balances
         SET used_days = used_days + $1,
             remaining_days = remaining_days - $1
         WHERE user_id = $2 AND leave_type_id = $3`,
        [leave.duration_days, leave.employee_id, leave.leave_type_id]
      );
    } else if (action === 'REJECT') {
      newStatus = 'REJECTED';
    }

    await db.query(
      `UPDATE leave_requests
       SET status = $1,
           initial_manager_decision = $2,
           initial_manager_decision_at = $3,
           initial_rejection_reason = $4,
           updated_at = $3
       WHERE id = $5`,
      [newStatus, action, now, reason || null, id]
    );

    // Decision history entry
    await db.query(
      `INSERT INTO leave_decision_history (id, leave_request_id, actor_id, actor_name, actor_role, action, previous_status, new_status, reason, authorization_context)
       VALUES ($1, $2, $3, $4, 'MANAGER', $5, $6, $7, $8, 'First manager level review')`,
      [`ldh-${uuidv4()}`, id, user.userId, user.fullName, `MANAGER_${action}`, leave.status, newStatus, reason || 'Approved as requested']
    );

    // Employee notification
    const notifTitle = action === 'APPROVE' ? 'Leave Request Approved!' : 'Leave Request Declined';
    const notifMessage = action === 'APPROVE'
      ? `Your leave request ${leave.case_number} was approved by ${user.fullName}.`
      : `Your leave request ${leave.case_number} was declined by ${user.fullName}. Reason: "${reason}". If high-importance, you may request reconsideration.`;

    await db.query(
      `INSERT INTO notifications (id, user_id, title, message, type, reference_type, reference_id)
       VALUES ($1, $2, $3, $4, $5, 'LEAVE', $6)`,
      [`notif-${uuidv4()}`, leave.employee_id, notifTitle, notifMessage, action === 'APPROVE' ? 'APPROVAL' : 'REJECTION', id]
    );

    await logAudit({
      actorId: user.userId,
      actorName: user.fullName,
      actorRole: user.role,
      action: `MANAGER_${action}_LEAVE`,
      entityType: 'LEAVE_REQUEST',
      entityId: id as string,
      previousState: { status: leave.status },
      newState: { status: newStatus, action, reason },
    });

    res.json({ success: true, newStatus });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/manager/leave/:id/decide-reconsideration - Second Manager Decision
router.post('/leave/:id/decide-reconsideration', authenticate, authorize('MANAGER', 'SKIP_LEVEL_MANAGER', 'HR_DIRECTOR', 'ADMIN'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const { action, reason } = req.body; // action: 'APPROVE' | 'REJECT'

    if (!action) {
      res.status(400).json({ error: 'Action is required' });
      return;
    }

    if (action === 'REJECT' && !reason) {
      res.status(400).json({ error: 'An objective rejection reason is mandatory for second reconsideration' });
      return;
    }

    const leaveRes = await db.query(
      `SELECT lr.*, u.full_name as employee_name, lt.name as leave_type_name
       FROM leave_requests lr
       JOIN users u ON lr.employee_id = u.id
       JOIN leave_types lt ON lr.leave_type_id = lt.id
       WHERE lr.id = $1`,
      [id]
    );
    const leave = leaveRes.rows[0];
    if (!leave) {
      res.status(404).json({ error: 'Leave request not found' });
      return;
    }

    const now = new Date().toISOString();
    let newStatus = 'PENDING_MANAGER_RECONSIDERATION';

    if (action === 'APPROVE') {
      newStatus = 'APPROVED_AFTER_RECONSIDERATION';
      await db.query(
        `UPDATE leave_balances
         SET used_days = used_days + $1,
             remaining_days = remaining_days - $1
         WHERE user_id = $2 AND leave_type_id = $3`,
        [leave.duration_days, leave.employee_id, leave.leave_type_id]
      );
    } else {
      newStatus = 'REJECTED_AFTER_RECONSIDERATION';
    }

    await db.query(
      `UPDATE leave_requests
       SET status = $1,
           second_manager_decision = $2,
           second_manager_decision_at = $3,
           second_rejection_reason = $4,
           updated_at = $3
       WHERE id = $5`,
      [newStatus, action, now, reason || null, id]
    );

    // Update reconsideration record
    await db.query(
      `UPDATE leave_reconsiderations
       SET status = $1,
           manager_response = $2,
           manager_response_at = $3,
           updated_at = $3
       WHERE leave_request_id = $4 AND status = 'PENDING'`,
      [action === 'APPROVE' ? 'APPROVED' : 'REJECTED', reason, now, id]
    );

    // Decision history entry
    await db.query(
      `INSERT INTO leave_decision_history (id, leave_request_id, actor_id, actor_name, actor_role, action, previous_status, new_status, reason, authorization_context)
       VALUES ($1, $2, $3, $4, 'MANAGER', $5, $6, $7, $8, 'Second manager level decision following employee reconsideration')`,
      [`ldh-${uuidv4()}`, id, user.userId, user.fullName, `MANAGER_${action}_RECONSIDERATION`, leave.status, newStatus, reason || 'Approved after reconsideration']
    );

    // Employee notification
    const notifTitle = action === 'APPROVE'
      ? 'Leave Reconsideration Approved!'
      : 'Leave Declined Again — Higher-Level Review Option Available';

    const notifMessage = action === 'APPROVE'
      ? `Your manager ${user.fullName} approved your reconsideration for ${leave.case_number}.`
      : `Your manager has reviewed your reconsideration for ${leave.case_number} and declined it. Corporate policy permits you to escalate this to a Higher-Level Review.`;

    await db.query(
      `INSERT INTO notifications (id, user_id, title, message, type, reference_type, reference_id)
       VALUES ($1, $2, $3, $4, $5, 'LEAVE', $6)`,
      [`notif-${uuidv4()}`, leave.employee_id, notifTitle, notifMessage, action === 'APPROVE' ? 'APPROVAL' : 'ESCALATION', id]
    );

    await logAudit({
      actorId: user.userId,
      actorName: user.fullName,
      actorRole: user.role,
      action: `MANAGER_${action}_RECONSIDERATION`,
      entityType: 'LEAVE_REQUEST',
      entityId: id as string,
      previousState: { status: leave.status },
      newState: { status: newStatus, action, reason },
    });

    res.json({ success: true, newStatus });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/manager/requests/:id/status - Update workplace request status
router.post('/requests/:id/status', authenticate, authorize('MANAGER', 'SKIP_LEVEL_MANAGER', 'HR_DIRECTOR', 'ADMIN'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const { status, comment } = req.body;

    if (!status) {
      res.status(400).json({ error: 'Status is required' });
      return;
    }

    const reqRes = await db.query('SELECT * FROM workplace_requests WHERE id = $1', [id]);
    const request = reqRes.rows[0];
    if (!request) {
      res.status(404).json({ error: 'Request not found' });
      return;
    }

    const now = new Date().toISOString();
    const isResolved = status === 'RESOLVED';

    await db.query(
      `UPDATE workplace_requests
       SET status = $1,
           resolved_at = $2,
           updated_at = $3
       WHERE id = $4`,
      [status, isResolved ? now : request.resolved_at, now, id]
    );

    // Add status history
    await db.query(
      `INSERT INTO request_status_history (id, request_id, actor_id, actor_name, previous_status, new_status, comment)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [`rsh-${uuidv4()}`, id, user.userId, user.fullName, request.status, status, comment || `Status updated to ${status}`]
    );

    // Notify employee
    await db.query(
      `INSERT INTO notifications (id, user_id, title, message, type, reference_type, reference_id)
       VALUES ($1, $2, 'Case Status Updated', $3, 'INFO', 'WORKPLACE_REQUEST', $4)`,
      [
        `notif-${uuidv4()}`,
        request.employee_id,
        `Your case ${request.case_number} is now: ${status}. ${comment || ''}`,
        id,
      ]
    );

    res.json({ success: true, status });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
