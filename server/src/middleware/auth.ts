import type { NextFunction, Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { users, type User } from '../db/schema.js';
import { HttpError } from '../utils/http.js';

declare module 'express-session' {
  interface SessionData {
    userId?: string;
    csrfToken?: string;
  }
}

declare global {
  namespace Express {
    interface Request {
      currentUser?: User;
    }
  }
}

export async function attachCurrentUser(req: Request, _res: Response, next: NextFunction) {
  try {
    if (!req.session.userId) {
      return next();
    }

    const [user] = await db.select({
      id: users.id,
      email: users.email,
      passwordHash: users.passwordHash,
      role: users.role,
      firstName: users.firstName,
      lastName: users.lastName,
      phone: users.phone,
      avatarUrl: users.avatarUrl,
      emailVerified: users.emailVerified,
      isActive: users.isActive,
      lastLoginAt: users.lastLoginAt,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    }).from(users).where(eq(users.id, req.session.userId)).limit(1);
    if (!user || !user.isActive) {
      req.session.destroy(() => undefined);
      return next();
    }

    req.currentUser = user;
    next();
  } catch (error) {
    next(error);
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  if (!req.currentUser) {
    return next(new HttpError(401, 'Authentication required'));
  }
  next();
}

export function requireRole(...roles: Array<User['role']>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.currentUser) {
      return next(new HttpError(401, 'Authentication required'));
    }
    if (!roles.includes(req.currentUser.role)) {
      return next(new HttpError(403, 'You do not have permission to perform this action'));
    }
    next();
  };
}

export function publicUser(user: User) {
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
}
