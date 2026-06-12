import { getAuth } from '@clerk/express';
import type { NextFunction, Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { organizations, users, type Organization, type User } from '../db/schema.js';
import { HttpError } from '../utils/http.js';

declare global {
  namespace Express {
    interface Request {
      currentUser?: User;
      currentOrganization?: Organization;
    }
  }
}

export function getClerkUserId(req: Request) {
  const { userId } = getAuth(req);
  return userId;
}

export function getClerkOrganizationId(req: Request) {
  const { orgId } = getAuth(req);
  return orgId;
}

export async function attachCurrentUser(req: Request, _res: Response, next: NextFunction) {
  try {
    const clerkUserId = getClerkUserId(req);
    if (!clerkUserId) {
      return next();
    }

    const [user] = await db.select().from(users).where(eq(users.clerkUserId, clerkUserId)).limit(1);
    if (!user || !user.isActive) {
      return next();
    }

    req.currentUser = user;

    const clerkOrgId = getClerkOrganizationId(req);
    if (clerkOrgId) {
      const [organization] = await db.select().from(organizations).where(eq(organizations.clerkOrgId, clerkOrgId)).limit(1);
      if (organization?.isActive) {
        req.currentOrganization = organization;
      }
    }

    next();
  } catch (error) {
    next(error);
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const clerkUserId = getClerkUserId(req);
  if (!clerkUserId) {
    return next(new HttpError(401, 'Authentication required'));
  }
  if (!req.currentUser) {
    return next(new HttpError(409, 'Account sync required'));
  }
  next();
}

export function requireRole(...roles: Array<User['role']>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const clerkUserId = getClerkUserId(req);
    if (!clerkUserId) {
      return next(new HttpError(401, 'Authentication required'));
    }
    if (!req.currentUser) {
      return next(new HttpError(409, 'Account sync required'));
    }
    if (!roles.includes(req.currentUser.role)) {
      return next(new HttpError(403, 'You do not have permission to perform this action'));
    }
    next();
  };
}

export function requireOrganization(req: Request, _res: Response, next: NextFunction) {
  if (!req.currentOrganization) {
    return next(new HttpError(403, 'Organization context required'));
  }
  next();
}

export function publicUser(user: User) {
  return user;
}
