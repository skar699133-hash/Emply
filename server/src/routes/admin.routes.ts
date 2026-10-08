import { Router, Response } from 'express';
import { db } from '../db/connection.js';
import { authenticate, authorize, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/admin/audit-logs
router.get('/audit-logs', authenticate, authorize('ADMIN', 'HR_DIRECTOR'), async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const result = await db.query(
      `SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100`
    );
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/categories
router.get('/categories', authenticate, async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const result = await db.query(
      `SELECT rc.*, d.name as department_name, t.name as team_name
       FROM request_categories rc
       LEFT JOIN departments d ON rc.department_id = d.id
       LEFT JOIN teams t ON rc.default_team_id = t.id
       ORDER BY rc.name ASC`
    );
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/slas
router.get('/slas', authenticate, async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const result = await db.query(
      `SELECT s.*, rc.name as category_name
       FROM request_slas s
       JOIN request_categories rc ON s.category_code = rc.code
       ORDER BY s.category_code, s.priority`
    );
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/departments-teams
router.get('/departments-teams', authenticate, async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const depts = await db.query('SELECT * FROM departments ORDER BY name');
    const teams = await db.query('SELECT * FROM teams ORDER BY name');
    res.json({ departments: depts.rows, teams: teams.rows });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/leave-hierarchies
router.get('/leave-hierarchies', authenticate, authorize('ADMIN', 'HR_DIRECTOR'), async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const result = await db.query(
      `SELECT lrh.*, d.name as department_name
       FROM leave_review_hierarchies lrh
       JOIN departments d ON lrh.department_id = d.id`
    );
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
