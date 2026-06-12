import { Router } from 'express';
import { and, asc, eq } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { services } from '../../db/schema.js';
import { requireRole } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import { HttpError, sendCreated } from '../../utils/http.js';
import { requireOwnProfile, requireVisibleProfile } from '../../utils/profile.js';
import { serviceSchema } from './schemas.js';

export const servicesRouter = Router();

const serviceOrder = [asc(services.category), asc(services.name), asc(services.createdAt)];

servicesRouter.get('/professional/:professionalId', async (req, res, next) => {
  try {
    await requireVisibleProfile(req.params.professionalId, 'Professional services not found');
    const rows = await db.select().from(services)
      .where(and(eq(services.professionalId, req.params.professionalId), eq(services.isActive, true)))
      .orderBy(...serviceOrder);
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

servicesRouter.get('/me', requireRole('professional', 'business', 'admin'), async (req, res, next) => {
  try {
    const profile = await requireOwnProfile(req.currentUser!.id, 'Create a professional profile before managing services');
    const rows = await db.select().from(services).where(eq(services.professionalId, profile.id)).orderBy(...serviceOrder);
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

servicesRouter.post('/me', requireRole('professional', 'business', 'admin'), validateBody(serviceSchema), async (req, res, next) => {
  try {
    const profile = await requireOwnProfile(req.currentUser!.id, 'Create a professional profile before managing services');
    const [created] = await db.insert(services).values({ ...req.body, professionalId: profile.id }).returning();
    sendCreated(res, created);
  } catch (error) {
    next(error);
  }
});

servicesRouter.patch('/:id', requireRole('professional', 'business', 'admin'), validateBody(serviceSchema.partial()), async (req, res, next) => {
  try {
    const profile = await requireOwnProfile(req.currentUser!.id, 'Create a professional profile before managing services');
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
