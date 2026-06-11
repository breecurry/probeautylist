import { Router } from 'express';
import { and, asc, eq } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { availabilityExceptions, availabilityRules, professionalProfiles } from '../../db/schema.js';
import { requireRole } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import { HttpError } from '../../utils/http.js';
import {
  availabilityExceptionSchema,
  availabilityRuleSchema,
  replaceAvailabilityRulesSchema,
  updateAvailabilityExceptionSchema,
  updateAvailabilityRuleSchema,
  type AvailabilityRuleInput,
} from './schemas.js';

export const availabilityRouter = Router();

async function getOwnProfile(userId: string) {
  const [profile] = await db.select().from(professionalProfiles).where(eq(professionalProfiles.userId, userId)).limit(1);
  if (!profile) throw new HttpError(404, 'Create a professional profile before setting availability');
  return profile;
}

availabilityRouter.get('/professional/:professionalId', async (req, res, next) => {
  try {
    const rules = await db.select().from(availabilityRules)
      .where(and(eq(availabilityRules.professionalId, req.params.professionalId), eq(availabilityRules.isActive, true)))
      .orderBy(asc(availabilityRules.weekday), asc(availabilityRules.startTime));
    const exceptions = await db.select().from(availabilityExceptions)
      .where(and(eq(availabilityExceptions.professionalId, req.params.professionalId), eq(availabilityExceptions.isBlocked, true)))
      .orderBy(asc(availabilityExceptions.date), asc(availabilityExceptions.startTime));
    res.json({ rules, exceptions });
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

availabilityRouter.get('/exceptions/me', requireRole('professional', 'admin'), async (req, res, next) => {
  try {
    const profile = await getOwnProfile(req.currentUser!.id);
    const rows = await db.select().from(availabilityExceptions)
      .where(eq(availabilityExceptions.professionalId, profile.id))
      .orderBy(asc(availabilityExceptions.date), asc(availabilityExceptions.startTime));
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

availabilityRouter.post('/exceptions/me', requireRole('professional', 'admin'), validateBody(availabilityExceptionSchema), async (req, res, next) => {
  try {
    const profile = await getOwnProfile(req.currentUser!.id);
    const [created] = await db.insert(availabilityExceptions).values({ ...req.body, professionalId: profile.id }).returning();
    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
});

availabilityRouter.patch('/exceptions/:id', requireRole('professional', 'admin'), validateBody(updateAvailabilityExceptionSchema), async (req, res, next) => {
  try {
    const profile = await getOwnProfile(req.currentUser!.id);
    const [updated] = await db.update(availabilityExceptions)
      .set({ ...req.body, updatedAt: new Date() })
      .where(and(eq(availabilityExceptions.id, req.params.id), eq(availabilityExceptions.professionalId, profile.id)))
      .returning();
    if (!updated) throw new HttpError(404, 'Availability exception not found');
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

availabilityRouter.delete('/exceptions/:id', requireRole('professional', 'admin'), async (req, res, next) => {
  try {
    const profile = await getOwnProfile(req.currentUser!.id);
    const [deleted] = await db.delete(availabilityExceptions)
      .where(and(eq(availabilityExceptions.id, req.params.id), eq(availabilityExceptions.professionalId, profile.id)))
      .returning();
    if (!deleted) throw new HttpError(404, 'Availability exception not found');
    res.json({ ok: true });
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
