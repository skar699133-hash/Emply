import { Router, Response } from 'express';
import { db } from '../db/connection.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/policies
router.get('/', authenticate, async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const result = await db.query(
      `SELECT * FROM company_policies WHERE is_active = true ORDER BY category, title`
    );
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/policies/:id
router.get('/:id', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM company_policies WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Policy not found' });
      return;
    }
    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
