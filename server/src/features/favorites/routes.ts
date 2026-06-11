import { Router } from 'express';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { favorites, professionalProfiles } from '../../db/schema.js';
import { requireRole } from '../../middleware/auth.js';
import { HttpError } from '../../utils/http.js';

export const favoritesRouter = Router();

favoritesRouter.get('/', requireRole('client', 'admin'), async (req, res, next) => {
  try {
    const rows = await db.select({
      id: favorites.id,
      createdAt: favorites.createdAt,
      professional: {
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
      },
    })
      .from(favorites)
      .innerJoin(professionalProfiles, eq(professionalProfiles.id, favorites.professionalId))
      .where(and(
        eq(favorites.clientId, req.currentUser!.id),
        eq(professionalProfiles.status, 'approved'),
        eq(professionalProfiles.isVisible, true),
      ))
      .orderBy(desc(favorites.createdAt));
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

favoritesRouter.post('/:professionalId', requireRole('client', 'admin'), async (req, res, next) => {
  try {
    const [profile] = await db.select().from(professionalProfiles).where(and(
      eq(professionalProfiles.id, req.params.professionalId),
      eq(professionalProfiles.status, 'approved'),
      eq(professionalProfiles.isVisible, true),
    )).limit(1);
    if (!profile) throw new HttpError(404, 'Professional not found');

    const [existing] = await db.select().from(favorites).where(and(
      eq(favorites.clientId, req.currentUser!.id),
      eq(favorites.professionalId, profile.id),
    )).limit(1);
    if (existing) return res.json(existing);

    const [created] = await db.insert(favorites).values({ clientId: req.currentUser!.id, professionalId: profile.id }).returning();
    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
});

favoritesRouter.delete('/:professionalId', requireRole('client', 'admin'), async (req, res, next) => {
  try {
    await db.delete(favorites).where(and(
      eq(favorites.clientId, req.currentUser!.id),
      eq(favorites.professionalId, req.params.professionalId),
    ));
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});
