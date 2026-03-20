import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// ── Types ──────────────────────────────────────────────────────────
export type UserRole = 'admin' | 'manager' | 'agent' | 'viewer' | 'system';

export interface AuthPayload {
  sub: string;
  email: string;
  role: UserRole;
  clinicId?: string;
  iat: number;
  exp: number;
}

export interface AuthenticatedRequest extends Request {
  user: AuthPayload;
}

// ── Config ─────────────────────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET ?? 'CHANGE_ME_IN_PRODUCTION';

// ── JWT Authentication Middleware ──────────────────────────────────
export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or malformed Authorization header' });
    return;
  }

  const token = header.slice(7);

  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthPayload;
    (req as AuthenticatedRequest).user = payload;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token expired' });
      return;
    }
    res.status(401).json({ error: 'Invalid token' });
  }
}

// ── Role-Based Access Control ──────────────────────────────────────
export function requireRole(...allowed: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as AuthenticatedRequest).user;

    if (!user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    if (!allowed.includes(user.role)) {
      res.status(403).json({
        error: 'Insufficient permissions',
        required: allowed,
        current: user.role,
      });
      return;
    }

    next();
  };
}

// ── Optional Auth (for public + authenticated dual-use routes) ────
export function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const header = req.headers.authorization;

  if (header?.startsWith('Bearer ')) {
    try {
      const payload = jwt.verify(header.slice(7), JWT_SECRET) as AuthPayload;
      (req as AuthenticatedRequest).user = payload;
    } catch {
      // silently ignore invalid tokens on optional routes
    }
  }

  next();
}
