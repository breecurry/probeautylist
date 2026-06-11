import { Router } from 'express';
import { count, desc, eq } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { adminActions, bookings, professionalProfiles, reviews, users } from '../../db/schema.js';
import { requireRole } from '../../middleware/auth.js';
import { publicUser } from '../../middleware/auth.js';

export const adminRouter = Router();

adminRouter.get('/stats', requireRole('admin'), async (_req, res, next) => {
  try {
    const [userCount] = await db.select({ value: count() }).from(users);
    const [professionalCount] = await db.select({ value: count() }).from(professionalProfiles);
    const [bookingCount] = await db.select({ value: count() }).from(bookings);
    const [reviewCount] = await db.select({ value: count() }).from(reviews);
    res.json({
      users: userCount.value,
      professionals: professionalCount.value,
      bookings: bookingCount.value,
      reviews: reviewCount.value,
    });
  } catch (error) {
    next(error);
  }
});

adminRouter.get('/users', requireRole('admin'), async (_req, res, next) => {
  try {
    const rows = await db.select().from(users).orderBy(desc(users.createdAt)).limit(200);
    res.json(rows.map(publicUser));
  } catch (error) {
    next(error);
  }
});

adminRouter.get('/professionals/pending', requireRole('admin'), async (_req, res, next) => {
  try {
    const rows = await db.select().from(professionalProfiles).where(eq(professionalProfiles.status, 'pending_review')).orderBy(desc(professionalProfiles.createdAt));
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

adminRouter.get('/actions', requireRole('admin'), async (_req, res, next) => {
  try {
    const rows = await db.select().from(adminActions).orderBy(desc(adminActions.createdAt)).limit(100);
    res.json(rows);
  } catch (error) {
    next(error);
  }
});
