import { Router } from 'express';
import { and, desc, eq, inArray, notInArray, or } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../db/client.js';
import { bookings, favorites, professionalProfiles, savedSearches } from '../../db/schema.js';
import { requireRole } from '../../middleware/auth.js';
import { validateBody, validateQuery } from '../../middleware/validate.js';
import { HttpError, sendCreated } from '../../utils/http.js';
import { savedSearchSchema } from './schemas.js';

export const discoveryRouter = Router();

const recommendationQuerySchema = z.object({ limit: z.coerce.number().int().min(1).max(24).default(6) });

function clean(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function profileSummaryFields() {
  return {
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
    licenseLabel: professionalProfiles.licenseLabel,
    verifiedAt: professionalProfiles.verifiedAt,
    trustScore: professionalProfiles.trustScore,
    profileCompletionPercent: professionalProfiles.profileCompletionPercent,
  };
}

discoveryRouter.get('/saved-searches', requireRole('client', 'admin'), async (req, res, next) => {
  try {
    const rows = await db.select().from(savedSearches).where(eq(savedSearches.clientId, req.currentUser!.id)).orderBy(desc(savedSearches.updatedAt));
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

discoveryRouter.post('/saved-searches', requireRole('client', 'admin'), validateBody(savedSearchSchema), async (req, res, next) => {
  try {
    const input = req.body as z.infer<typeof savedSearchSchema>;
    const [created] = await db.insert(savedSearches).values({
      clientId: req.currentUser!.id,
      name: input.name,
      query: clean(input.query),
      category: clean(input.category),
      city: clean(input.city),
      state: clean(input.state),
      maxPriceCents: input.maxPriceCents ?? null,
      notifyOnNewMatches: input.notifyOnNewMatches,
    }).returning();
    sendCreated(res, created);
  } catch (error) {
    next(error);
  }
});

discoveryRouter.patch('/saved-searches/:id/viewed', requireRole('client', 'admin'), async (req, res, next) => {
  try {
    const [updated] = await db.update(savedSearches).set({ lastViewedAt: new Date(), updatedAt: new Date() }).where(and(
      eq(savedSearches.id, req.params.id),
      eq(savedSearches.clientId, req.currentUser!.id),
    )).returning();
    if (!updated) throw new HttpError(404, 'Saved search not found');
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

discoveryRouter.delete('/saved-searches/:id', requireRole('client', 'admin'), async (req, res, next) => {
  try {
    await db.delete(savedSearches).where(and(eq(savedSearches.id, req.params.id), eq(savedSearches.clientId, req.currentUser!.id)));
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

discoveryRouter.get('/recommendations', requireRole('client', 'admin'), validateQuery(recommendationQuerySchema), async (req, res, next) => {
  try {
    const { limit } = req.query as unknown as z.infer<typeof recommendationQuerySchema>;
    const [favoriteRows, bookingRows, savedRows] = await Promise.all([
      db.select({ professionalId: favorites.professionalId }).from(favorites).where(eq(favorites.clientId, req.currentUser!.id)),
      db.select({ professionalId: bookings.professionalId }).from(bookings).where(eq(bookings.clientId, req.currentUser!.id)),
      db.select({ category: savedSearches.category, city: savedSearches.city, state: savedSearches.state }).from(savedSearches).where(eq(savedSearches.clientId, req.currentUser!.id)),
    ]);

    const excludedIds = [...new Set([...favoriteRows, ...bookingRows].map((row) => row.professionalId))];
    const categories = savedRows.map((row) => row.category).filter((value): value is string => Boolean(value));
    const cities = savedRows.map((row) => row.city).filter((value): value is string => Boolean(value));
    const states = savedRows.map((row) => row.state).filter((value): value is string => Boolean(value));

    const personalizedFilters = [
      categories.length ? inArray(professionalProfiles.category, [...new Set(categories)]) : undefined,
      cities.length ? inArray(professionalProfiles.city, [...new Set(cities)]) : undefined,
      states.length ? inArray(professionalProfiles.state, [...new Set(states)]) : undefined,
    ].filter(Boolean);

    const conditions = [
      eq(professionalProfiles.status, 'approved'),
      eq(professionalProfiles.isVisible, true),
      excludedIds.length ? notInArray(professionalProfiles.id, excludedIds) : undefined,
      personalizedFilters.length ? or(...personalizedFilters) : undefined,
    ].filter(Boolean);

    const rows = await db.select(profileSummaryFields())
      .from(professionalProfiles)
      .where(and(...conditions))
      .orderBy(desc(professionalProfiles.trustScore), desc(professionalProfiles.updatedAt))
      .limit(limit);

    if (rows.length >= limit || personalizedFilters.length === 0) {
      res.json(rows.map((profile) => ({ ...profile, isVerified: Boolean(profile.verifiedAt) })));
      return;
    }

    const fallback = await db.select(profileSummaryFields())
      .from(professionalProfiles)
      .where(and(
        eq(professionalProfiles.status, 'approved'),
        eq(professionalProfiles.isVisible, true),
        excludedIds.length ? notInArray(professionalProfiles.id, [...excludedIds, ...rows.map((row) => row.id)]) : notInArray(professionalProfiles.id, rows.map((row) => row.id)),
      ))
      .orderBy(desc(professionalProfiles.trustScore), desc(professionalProfiles.updatedAt))
      .limit(limit - rows.length);

    res.json([...rows, ...fallback].map((profile) => ({ ...profile, isVerified: Boolean(profile.verifiedAt) })));
  } catch (error) {
    next(error);
  }
});
