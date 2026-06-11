import { Router } from 'express';
import { and, eq } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { professionalProfiles, services } from '../../db/schema.js';
import { requireRole } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import { HttpError, sendCreated } from '../../utils/http.js';
import { requireVisibleProfile } from '../../utils/profile.js';
import { serviceSchema } from './schemas.js';

export const servicesRouter = Router();

async function getOwnProfile(userId: string) {
  const [profile] = await db.select().from(professionalProfiles).where(eq(professionalProfiles.userId, userId)).limit(1);
  if (!profile) throw new HttpError(404, 'Create a professional profile before managing services');
  return profile;
}


servicesRouter.get('/professional/:professionalId', async (req, res, next) => {
  try {
    await requireVisibleProfile(req.params.professionalId, 'Professional services not found');
    const rows = await db.select().from(services)
      .where(and(eq(services.professionalId, req.params.professionalId), eq(services.isActive, true)));
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

servicesRouter.get('/me', requireRole('professional', 'admin'), async (req, res, next) => {
  try {
    const profile = await getOwnProfile(req.currentUser!.id);
    const rows = await db.select().from(services).where(eq(services.professionalId, profile.id));
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

servicesRouter.post('/me', requireRole('professional', 'admin'), validateBody(serviceSchema), async (req, res, next) => {
  try {
    const profile = await getOwnProfile(req.currentUser!.id);
    const [created] = await db.insert(services).values({ ...req.body, professionalId: profile.id }).returning();
    sendCreated(res, created);
  } catch (error) {
    next(error);
  }
});

servicesRouter.patch('/:id', requireRole('professional', 'admin'), validateBody(serviceSchema.partial()), async (req, res, next) => {
  try {
    const profile = await getOwnProfile(req.currentUser!.id);
    const [updated] = await db.update(services)
      .set({ ...req.body, updatedAt: new Date() })
      .where(and(eq(services.id, req.params.id), eq(services.professionalId, profile.id)))
      .returning();
    if (!updated) throw new HttpError(404, 'Service not found');
    res.json(updated);
  } catch (error) {
    next(error);
  }
});
