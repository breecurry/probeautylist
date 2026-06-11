import { Router } from 'express';
import { and, asc, eq } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { availabilityRules, professionalProfiles } from '../../db/schema.js';
import { requireRole } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import { HttpError } from '../../utils/http.js';
import { availabilityRuleSchema, replaceAvailabilityRulesSchema, updateAvailabilityRuleSchema, type AvailabilityRuleInput } from './schemas.js';

export const availabilityRouter = Router();

async function getOwnProfile(userId: string) {
  const [profile] = await db.select().from(professionalProfiles).where(eq(professionalProfiles.userId, userId)).limit(1);
  if (!profile) throw new HttpError(404, 'Create a professional profile before setting availability');
  return profile;
}

availabilityRouter.get('/professional/:professionalId', async (req, res, next) => {
  try {
    const rows = await db.select().from(availabilityRules)
      .where(and(eq(availabilityRules.professionalId, req.params.professionalId), eq(availabilityRules.isActive, true)))
      .orderBy(asc(availabilityRules.weekday), asc(availabilityRules.startTime));
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

availabilityRouter.get('/me', requireRole('professional', 'admin'), async (req, res, next) => {
  try {
    const profile = await getOwnProfile(req.currentUser!.id);
    const rows = await db.select().from(availabilityRules)
      .where(eq(availabilityRules.professionalId, profile.id))
      .orderBy(asc(availabilityRules.weekday), asc(availabilityRules.startTime));
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

availabilityRouter.post('/me', requireRole('professional', 'admin'), validateBody(availabilityRuleSchema), async (req, res, next) => {
  try {
    const profile = await getOwnProfile(req.currentUser!.id);
    const [created] = await db.insert(availabilityRules).values({ ...req.body, professionalId: profile.id }).returning();
    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
});

availabilityRouter.put('/me', requireRole('professional', 'admin'), validateBody(replaceAvailabilityRulesSchema), async (req, res, next) => {
  try {
    const profile = await getOwnProfile(req.currentUser!.id);
    await db.delete(availabilityRules).where(eq(availabilityRules.professionalId, profile.id));
    if (req.body.rules.length === 0) return res.json([]);
    const rows = await db.insert(availabilityRules).values(req.body.rules.map((rule: AvailabilityRuleInput) => ({ ...rule, professionalId: profile.id }))).returning();
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

availabilityRouter.patch('/:id', requireRole('professional', 'admin'), validateBody(updateAvailabilityRuleSchema), async (req, res, next) => {
  try {
    const profile = await getOwnProfile(req.currentUser!.id);
    const [updated] = await db.update(availabilityRules)
      .set({ ...req.body, updatedAt: new Date() })
      .where(and(eq(availabilityRules.id, req.params.id), eq(availabilityRules.professionalId, profile.id)))
      .returning();
    if (!updated) throw new HttpError(404, 'Availability rule not found');
    res.json(updated);
  } catch (error) {
    next(error);
  }
});
