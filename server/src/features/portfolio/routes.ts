import { Router } from 'express';
import { and, asc, desc, eq } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { portfolioItems, professionalProfiles } from '../../db/schema.js';
import { requireRole } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import { HttpError, sendCreated } from '../../utils/http.js';
import { requireVisibleProfile } from '../../utils/profile.js';
import { portfolioSchema, portfolioUpdateSchema } from './schemas.js';

export const portfolioRouter = Router();

async function findOwnProfile(userId: string) {
  const [profile] = await db.select().from(professionalProfiles).where(eq(professionalProfiles.userId, userId)).limit(1);
  return profile;
}

async function getOwnProfile(userId: string, message = 'Professional profile not found') {
  const profile = await findOwnProfile(userId);
  if (!profile) throw new HttpError(404, message);
  return profile;
}


portfolioRouter.get('/professional/:professionalId', async (req, res, next) => {
  try {
    await requireVisibleProfile(req.params.professionalId, 'Professional portfolio not found');
    const rows = await db.select().from(portfolioItems)
      .where(and(eq(portfolioItems.professionalId, req.params.professionalId), eq(portfolioItems.isVisible, true)))
      .orderBy(asc(portfolioItems.sortOrder), desc(portfolioItems.createdAt));
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

portfolioRouter.get('/me', requireRole('professional', 'business', 'admin'), async (req, res, next) => {
  try {
    const profile = await findOwnProfile(req.currentUser!.id);
    if (!profile) return res.json([]);
    const rows = await db.select().from(portfolioItems).where(eq(portfolioItems.professionalId, profile.id)).orderBy(asc(portfolioItems.sortOrder), desc(portfolioItems.createdAt));
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

portfolioRouter.post('/me', requireRole('professional', 'business', 'admin'), validateBody(portfolioSchema), async (req, res, next) => {
  try {
    const profile = await getOwnProfile(req.currentUser!.id, 'Create a profile before adding portfolio work');
    const [created] = await db.insert(portfolioItems).values({ ...req.body, professionalId: profile.id }).returning();
    sendCreated(res, created);
  } catch (error) {
    next(error);
  }
});


portfolioRouter.patch('/:id', requireRole('professional', 'business', 'admin'), validateBody(portfolioUpdateSchema), async (req, res, next) => {
  try {
    const profile = await getOwnProfile(req.currentUser!.id);
    const [updated] = await db.update(portfolioItems)
      .set({ ...req.body, updatedAt: new Date() })
      .where(and(eq(portfolioItems.id, req.params.id), eq(portfolioItems.professionalId, profile.id)))
      .returning();
    if (!updated) throw new HttpError(404, 'Portfolio item not found');
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

portfolioRouter.delete('/:id', requireRole('professional', 'business', 'admin'), async (req, res, next) => {
  try {
    const profile = await getOwnProfile(req.currentUser!.id);
    const [deleted] = await db.delete(portfolioItems).where(and(eq(portfolioItems.id, req.params.id), eq(portfolioItems.professionalId, profile.id))).returning();
    if (!deleted) throw new HttpError(404, 'Portfolio item not found');
    res.json({ message: 'Portfolio item deleted' });
  } catch (error) {
    next(error);
  }
});
