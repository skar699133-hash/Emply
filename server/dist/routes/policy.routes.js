import { Router } from 'express';
import { db } from '../db/connection.js';
import { authenticate } from '../middleware/auth.js';
const router = Router();
// GET /api/policies
router.get('/', authenticate, async (_req, res) => {
    try {
        const result = await db.query(`SELECT * FROM company_policies WHERE is_active = true ORDER BY category, title`);
        res.json(result.rows);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// GET /api/policies/:id
router.get('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query('SELECT * FROM company_policies WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Policy not found' });
            return;
        }
        res.json(result.rows[0]);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
export default router;
