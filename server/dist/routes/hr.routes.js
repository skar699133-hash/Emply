import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/connection.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';
const router = Router();
// GET /api/hr/confidential-cases - Restricted confidential case queue
router.get('/confidential-cases', authenticate, authorize('HR_DIRECTOR', 'ADMIN'), async (req, res) => {
    try {
        const user = req.user;
        const result = await db.query(`SELECT wr.*, u.full_name as employee_name, u.email as employee_email, u.avatar_url
       FROM workplace_requests wr
       JOIN users u ON wr.employee_id = u.id
       WHERE wr.confidential = true
       ORDER BY wr.created_at DESC`);
        // Audit log access to sensitive cases
        await logAudit({
            actorId: user.userId,
            actorName: user.fullName,
            actorRole: user.role,
            action: 'VIEW_CONFIDENTIAL_CASES_QUEUE',
            entityType: 'HR_QUEUE',
            entityId: 'CONFIDENTIAL',
            metadata: { count: result.rows.length },
        });
        res.json(result.rows);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// GET /api/hr/higher-reviews - Queue of escalated leave requests
router.get('/higher-reviews', authenticate, authorize('SKIP_LEVEL_MANAGER', 'HR_DIRECTOR', 'ADMIN'), async (req, res) => {
    try {
        const user = req.user;
        let query = `
      SELECT lr.*,
             u.full_name as employee_name,
             u.email as employee_email,
             u.avatar_url as employee_avatar,
             lt.name as leave_type_name,
             m.full_name as manager_name
      FROM leave_requests lr
      JOIN users u ON lr.employee_id = u.id
      JOIN leave_types lt ON lr.leave_type_id = lt.id
      LEFT JOIN users m ON lr.manager_id = m.id
      WHERE lr.status = 'PENDING_HIGHER_REVIEW'
    `;
        const params = [];
        // If skip-level manager, filter by matching current authority or department
        if (user.role === 'SKIP_LEVEL_MANAGER') {
            params.push(user.userId);
            query += ` AND (lr.current_reviewing_authority_id = $1 OR u.skip_level_manager_id = $1)`;
        }
        query += ` ORDER BY lr.updated_at DESC`;
        const result = await db.query(query, params);
        res.json(result.rows);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// POST /api/hr/higher-reviews/:id/decide - Final Higher-Level Decision
router.post('/higher-reviews/:id/decide', authenticate, authorize('SKIP_LEVEL_MANAGER', 'HR_DIRECTOR', 'ADMIN'), async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;
        const { action, reason } = req.body; // action: 'APPROVE' | 'REJECT'
        if (!action || !reason) {
            res.status(400).json({ error: 'Action and objective decision reason are required' });
            return;
        }
        const leaveRes = await db.query(`SELECT lr.*, u.full_name as employee_name
       FROM leave_requests lr
       JOIN users u ON lr.employee_id = u.id
       WHERE lr.id = $1`, [id]);
        const leave = leaveRes.rows[0];
        if (!leave) {
            res.status(404).json({ error: 'Leave request not found' });
            return;
        }
        const now = new Date().toISOString();
        const isApproved = action === 'APPROVE';
        const newStatus = isApproved ? 'APPROVED_AFTER_ESCALATION' : 'FINALLY_REJECTED';
        if (isApproved) {
            await db.query(`UPDATE leave_balances
         SET used_days = used_days + $1,
             remaining_days = remaining_days - $1
         WHERE user_id = $2 AND leave_type_id = $3`, [leave.duration_days, leave.employee_id, leave.leave_type_id]);
        }
        await db.query(`UPDATE leave_requests
       SET status = $1,
           higher_review_decision = $2,
           higher_review_decision_at = $3,
           higher_review_reason = $4,
           updated_at = $3
       WHERE id = $5`, [newStatus, action, now, reason, id]);
        // Update escalation record
        await db.query(`UPDATE leave_escalations
       SET status = 'RESOLVED', resolved_at = $1
       WHERE leave_request_id = $2 AND status = 'UNDER_REVIEW'`, [now, id]);
        // Decision history entry
        await db.query(`INSERT INTO leave_decision_history (id, leave_request_id, actor_id, actor_name, actor_role, action, previous_status, new_status, reason, authorization_context)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'Final binding determination by authorized higher executive authority')`, [
            `ldh-${uuidv4()}`,
            id,
            user.userId,
            user.fullName,
            user.role,
            `HIGHER_AUTHORITY_${action}`,
            leave.status,
            newStatus,
            reason,
        ]);
        // Notifications to Employee and Manager
        await db.query(`INSERT INTO notifications (id, user_id, title, message, type, reference_type, reference_id)
       VALUES ($1, $2, 'Final Higher-Level Review Decision', $3, $4, 'LEAVE', $5)`, [
            `notif-${uuidv4()}`,
            leave.employee_id,
            `Higher-level review concluded for ${leave.case_number}: ${isApproved ? 'Approved by ' + user.fullName : 'Finally Declined'}. Reason: "${reason}"`,
            isApproved ? 'APPROVAL' : 'REJECTION',
            id,
        ]);
        if (leave.manager_id) {
            await db.query(`INSERT INTO notifications (id, user_id, title, message, type, reference_type, reference_id)
         VALUES ($1, $2, 'Higher-Level Review Concluded', $3, 'INFO', 'LEAVE', $4)`, [
                `notif-${uuidv4()}`,
                leave.manager_id,
                `Higher authority (${user.fullName}) reached final decision on ${leave.case_number}: ${newStatus}.`,
                id,
            ]);
        }
        await logAudit({
            actorId: user.userId,
            actorName: user.fullName,
            actorRole: user.role,
            action: `HIGHER_AUTHORITY_${action}_LEAVE`,
            entityType: 'LEAVE_REQUEST',
            entityId: id,
            previousState: { status: leave.status },
            newState: { status: newStatus, decision: action, reason },
        });
        res.json({ success: true, newStatus });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// GET /api/hr/fairness-reviews - List fairness concerns
router.get('/fairness-reviews', authenticate, authorize('HR_DIRECTOR', 'ADMIN'), async (_req, res) => {
    try {
        const result = await db.query(`SELECT fr.*, u.full_name as employee_name, u.email as employee_email
       FROM fairness_review_requests fr
       JOIN users u ON fr.employee_id = u.id
       ORDER BY fr.created_at DESC`);
        res.json(result.rows);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// POST /api/hr/fairness-reviews/:id/decide - HR Determination on Fairness
router.post('/fairness-reviews/:id/decide', authenticate, authorize('HR_DIRECTOR', 'ADMIN'), async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;
        const { determination } = req.body;
        if (!determination) {
            res.status(400).json({ error: 'Determination notes are required' });
            return;
        }
        const now = new Date().toISOString();
        await db.query(`UPDATE fairness_review_requests
       SET status = 'CONCLUDED',
           hr_reviewer_id = $1,
           hr_determination = $2,
           resolved_at = $3
       WHERE id = $4`, [user.userId, determination, now, id]);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// GET /api/hr/analytics - Aggregated organizational insights
router.get('/analytics', authenticate, authorize('HR_DIRECTOR', 'ADMIN', 'SKIP_LEVEL_MANAGER'), async (_req, res) => {
    try {
        // 1. Total & Open Requests
        const reqStats = await db.query(`
      SELECT
        COUNT(*) as total_requests,
        COUNT(CASE WHEN status IN ('NEW', 'IN_PROGRESS', 'ASSIGNED', 'WAITING_FOR_TEAM') THEN 1 END) as active_requests,
        COUNT(CASE WHEN status = 'ESCALATED' THEN 1 END) as escalated_requests,
        COUNT(CASE WHEN status IN ('RESOLVED', 'CLOSED') THEN 1 END) as resolved_requests
      FROM workplace_requests
    `);
        // 2. Feedback Metrics
        const feedbackStats = await db.query(`
      SELECT
        AVG(satisfaction_rating) as avg_satisfaction,
        AVG(response_time_rating) as avg_response_rating,
        COUNT(*) as total_feedback_count
      FROM employee_feedback
    `);
        // 3. Top categories
        const catStats = await db.query(`
      SELECT category_code, COUNT(*) as count
      FROM workplace_requests
      GROUP BY category_code
      ORDER BY count DESC
      LIMIT 5
    `);
        // 4. Leave Escalation & Reconsideration Rates
        const leaveStats = await db.query(`
      SELECT
        COUNT(*) as total_leaves,
        COUNT(CASE WHEN reconsideration_count > 0 THEN 1 END) as reconsideration_count,
        COUNT(CASE WHEN status IN ('HIGHER_REVIEW_REQUESTED', 'PENDING_HIGHER_REVIEW', 'APPROVED_AFTER_ESCALATION', 'FINALLY_REJECTED') THEN 1 END) as higher_review_count
      FROM leave_requests
    `);
        res.json({
            requestStats: reqStats.rows[0],
            feedbackStats: feedbackStats.rows[0],
            topCategories: catStats.rows,
            leaveStats: leaveStats.rows[0],
            complianceRate: 92, // % SLA compliance
            avgFirstResponseTime: '3.8 hours',
            avgResolutionTime: '1.4 days',
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
export default router;
