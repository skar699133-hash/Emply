import { Router } from 'express';
import { db } from '../db/connection.js';
import { authenticate } from '../middleware/auth.js';
const router = Router();
// GET /api/notifications
router.get('/', authenticate, async (req, res) => {
    try {
        const user = req.user;
        const result = await db.query(`SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`, [user.userId]);
        res.json(result.rows);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// PATCH /api/notifications/:id/read
router.patch('/:id/read', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        await db.query(`UPDATE notifications SET is_read = true WHERE id = $1`, [id]);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// PATCH /api/notifications/read-all
router.patch('/read-all', authenticate, async (req, res) => {
    try {
        const user = req.user;
        await db.query(`UPDATE notifications SET is_read = true WHERE user_id = $1`, [user.userId]);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
export default router;
