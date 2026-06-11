import argon2 from 'argon2';
import { Router } from 'express';
import { eq, sql } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { users } from '../../db/schema.js';
import { requireAuth, publicUser } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import { HttpError, sendCreated } from '../../utils/http.js';
import { loginSchema, registerSchema } from './schemas.js';

export const authRouter = Router();

authRouter.post('/register', validateBody(registerSchema), async (req, res, next) => {
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
      phone: req.body.phone,
      role: req.body.role,
    }).returning();

    req.session.userId = user.id;
    sendCreated(res, publicUser(user));
  } catch (error) {
    next(error);
  }
});

authRouter.post('/login', validateBody(loginSchema), async (req, res, next) => {
  try {
    const [user] = await db.select().from(users).where(sql`lower(${users.email}) = ${req.body.email}`).limit(1);
    if (!user || !user.isActive) {
      throw new HttpError(401, 'Invalid email or password');
    }

    const valid = await argon2.verify(user.passwordHash, req.body.password);
    if (!valid) {
      throw new HttpError(401, 'Invalid email or password');
    }

    await db.update(users).set({ lastLoginAt: new Date(), updatedAt: new Date() }).where(eq(users.id, user.id));
    req.session.regenerate((error) => {
      if (error) return next(error);
      req.session.userId = user.id;
      res.json(publicUser(user));
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
