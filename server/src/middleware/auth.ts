import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { AuthTokenPayload, UserRole } from '../types/index.js';
import { auth as firebaseAuth } from '../db/firebaseAdmin.js';

export interface AuthenticatedRequest extends Request {
  user?: AuthTokenPayload;
}

export async function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: No token provided' });
    return;
  }

  const token = authHeader.split(' ')[1];

  // 1. Try Firebase ID Token verification if Firebase Admin is active
  if (firebaseAuth) {
    try {
      const decodedFirebase = await firebaseAuth.verifyIdToken(token);
      req.user = {
        userId: decodedFirebase.uid,
        email: decodedFirebase.email || '',
        role: ((decodedFirebase.role as string) || 'EMPLOYEE') as UserRole,
        fullName: decodedFirebase.name || decodedFirebase.email?.split('@')[0] || 'Firebase User',
      };
      next();
      return;
    } catch (fbErr) {
      // Not a Firebase token or expired, try standard JWT
    }
  }

  // 2. Standard JWT verification (for demo personas and system users)
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as AuthTokenPayload;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
}

export function authorize(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: `Forbidden: Role '${req.user.role}' is not authorized for this resource`,
      });
      return;
    }

    next();
  };
}
