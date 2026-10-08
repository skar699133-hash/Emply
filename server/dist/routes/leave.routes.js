import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/connection.js';
import { authenticate } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';
import { submitLeaveReconsideration, submitHigherLevelLeaveReview } from '../services/leave-escalation.service.js';
import { analyzeLeaveRequest } from '../services/leave-agent.service.js';
const router = Router();
// GET /api/leave - Retrieve my leaves, balances, and team leaves
router.get('/', authenticate, async (req, res) => {
    try {
        const user = req.user;
        // 1. Leave balances
        const balancesRes = await db.query(`SELECT lb.*, lt.name as leave_type_name, lt.code as leave_type_code, lt.importance_level
       FROM leave_balances lb
       JOIN leave_types lt ON lb.leave_type_id = lt.id
       WHERE lb.user_id = $1
       ORDER BY lt.name ASC`, [user.userId]);
        // 2. My leave requests
        const myLeavesRes = await db.query(`SELECT lr.*, lt.name as leave_type_name, lt.code as leave_type_code, m.full_name as manager_name
       FROM leave_requests lr
       JOIN leave_types lt ON lr.leave_type_id = lt.id
       LEFT JOIN users m ON lr.manager_id = m.id
       WHERE lr.employee_id = $1
       ORDER BY lr.created_at DESC`, [user.userId]);
        // 3. Team leaves (calendar visibility)
        let teamLeaves = [];
        const empRes = await db.query('SELECT team_id FROM users WHERE id = $1', [user.userId]);
        const teamId = empRes.rows[0]?.team_id;
        if (teamId) {
            const teamRes = await db.query(`SELECT lr.id, lr.start_date, lr.end_date, lr.duration_days, lr.status, u.full_name, u.avatar_url, lt.name as leave_type_name
         FROM leave_requests lr
         JOIN users u ON lr.employee_id = u.id
         JOIN leave_types lt ON lr.leave_type_id = lt.id
         WHERE u.team_id = $1 AND lr.status IN ('APPROVED', 'PENDING_MANAGER_REVIEW')
         ORDER BY lr.start_date ASC`, [teamId]);
            teamLeaves = teamRes.rows;
        }
        res.json({
            balances: balancesRes.rows,
            myRequests: myLeavesRes.rows,
            teamLeaves,
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// GET /api/leave/types - Available leave types
router.get('/types', authenticate, async (_req, res) => {
    try {
        const typesRes = await db.query('SELECT * FROM leave_types ORDER BY name ASC');
        res.json(typesRes.rows);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// GET /api/leave/:id - Detailed leave request with full decision & reconsideration trail
router.get('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const leaveRes = await db.query(`SELECT lr.*,
              lt.name as leave_type_name,
              lt.code as leave_type_code,
              u.full_name as employee_name,
              u.email as employee_email,
              u.avatar_url as employee_avatar,
              m.full_name as manager_name,
              cra.full_name as current_reviewing_authority_name
       FROM leave_requests lr
       JOIN leave_types lt ON lr.leave_type_id = lt.id
       JOIN users u ON lr.employee_id = u.id
       LEFT JOIN users m ON lr.manager_id = m.id
       LEFT JOIN users cra ON lr.current_reviewing_authority_id = cra.id
       WHERE lr.id = $1`, [id]);
        const leave = leaveRes.rows[0];
        if (!leave) {
            res.status(404).json({ error: 'Leave request not found' });
            return;
        }
        // Decision history
        const historyRes = await db.query(`SELECT * FROM leave_decision_history WHERE leave_request_id = $1 ORDER BY created_at ASC`, [id]);
        // Reconsiderations
        const reconRes = await db.query(`SELECT * FROM leave_reconsiderations WHERE leave_request_id = $1 ORDER BY requested_at ASC`, [id]);
        // Escalations
        const escRes = await db.query(`SELECT le.*, u.full_name as triggered_by_name, fa.full_name as from_authority_name, ta.full_name as to_authority_name
       FROM leave_escalations le
       LEFT JOIN users u ON le.triggered_by = u.id
       LEFT JOIN users fa ON le.from_authority_id = fa.id
       LEFT JOIN users ta ON le.to_authority_id = ta.id
       WHERE le.leave_request_id = $1 ORDER BY le.created_at ASC`, [id]);
        res.json({
            ...leave,
            decisionHistory: historyRes.rows,
            reconsiderations: reconRes.rows,
            escalations: escRes.rows,
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// POST /api/leave - Submit new leave request
router.post('/', authenticate, async (req, res) => {
    try {
        const user = req.user;
        const { leaveTypeCode, startDate, endDate, durationDays, reason } = req.body;
        if (!leaveTypeCode || !startDate || !endDate || !reason) {
            res.status(400).json({ error: 'Missing required leave fields' });
            return;
        }
        // 1. Run AI Leave Analysis
        const analysis = await analyzeLeaveRequest({
            employeeId: user.userId,
            leaveTypeCode,
            startDate,
            endDate,
            durationDays: parseFloat(durationDays || '1'),
            reason,
        });
        const ltRes = await db.query('SELECT id, name FROM leave_types WHERE code = $1 LIMIT 1', [leaveTypeCode]);
        const leaveTypeId = ltRes.rows[0]?.id;
        // Fetch employee manager
        const empRes = await db.query('SELECT manager_id FROM users WHERE id = $1', [user.userId]);
        const managerId = empRes.rows[0]?.manager_id;
        const id = `lev-${uuidv4()}`;
        // Robust collision-free case number generation
        const casesRes = await db.query(`SELECT case_number FROM leave_requests WHERE case_number LIKE 'LEV-%'`);
        let maxNum = 2040;
        for (const row of casesRes.rows) {
            const match = (row.case_number || '').match(/LEV-(\d+)/);
            if (match) {
                const n = parseInt(match[1], 10);
                if (n > maxNum)
                    maxNum = n;
            }
        }
        const caseNumber = `LEV-${maxNum + 1}`;
        // 2. Insert into leave_requests
        await db.query(`INSERT INTO leave_requests (
        id, case_number, employee_id, leave_type_id, start_date, end_date,
        duration_days, reason, importance, status, manager_id,
        current_reviewing_authority_id, current_reviewing_authority_role,
        policy_eligible, team_availability_percent, project_impact_level,
        ai_analysis
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'PENDING_MANAGER_REVIEW', $10, $10, 'MANAGER', $11, $12, $13, $14)`, [
            id,
            caseNumber,
            user.userId,
            leaveTypeId,
            startDate,
            endDate,
            parseFloat(durationDays || '1'),
            reason,
            analysis.importance,
            managerId || null,
            analysis.policyEligible,
            analysis.teamAvailabilityPercent,
            analysis.projectImpact,
            JSON.stringify(analysis),
        ]);
        // 3. Log initial decision history
        await db.query(`INSERT INTO leave_decision_history (id, leave_request_id, actor_id, actor_name, actor_role, action, previous_status, new_status, reason)
       VALUES ($1, $2, $3, $4, 'EMPLOYEE', 'SUBMIT_LEAVE', 'NEW', 'PENDING_MANAGER_REVIEW', $5)`, [`ldh-${uuidv4()}`, id, user.userId, user.fullName, reason]);
        // 4. In-app notification to Manager
        if (managerId) {
            await db.query(`INSERT INTO notifications (id, user_id, title, message, type, reference_type, reference_id)
         VALUES ($1, $2, 'New Leave Request For Approval', $3, 'ACTION_REQUIRED', 'LEAVE', $4)`, [
                `notif-${uuidv4()}`,
                managerId,
                `${user.fullName} has requested ${durationDays} days leave (${startDate} to ${endDate}): ${analysis.importance} importance.`,
                id,
            ]);
        }
        await logAudit({
            actorId: user.userId,
            actorName: user.fullName,
            actorRole: user.role,
            action: 'SUBMIT_LEAVE_REQUEST',
            entityType: 'LEAVE_REQUEST',
            entityId: id,
            newState: { caseNumber, startDate, endDate, importance: analysis.importance },
        });
        res.status(201).json({ id, caseNumber, status: 'PENDING_MANAGER_REVIEW', analysis });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// POST /api/leave/:id/reconsider - Employee requests 1-time manager reconsideration
router.post('/:id/reconsider', authenticate, async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;
        const { reason } = req.body;
        if (!reason) {
            res.status(400).json({ error: 'Reconsideration explanation is required' });
            return;
        }
        const result = await submitLeaveReconsideration({
            leaveRequestId: id,
            employeeId: user.userId,
            employeeName: user.fullName,
            reconsiderationReason: reason,
        });
        res.json(result);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
// POST /api/leave/:id/higher-review - Employee requests Higher-Level Review after 2nd rejection
router.post('/:id/higher-review', authenticate, async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;
        const { reason } = req.body;
        if (!reason) {
            res.status(400).json({ error: 'Reason for higher-level review is required' });
            return;
        }
        const result = await submitHigherLevelLeaveReview({
            leaveRequestId: id,
            employeeId: user.userId,
            employeeName: user.fullName,
            higherReviewReason: reason,
        });
        res.json(result);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
// POST /api/leave/:id/fairness-review - Request HR Fairness Review
router.post('/:id/fairness-review', authenticate, async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;
        const { concernDescription, comparatorDetails } = req.body;
        const fId = `frr-${uuidv4()}`;
        await db.query(`INSERT INTO fairness_review_requests (id, case_type, reference_id, employee_id, concern_description, comparator_details, status)
       VALUES ($1, 'LEAVE', $2, $3, $4, $5, 'SUBMITTED')`, [fId, id, user.userId, concernDescription, comparatorDetails || null]);
        // Notify HR Director
        const hrLead = await db.query(`SELECT id FROM users WHERE role = 'HR_DIRECTOR' LIMIT 1`);
        if (hrLead.rows[0]) {
            await db.query(`INSERT INTO notifications (id, user_id, title, message, type, reference_type, reference_id)
         VALUES ($1, $2, 'Fairness Review Requested', $3, 'ACTION_REQUIRED', 'FAIRNESS_REVIEW', $4)`, [
                `notif-${uuidv4()}`,
                hrLead.rows[0].id,
                `${user.fullName} has requested an HR Fairness Review regarding Leave Request ${id}.`,
                fId,
            ]);
        }
        res.status(201).json({ success: true, fairnessReviewId: fId });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
export default router;
