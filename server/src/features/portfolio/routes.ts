import { Router } from 'express';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { portfolioItems, professionalProfiles } from '../../db/schema.js';
import { requireRole } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import { HttpError, sendCreated } from '../../utils/http.js';
import { portfolioSchema } from './schemas.js';

export const portfolioRouter = Router();

portfolioRouter.get('/professional/:professionalId', async (req, res, next) => {
  try {
    const rows = await db.select().from(portfolioItems)
      .where(and(eq(portfolioItems.professionalId, req.params.professionalId), eq(portfolioItems.isVisible, true)))
      .orderBy(desc(portfolioItems.createdAt));
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

portfolioRouter.get('/me', requireRole('professional', 'admin'), async (req, res, next) => {
  try {
    const [profile] = await db.select().from(professionalProfiles).where(eq(professionalProfiles.userId, req.currentUser!.id)).limit(1);
    if (!profile) return res.json([]);
    const rows = await db.select().from(portfolioItems).where(eq(portfolioItems.professionalId, profile.id)).orderBy(desc(portfolioItems.createdAt));
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

portfolioRouter.post('/me', requireRole('professional', 'admin'), validateBody(portfolioSchema), async (req, res, next) => {
  try {
    const [profile] = await db.select().from(professionalProfiles).where(eq(professionalProfiles.userId, req.currentUser!.id)).limit(1);
    if (!profile) throw new HttpError(404, 'Create a profile before adding portfolio work');
    const [created] = await db.insert(portfolioItems).values({ ...req.body, professionalId: profile.id }).returning();
    sendCreated(res, created);
  } catch (error) {
    next(error);
  }
});

portfolioRouter.delete('/:id', requireRole('professional', 'admin'), async (req, res, next) => {
  try {
    const [profile] = await db.select().from(professionalProfiles).where(eq(professionalProfiles.userId, req.currentUser!.id)).limit(1);
    if (!profile) throw new HttpError(404, 'Professional profile not found');
    const [deleted] = await db.delete(portfolioItems).where(and(eq(portfolioItems.id, req.params.id), eq(portfolioItems.professionalId, profile.id))).returning();
    if (!deleted) throw new HttpError(404, 'Portfolio item not found');
    res.json({ message: 'Portfolio item deleted' });
  } catch (error) {
    next(error);
  }
});
