import argon2 from 'argon2';
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { eq, sql } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { users } from '../../db/schema.js';
import { requireAuth, publicUser } from '../../middleware/auth.js';
import { ensureCsrfToken } from '../../middleware/csrf.js';
import { validateBody } from '../../middleware/validate.js';
import { HttpError, sendCreated } from '../../utils/http.js';
import { accountUpdateSchema, loginSchema, passwordChangeSchema, registerSchema } from './schemas.js';

export const authRouter = Router();

const authWriteLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many authentication attempts. Please wait and try again.' },
});


authRouter.get('/csrf', (req, res) => {
  res.json({ csrfToken: ensureCsrfToken(req) });
});

authRouter.post('/register', authWriteLimit, validateBody(registerSchema), async (req, res, next) => {
  try {
    const existing = await db.select({ id: users.id }).from(users).where(sql`lower(${users.email}) = ${req.body.email}`).limit(1);
    if (existing.length) {
      throw new HttpError(409, 'An account with this email already exists');
    }

    const passwordHash = await argon2.hash(req.body.password, { type: argon2.argon2id });
    const [user] = await db.insert(users).values({
      email: req.body.email,
      passwordHash,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      phone: req.body.phone || null,
      role: req.body.role,
    }).returning();

    req.session.userId = user.id;
    ensureCsrfToken(req);
    sendCreated(res, publicUser(user));
  } catch (error) {
    next(error);
  }
});

authRouter.post('/login', authWriteLimit, validateBody(loginSchema), async (req, res, next) => {
  try {
    const [user] = await db.select({
      id: users.id,
      email: users.email,
      passwordHash: users.passwordHash,
      firstName: users.firstName,
      lastName: users.lastName,
      phone: users.phone,
      avatarUrl: users.avatarUrl,
      role: users.role,
      emailVerified: users.emailVerified,
      isActive: users.isActive,
      lastLoginAt: users.lastLoginAt,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    }).from(users).where(sql`lower(${users.email}) = ${req.body.email}`).limit(1);
    if (!user || !user.isActive) {
      throw new HttpError(401, 'Invalid email or password');
    }

    const valid = await argon2.verify(user.passwordHash, req.body.password);
    if (!valid) {
      throw new HttpError(401, 'Invalid email or password');
    }

    const loggedInAt = new Date();
    await db.update(users).set({ lastLoginAt: loggedInAt, updatedAt: loggedInAt }).where(eq(users.id, user.id));
    req.session.regenerate((error) => {
      if (error) return next(error);
      req.session.userId = user.id;
      ensureCsrfToken(req);
      res.json(publicUser({ ...user, lastLoginAt: loggedInAt, updatedAt: loggedInAt }));
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/logout', requireAuth, (req, res, next) => {
  req.session.destroy((error) => {
    if (error) return next(error);
    res.clearCookie('pbl.sid');
    res.json({ message: 'Logged out' });
  });
});

authRouter.get('/me', requireAuth, (req, res) => {
  res.json(publicUser(req.currentUser!));
});

authRouter.patch('/me', requireAuth, validateBody(accountUpdateSchema), async (req, res, next) => {
  try {
    const [updated] = await db.update(users)
      .set({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        phone: req.body.phone || null,
        avatarUrl: req.body.avatarUrl || null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, req.currentUser!.id))
      .returning();
    res.json(publicUser(updated));
  } catch (error) {
    next(error);
  }
});

authRouter.patch('/password', authWriteLimit, requireAuth, validateBody(passwordChangeSchema), async (req, res, next) => {
  try {
    const valid = await argon2.verify(req.currentUser!.passwordHash, req.body.currentPassword);
    if (!valid) throw new HttpError(401, 'Current password is incorrect');

    const passwordHash = await argon2.hash(req.body.newPassword, { type: argon2.argon2id });
    const userId = req.currentUser!.id;
    await db.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, userId));
    req.session.regenerate((error) => {
      if (error) return next(error);
      req.session.userId = userId;
      ensureCsrfToken(req);
      res.json({ message: 'Password updated' });
    });
  } catch (error) {
    next(error);
  }
});
