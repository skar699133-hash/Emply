import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db/connection.js';
import { config } from '../config.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { AuthTokenPayload } from '../types/index.js';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    const userRes = await db.query(
      `SELECT u.*, d.name as department_name, t.name as team_name
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       LEFT JOIN teams t ON u.team_id = t.id
       WHERE LOWER(u.email) = LOWER($1)`,
      [email]
    );

    const user = userRes.rows[0];
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Check password if provided, or allow fast demo login if password matches default
    if (password) {
      const match = await bcrypt.compare(password, user.password_hash);
      if (!match && password !== 'password123') {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }
    }

    const payload: AuthTokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      fullName: user.full_name,
    };

    const token = jwt.sign(payload, config.jwtSecret, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        jobTitle: user.job_title,
        departmentId: user.department_id,
        departmentName: user.department_name,
        teamId: user.team_id,
        teamName: user.team_name,
        managerId: user.manager_id,
        skipLevelManagerId: user.skip_level_manager_id,
        avatarUrl: user.avatar_url,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userRes = await db.query(
      `SELECT u.*, d.name as department_name, t.name as team_name, m.full_name as manager_name
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       LEFT JOIN teams t ON u.team_id = t.id
       LEFT JOIN users m ON u.manager_id = m.id
       WHERE u.id = $1`,
      [req.user?.userId]
    );

    const user = userRes.rows[0];
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      jobTitle: user.job_title,
      departmentId: user.department_id,
      departmentName: user.department_name,
      teamId: user.team_id,
      teamName: user.team_name,
      managerId: user.manager_id,
      managerName: user.manager_name,
      skipLevelManagerId: user.skip_level_manager_id,
      avatarUrl: user.avatar_url,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/auth/demo-users (Instant role switching for paired evaluations)
router.get('/demo-users', async (_req: Request, res: Response): Promise<void> => {
  try {
    const usersRes = await db.query(
      `SELECT id, email, full_name, full_name as "fullName", role, job_title as "jobTitle", department_id as "departmentId", team_id as "teamId", avatar_url as "avatarUrl"
       FROM users ORDER BY role DESC`
    );
    res.json(usersRes.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
