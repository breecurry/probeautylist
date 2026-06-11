import { Router } from 'express';
import { and, eq, ilike, or } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { bookingPolicies, calendarConnections, professionalProfiles, users } from '../../db/schema.js';
import { requireRole } from '../../middleware/auth.js';
import { validateBody, validateQuery } from '../../middleware/validate.js';
import { HttpError, sendCreated } from '../../utils/http.js';
import { requireOwnProfile } from '../../utils/profile.js';
import { slugify } from '../../utils/slug.js';
import { bookingPolicySchema, calendarConnectionSchema, professionalProfileSchema, professionalSearchSchema } from './schemas.js';

export const professionalsRouter = Router();

const MAX_SLUG_ATTEMPTS = 25;

function candidateSlug(baseSlug: string, attempt: number) {
  return attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;
}

professionalsRouter.get('/', validateQuery(professionalSearchSchema), async (req, res, next) => {
  try {
    const { category, city, state, q } = req.query as { category?: string; city?: string; state?: string; q?: string };
    const filters = [eq(professionalProfiles.status, 'approved'), eq(professionalProfiles.isVisible, true)];
    if (category) filters.push(eq(professionalProfiles.category, category));
    if (city) filters.push(ilike(professionalProfiles.city, `%${city}%`));
    if (state) filters.push(ilike(professionalProfiles.state, `%${state}%`));
    if (q) {
      filters.push(or(
        ilike(professionalProfiles.displayName, `%${q}%`),
        ilike(professionalProfiles.headline, `%${q}%`),
        ilike(professionalProfiles.bio, `%${q}%`),
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
    for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt += 1) {
      const [profile] = await db.insert(professionalProfiles).values({
        ...req.body,
        slug: candidateSlug(baseSlug, attempt),
        userId: req.currentUser!.id,
        status: 'pending_review',
        isVisible: false,
      })
        .onConflictDoNothing({ target: professionalProfiles.slug })
        .returning();
      if (profile) {
        sendCreated(res, profile);
        return;
      }
    }

    throw new HttpError(409, 'A similar professional profile slug already exists. Please adjust the display name.');
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


professionalsRouter.get('/me/booking-policy', requireRole('professional', 'admin'), async (req, res, next) => {
  try {
    const profile = await requireOwnProfile(req.currentUser!.id);
    const [policy] = await db.select().from(bookingPolicies).where(eq(bookingPolicies.professionalId, profile.id)).limit(1);
    res.json(policy ?? {
      professionalId: profile.id,
      cancellationWindowHours: 24,
      cancellationFeeCents: 0,
      depositRequired: true,
      remindersEnabled: true,
      reminderHoursBefore: 24,
      policySummary: 'Deposits may be required to hold appointments. Cancellation rules are shown before booking.',
    });
  } catch (error) {
    next(error);
  }
});

professionalsRouter.put('/me/booking-policy', requireRole('professional', 'admin'), validateBody(bookingPolicySchema), async (req, res, next) => {
  try {
    const profile = await requireOwnProfile(req.currentUser!.id);
    const [policy] = await db.insert(bookingPolicies)
      .values({ ...req.body, professionalId: profile.id, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: bookingPolicies.professionalId,
        set: { ...req.body, updatedAt: new Date() },
      })
      .returning();
    res.json(policy);
  } catch (error) {
    next(error);
  }
});

professionalsRouter.get('/me/calendar-connections', requireRole('professional', 'admin'), async (req, res, next) => {
  try {
    const profile = await requireOwnProfile(req.currentUser!.id);
    const rows = await db.select().from(calendarConnections).where(eq(calendarConnections.professionalId, profile.id));
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

professionalsRouter.put('/me/calendar-connections', requireRole('professional', 'admin'), validateBody(calendarConnectionSchema), async (req, res, next) => {
  try {
    const profile = await requireOwnProfile(req.currentUser!.id);
    const [connection] = await db.insert(calendarConnections)
      .values({ ...req.body, professionalId: profile.id, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: [calendarConnections.professionalId, calendarConnections.provider],
        set: { ...req.body, updatedAt: new Date() },
      })
      .returning();
    res.json(connection);
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

