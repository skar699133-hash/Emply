import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/connection.js';
import { authenticate } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';
import { escalateWorkplaceRequest } from '../services/escalation.service.js';
const router = Router();
// GET /api/requests - List workplace requests with security filters
router.get('/', authenticate, async (req, res) => {
    try {
        const user = req.user;
        const { status, priority, category } = req.query;
        let query = `
      SELECT wr.*,
             u.full_name as employee_name,
             u.avatar_url as employee_avatar,
             u.email as employee_email,
             d.name as department_name,
             t.name as team_name,
             au.full_name as assigned_user_name,
             sla.response_time_hours,
             sla.resolution_time_hours
      FROM workplace_requests wr
      JOIN users u ON wr.employee_id = u.id
      LEFT JOIN departments d ON wr.department_id = d.id
      LEFT JOIN teams t ON wr.team_id = t.id
      LEFT JOIN users au ON wr.assigned_user_id = au.id
      LEFT JOIN request_slas sla ON wr.sla_id = sla.id
      WHERE 1=1
    `;
        const params = [];
        // Role-based visibility
        if (user.role === 'EMPLOYEE') {
            // Employees see their own requests
            params.push(user.userId);
            query += ` AND wr.employee_id = $${params.length}`;
        }
        else if (user.role === 'MANAGER') {
            // Managers see assigned or team requests, BUT NEVER confidential grievances regarding managers!
            params.push(user.userId);
            query += ` AND (wr.employee_id = $${params.length} OR wr.assigned_user_id = $${params.length} OR wr.manager_id = $${params.length})
                 AND wr.confidential = false`;
        }
        else if (user.role === 'HR_DIRECTOR' || user.role === 'ADMIN') {
            // HR and Admin can see all, including confidential
        }
        else if (user.role === 'SKIP_LEVEL_MANAGER') {
            // Skip-level sees department requests that are not confidential
            params.push(user.userId);
            query += ` AND (wr.employee_id = $${params.length} OR wr.assigned_user_id = $${params.length} OR wr.confidential = false)`;
        }
        if (status) {
            params.push(status);
            query += ` AND wr.status = $${params.length}`;
        }
        if (priority) {
            params.push(priority);
            query += ` AND wr.priority = $${params.length}`;
        }
        if (category) {
            params.push(category);
            query += ` AND wr.category_code = $${params.length}`;
        }
        query += ` ORDER BY wr.created_at DESC`;
        const result = await db.query(query, params);
        res.json(result.rows);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// GET /api/requests/:id - Request details, timeline, comments
router.get('/:id', authenticate, async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;
        const reqRes = await db.query(`SELECT wr.*,
              u.full_name as employee_name,
              u.email as employee_email,
              u.avatar_url as employee_avatar,
              d.name as department_name,
              t.name as team_name,
              au.full_name as assigned_user_name,
              sla.response_time_hours,
              sla.resolution_time_hours,
              sla.description as sla_description
       FROM workplace_requests wr
       JOIN users u ON wr.employee_id = u.id
       LEFT JOIN departments d ON wr.department_id = d.id
       LEFT JOIN teams t ON wr.team_id = t.id
       LEFT JOIN users au ON wr.assigned_user_id = au.id
       LEFT JOIN request_slas sla ON wr.sla_id = sla.id
       WHERE wr.id = $1`, [id]);
        const request = reqRes.rows[0];
        if (!request) {
            res.status(404).json({ error: 'Request not found' });
            return;
        }
        // Confidentiality access check
        if (request.confidential) {
            const isOwner = request.employee_id === user.userId;
            const isHRorAdmin = user.role === 'HR_DIRECTOR' || user.role === 'ADMIN';
            if (!isOwner && !isHRorAdmin) {
                res.status(403).json({ error: 'Access denied: This is a restricted confidential case.' });
                return;
            }
        }
        // Get Status History
        const historyRes = await db.query(`SELECT * FROM request_status_history WHERE request_id = $1 ORDER BY created_at ASC`, [id]);
        // Get Comments
        const commentsRes = await db.query(`SELECT * FROM request_comments WHERE request_id = $1 ORDER BY created_at ASC`, [id]);
        // Get Escalations
        const escRes = await db.query(`SELECT re.*, u.full_name as escalated_by_name, au.full_name as to_authority_name
       FROM request_escalations re
       LEFT JOIN users u ON re.triggered_by = u.id
       LEFT JOIN users au ON re.to_authority_id = au.id
       WHERE re.request_id = $1 ORDER BY re.created_at ASC`, [id]);
        // Get Feedback if present
        const feedbackRes = await db.query(`SELECT * FROM employee_feedback WHERE request_id = $1 LIMIT 1`, [id]);
        res.json({
            ...request,
            history: historyRes.rows,
            comments: commentsRes.rows,
            escalations: escRes.rows,
            feedback: feedbackRes.rows[0] || null,
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// POST /api/requests - Create a workplace request (employee confirmed)
router.post('/', authenticate, async (req, res) => {
    try {
        const user = req.user;
        const { title, description, categoryCode, priority, severity, sensitivity, impactLevel, departmentId, teamId, assignedUserId, slaId, dueAt, aiSummary, aiRecommendation, confidential, requiresImmediateEscalation, } = req.body;
        if (!title || !description || !categoryCode) {
            res.status(400).json({ error: 'Title, description, and categoryCode are required' });
            return;
        }
        const id = `req-${uuidv4()}`;
        // Robust collision-free case number generation
        const casesRes = await db.query(`SELECT case_number FROM workplace_requests WHERE case_number LIKE 'CAS-%'`);
        let maxNum = 1040;
        for (const row of casesRes.rows) {
            const match = (row.case_number || '').match(/CAS-(\d+)/);
            if (match) {
                const n = parseInt(match[1], 10);
                if (n > maxNum)
                    maxNum = n;
            }
        }
        const caseNumber = `CAS-${maxNum + 1}`;
        const initialStatus = requiresImmediateEscalation ? 'ESCALATED' : 'IN_PROGRESS';
        const now = new Date().toISOString();
        await db.query(`INSERT INTO workplace_requests (
        id, case_number, employee_id, category_code, title, description,
        status, priority, severity, sensitivity, impact_level,
        department_id, team_id, assigned_user_id, manager_id, sla_id,
        due_at, ai_summary, ai_recommendation, employee_confirmed,
        confidential, requires_human_review, requires_immediate_escalation,
        first_response_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)`, [
            id,
            caseNumber,
            user.userId,
            categoryCode,
            title,
            description,
            initialStatus,
            priority || 'MEDIUM',
            severity || 'MEDIUM',
            sensitivity || 'NORMAL',
            impactLevel || 'INDIVIDUAL',
            departmentId || null,
            teamId || null,
            assignedUserId || null,
            confidential ? null : req.body.managerId || null,
            slaId || null,
            dueAt || null,
            aiSummary || null,
            aiRecommendation || null,
            true,
            confidential || false,
            true,
            requiresImmediateEscalation || false,
            now,
        ]);
        // Initial status history
        await db.query(`INSERT INTO request_status_history (id, request_id, actor_id, actor_name, previous_status, new_status, comment)
       VALUES ($1, $2, $3, $4, 'NEW', $5, $6)`, [
            `rsh-${uuidv4()}`,
            id,
            user.userId,
            user.fullName,
            initialStatus,
            `Request created and classified by Nexora AI. Assigned to target team.`,
        ]);
        // Notification to assigned user or HR
        const targetUserId = assignedUserId || (confidential ? 'usr-elena' : null);
        if (targetUserId) {
            await db.query(`INSERT INTO notifications (id, user_id, title, message, type, reference_type, reference_id)
         VALUES ($1, $2, $3, $4, $5, 'WORKPLACE_REQUEST', $6)`, [
                `notif-${uuidv4()}`,
                targetUserId,
                `New Case Assigned: ${caseNumber}`,
                `New ${priority} priority request submitted by ${user.fullName}: ${title}`,
                priority === 'CRITICAL' ? 'ESCALATION' : 'ACTION_REQUIRED',
                id,
            ]);
        }
        // Confirmation notification to employee
        await db.query(`INSERT INTO notifications (id, user_id, title, message, type, reference_type, reference_id)
       VALUES ($1, $2, $3, $4, 'INFO', 'WORKPLACE_REQUEST', $5)`, [
            `notif-${uuidv4()}`,
            user.userId,
            `Case Created: ${caseNumber}`,
            `Your request has been routed to ${req.body.teamName || 'responsible team'}. Track updates anytime in your dashboard.`,
            id,
        ]);
        await logAudit({
            actorId: user.userId,
            actorName: user.fullName,
            actorRole: user.role,
            action: 'CREATE_WORKPLACE_REQUEST',
            entityType: 'WORKPLACE_REQUEST',
            entityId: id,
            newState: { caseNumber, title, categoryCode, priority, confidential },
        });
        res.status(201).json({ id, caseNumber, status: initialStatus });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// POST /api/requests/:id/comments - Add comment or internal note
router.post('/:id/comments', authenticate, async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;
        const { content, isInternalNote } = req.body;
        if (!content) {
            res.status(400).json({ error: 'Content is required' });
            return;
        }
        const commentId = `rc-${uuidv4()}`;
        await db.query(`INSERT INTO request_comments (id, request_id, author_id, author_name, author_role, content, is_internal_note)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`, [commentId, id, user.userId, user.fullName, user.role, content, isInternalNote || false]);
        res.status(201).json({ success: true, commentId });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// POST /api/requests/:id/escalate - Escalate overdue/critical request
router.post('/:id/escalate', authenticate, async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;
        const { reason } = req.body;
        const result = await escalateWorkplaceRequest({
            requestId: id,
            triggerType: 'MANUAL_ESCALATION',
            triggeredBy: user.userId,
            triggeredByName: user.fullName,
            reason: reason || 'Employee initiated manual escalation due to urgent operational dependency.',
        });
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// POST /api/requests/:id/feedback - Record employee resolution feedback
router.post('/:id/feedback', authenticate, async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;
        const { resolutionQuality, satisfactionRating, responseTimeRating, comments } = req.body;
        if (!resolutionQuality || !satisfactionRating) {
            res.status(400).json({ error: 'Resolution quality and satisfaction rating are required' });
            return;
        }
        const fid = `efb-${uuidv4()}`;
        await db.query(`INSERT INTO employee_feedback (id, request_id, employee_id, resolution_quality, satisfaction_rating, response_time_rating, comments)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`, [
            fid,
            id,
            user.userId,
            resolutionQuality,
            parseInt(satisfactionRating, 10),
            parseInt(responseTimeRating || '5', 10),
            comments || null,
        ]);
        // If completely resolved, update request status to CLOSED
        if (resolutionQuality === 'COMPLETELY_RESOLVED') {
            await db.query(`UPDATE workplace_requests SET status = 'CLOSED', closed_at = CURRENT_TIMESTAMP WHERE id = $1`, [id]);
        }
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
export default router;
