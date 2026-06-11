import { Router } from 'express';
import { and, eq, ilike, or } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { professionalProfiles, users } from '../../db/schema.js';
import { requireRole } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import { HttpError, sendCreated } from '../../utils/http.js';
import { slugify } from '../../utils/slug.js';
import { professionalProfileSchema } from './schemas.js';

export const professionalsRouter = Router();

professionalsRouter.get('/', async (req, res, next) => {
  try {
    const filters = [eq(professionalProfiles.status, 'approved'), eq(professionalProfiles.isVisible, true)];
    if (typeof req.query.category === 'string' && req.query.category) filters.push(eq(professionalProfiles.category, req.query.category));
    if (typeof req.query.city === 'string' && req.query.city) filters.push(ilike(professionalProfiles.city, `%${req.query.city}%`));
    if (typeof req.query.state === 'string' && req.query.state) filters.push(ilike(professionalProfiles.state, `%${req.query.state}%`));
    if (typeof req.query.q === 'string' && req.query.q) {
      filters.push(or(
        ilike(professionalProfiles.displayName, `%${req.query.q}%`),
        ilike(professionalProfiles.headline, `%${req.query.q}%`),
        ilike(professionalProfiles.bio, `%${req.query.q}%`),
      )!);
    }

    const rows = await db.select({
      id: professionalProfiles.id,
      displayName: professionalProfiles.displayName,
      slug: professionalProfiles.slug,
      headline: professionalProfiles.headline,
      category: professionalProfiles.category,
      specialties: professionalProfiles.specialties,
      city: professionalProfiles.city,
      state: professionalProfiles.state,
      profileImageUrl: professionalProfiles.profileImageUrl,
      coverImageUrl: professionalProfiles.coverImageUrl,
    }).from(professionalProfiles).where(and(...filters)).limit(60);
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

professionalsRouter.get('/me', requireRole('professional', 'admin'), async (req, res, next) => {
  try {
    const [profile] = await db.select().from(professionalProfiles).where(eq(professionalProfiles.userId, req.currentUser!.id)).limit(1);
    res.json(profile ?? null);
  } catch (error) {
    next(error);
  }
});

professionalsRouter.post('/me', requireRole('professional', 'admin'), validateBody(professionalProfileSchema), async (req, res, next) => {
  try {
    const [existing] = await db.select().from(professionalProfiles).where(eq(professionalProfiles.userId, req.currentUser!.id)).limit(1);
    if (existing) throw new HttpError(409, 'Professional profile already exists');

    const baseSlug = slugify(req.body.displayName);
    const suffix = Math.random().toString(36).slice(2, 7);
    const [profile] = await db.insert(professionalProfiles).values({
      ...req.body,
      slug: `${baseSlug}-${suffix}`,
      userId: req.currentUser!.id,
      status: 'pending_review',
      isVisible: false,
    }).returning();
    sendCreated(res, profile);
  } catch (error) {
    next(error);
  }
});

professionalsRouter.patch('/me', requireRole('professional', 'admin'), validateBody(professionalProfileSchema.partial()), async (req, res, next) => {
  try {
    const [updated] = await db.update(professionalProfiles)
      .set({ ...req.body, updatedAt: new Date(), status: 'pending_review', isVisible: false })
      .where(eq(professionalProfiles.userId, req.currentUser!.id))
      .returning();
    if (!updated) throw new HttpError(404, 'Professional profile not found');
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

professionalsRouter.get('/:slug', async (req, res, next) => {
  try {
    const [profile] = await db.select({
      id: professionalProfiles.id,
      userId: professionalProfiles.userId,
      displayName: professionalProfiles.displayName,
      slug: professionalProfiles.slug,
      headline: professionalProfiles.headline,
      bio: professionalProfiles.bio,
      category: professionalProfiles.category,
      specialties: professionalProfiles.specialties,
      city: professionalProfiles.city,
      state: professionalProfiles.state,
      profileImageUrl: professionalProfiles.profileImageUrl,
      coverImageUrl: professionalProfiles.coverImageUrl,
      instagramUrl: professionalProfiles.instagramUrl,
      websiteUrl: professionalProfiles.websiteUrl,
      ownerFirstName: users.firstName,
      ownerLastName: users.lastName,
      licenseLabel: professionalProfiles.licenseLabel,
    }).from(professionalProfiles)
      .innerJoin(users, eq(users.id, professionalProfiles.userId))
      .where(and(eq(professionalProfiles.slug, req.params.slug), eq(professionalProfiles.status, 'approved'), eq(professionalProfiles.isVisible, true)))
      .limit(1);
    if (!profile) throw new HttpError(404, 'Professional not found');
    res.json(profile);
  } catch (error) {
    next(error);
  }
});


professionalsRouter.get('/admin/pending/list', requireRole('admin'), async (_req, res, next) => {
  try {
    const rows = await db.select().from(professionalProfiles).where(eq(professionalProfiles.status, 'pending_review'));
    res.json(rows);
  } catch (error) {
    next(error);
  }
});
