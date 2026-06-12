import { Router } from 'express';
import { and, desc, eq, ilike, inArray, or } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { bookingPolicies, calendarConnections, portfolioItems, professionalProfiles, reviews, services, users } from '../../db/schema.js';
import { requireRole } from '../../middleware/auth.js';
import { validateBody, validateQuery } from '../../middleware/validate.js';
import { HttpError, sendCreated } from '../../utils/http.js';
import { requireOwnProfile } from '../../utils/profile.js';
import { slugify } from '../../utils/slug.js';
import { bookingPolicySchema, calendarConnectionSchema, professionalProfileSchema, professionalSearchSchema } from './schemas.js';

export const professionalsRouter = Router();

const MAX_SLUG_ATTEMPTS = 25;

type ProfessionalSearchQuery = {
  category?: string;
  city?: string;
  state?: string;
  q?: string;
  specialty?: string;
  minRating?: number;
  maxPriceCents?: number;
  verified?: boolean;
  hasPortfolio?: boolean;
  sort?: 'recommended' | 'rating' | 'price_low' | 'newest';
};

type ProfessionalSearchRow = {
  id: string;
  displayName: string;
  slug: string;
  headline: string;
  category: string;
  specialties: string[];
  city: string;
  state: string;
  profileImageUrl: string | null;
  coverImageUrl: string | null;
  licenseLabel: string | null;
  approvedAt: Date | null;
  verifiedAt: Date | null;
  trustScore: number;
  profileCompletionPercent: number;
  createdAt: Date;
};

type ProfessionalStats = {
  averageRating: number | null;
  reviewCount: number;
  startingPriceCents: number | null;
  portfolioCount: number;
};

function candidateSlug(baseSlug: string, attempt: number) {
  return attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;
}

function profileCompletenessScore(payload: Record<string, unknown>) {
  const checks = [
    payload.displayName,
    payload.headline,
    payload.bio,
    payload.category,
    payload.specialties && Array.isArray(payload.specialties) && payload.specialties.length > 0,
    payload.city,
    payload.state,
    payload.profileImageUrl,
    payload.coverImageUrl,
    payload.licenseLabel,
  ];
  const complete = checks.filter(Boolean).length;
  return Math.round((complete / checks.length) * 100);
}

function nextOnboardingStep(completionPercent: number) {
  if (completionPercent < 60) return 'profile';
  if (completionPercent < 75) return 'services';
  if (completionPercent < 90) return 'availability';
  return 'review';
}

function calculateTrustScore(row: ProfessionalSearchRow, stats: ProfessionalStats) {
  const ratingScore = stats.averageRating ? stats.averageRating * 14 : 0;
  const reviewScore = Math.min(stats.reviewCount, 10) * 2;
  const portfolioScore = Math.min(stats.portfolioCount, 8) * 1.5;
  const verificationScore = row.verifiedAt || row.licenseLabel ? 14 : 0;
  const profileScore = row.profileCompletionPercent * 0.25;
  return Math.min(100, Math.round(ratingScore + reviewScore + portfolioScore + verificationScore + profileScore));
}

async function loadProfessionalStats(professionalIds: string[]) {
  const stats = new Map<string, ProfessionalStats>();
  for (const id of professionalIds) {
    stats.set(id, {
      averageRating: null,
      reviewCount: 0,
      startingPriceCents: null,
      portfolioCount: 0,
    });
  }

  if (professionalIds.length === 0) return stats;

  const [reviewRows, serviceRows, portfolioRows] = await Promise.all([
    db.select({ professionalId: reviews.professionalId, rating: reviews.rating })
      .from(reviews)
      .where(and(inArray(reviews.professionalId, professionalIds), eq(reviews.isVisible, true))),
    db.select({ professionalId: services.professionalId, priceCents: services.priceCents })
      .from(services)
      .where(and(inArray(services.professionalId, professionalIds), eq(services.isActive, true))),
    db.select({ professionalId: portfolioItems.professionalId })
      .from(portfolioItems)
      .where(and(inArray(portfolioItems.professionalId, professionalIds), eq(portfolioItems.isVisible, true))),
  ]);

  const ratingTotals = new Map<string, { total: number; count: number }>();
  for (const review of reviewRows) {
    const current = ratingTotals.get(review.professionalId) ?? { total: 0, count: 0 };
    current.total += review.rating;
    current.count += 1;
    ratingTotals.set(review.professionalId, current);
  }

  for (const [professionalId, value] of ratingTotals.entries()) {
    const current = stats.get(professionalId);
    if (!current) continue;
    current.averageRating = Math.round((value.total / value.count) * 10) / 10;
    current.reviewCount = value.count;
  }

  for (const service of serviceRows) {
    const current = stats.get(service.professionalId);
    if (!current) continue;
    current.startingPriceCents = current.startingPriceCents === null ? service.priceCents : Math.min(current.startingPriceCents, service.priceCents);
  }

  for (const item of portfolioRows) {
    const current = stats.get(item.professionalId);
    if (!current) continue;
    current.portfolioCount += 1;
  }

  return stats;
}

function enrichProfessional(row: ProfessionalSearchRow, stats: ProfessionalStats) {
  const isVerified = Boolean(row.verifiedAt || (row.approvedAt && row.licenseLabel));
  return {
    id: row.id,
    displayName: row.displayName,
    slug: row.slug,
    headline: row.headline,
    category: row.category,
    specialties: row.specialties,
    city: row.city,
    state: row.state,
    profileImageUrl: row.profileImageUrl,
    coverImageUrl: row.coverImageUrl,
    licenseLabel: row.licenseLabel,
    isVerified,
    verifiedAt: row.verifiedAt,
    trustScore: Math.max(row.trustScore, calculateTrustScore(row, stats)),
    profileCompletionPercent: row.profileCompletionPercent,
    averageRating: stats.averageRating,
    reviewCount: stats.reviewCount,
    startingPriceCents: stats.startingPriceCents,
    portfolioCount: stats.portfolioCount,
  };
}

professionalsRouter.get('/', validateQuery(professionalSearchSchema), async (req, res, next) => {
  try {
    const { category, city, state, q, specialty, minRating, maxPriceCents, verified, hasPortfolio, sort = 'recommended' } = req.query as ProfessionalSearchQuery;
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
      licenseLabel: professionalProfiles.licenseLabel,
      approvedAt: professionalProfiles.approvedAt,
      verifiedAt: professionalProfiles.verifiedAt,
      trustScore: professionalProfiles.trustScore,
      profileCompletionPercent: professionalProfiles.profileCompletionPercent,
      createdAt: professionalProfiles.createdAt,
    }).from(professionalProfiles).where(and(...filters)).orderBy(desc(professionalProfiles.approvedAt)).limit(200);

    const stats = await loadProfessionalStats(rows.map((row) => row.id));
    let enriched = rows.map((row) => enrichProfessional(row, stats.get(row.id)!));

    if (specialty) enriched = enriched.filter((row) => row.specialties.some((item) => item.toLowerCase().includes(specialty.toLowerCase())));
    if (minRating) enriched = enriched.filter((row) => (row.averageRating ?? 0) >= minRating);
    if (maxPriceCents !== undefined) enriched = enriched.filter((row) => row.startingPriceCents !== null && row.startingPriceCents <= maxPriceCents);
    if (verified === true) enriched = enriched.filter((row) => row.isVerified);
    if (hasPortfolio === true) enriched = enriched.filter((row) => row.portfolioCount > 0);

    enriched.sort((left, right) => {
      if (sort === 'rating') return (right.averageRating ?? 0) - (left.averageRating ?? 0) || right.reviewCount - left.reviewCount;
      if (sort === 'price_low') return (left.startingPriceCents ?? Number.MAX_SAFE_INTEGER) - (right.startingPriceCents ?? Number.MAX_SAFE_INTEGER);
      if (sort === 'newest') return 0;
      return right.trustScore - left.trustScore || (right.averageRating ?? 0) - (left.averageRating ?? 0);
    });

    res.json(enriched.slice(0, 60));
  } catch (error) {
    next(error);
  }
});

professionalsRouter.get('/me', requireRole('professional', 'business', 'admin'), async (req, res, next) => {
  try {
    const [profile] = await db.select().from(professionalProfiles).where(eq(professionalProfiles.userId, req.currentUser!.id)).limit(1);
    res.json(profile ?? null);
  } catch (error) {
    next(error);
  }
});

professionalsRouter.post('/me', requireRole('professional', 'business', 'admin'), validateBody(professionalProfileSchema), async (req, res, next) => {
  try {
    const [existing] = await db.select().from(professionalProfiles).where(eq(professionalProfiles.userId, req.currentUser!.id)).limit(1);
    if (existing) throw new HttpError(409, 'Professional profile already exists');

    const completionPercent = profileCompletenessScore(req.body);
    const baseSlug = slugify(req.body.displayName);
    for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt += 1) {
      const [profile] = await db.insert(professionalProfiles).values({
        ...req.body,
        slug: candidateSlug(baseSlug, attempt),
        userId: req.currentUser!.id,
        organizationId: req.currentOrganization?.id ?? null,
        status: 'pending_review',
        isVisible: false,
        profileCompletionPercent: completionPercent,
        onboardingStep: nextOnboardingStep(completionPercent),
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

professionalsRouter.patch('/me', requireRole('professional', 'business', 'admin'), validateBody(professionalProfileSchema.partial()), async (req, res, next) => {
  try {
    const [current] = await db.select().from(professionalProfiles).where(eq(professionalProfiles.userId, req.currentUser!.id)).limit(1);
    if (!current) throw new HttpError(404, 'Professional profile not found');

    const merged = { ...current, ...req.body };
    const completionPercent = profileCompletenessScore(merged);
    const [updated] = await db.update(professionalProfiles)
      .set({
        ...req.body,
        updatedAt: new Date(),
        status: 'pending_review',
        isVisible: false,
        profileCompletionPercent: completionPercent,
        onboardingStep: nextOnboardingStep(completionPercent),
      })
      .where(eq(professionalProfiles.userId, req.currentUser!.id))
      .returning();
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

professionalsRouter.get('/me/onboarding', requireRole('professional', 'business', 'admin'), async (req, res, next) => {
  try {
    const [profile] = await db.select().from(professionalProfiles).where(eq(professionalProfiles.userId, req.currentUser!.id)).limit(1);
    if (!profile) {
      res.json({ profile: null, completionPercent: 0, nextStep: 'profile', checklist: { profile: false, services: false, availability: false, portfolio: false, review: false } });
      return;
    }

    const [serviceRows, policyRows, calendarRows, portfolioRows] = await Promise.all([
      db.select({ id: services.id }).from(services).where(and(eq(services.professionalId, profile.id), eq(services.isActive, true))),
      db.select({ id: bookingPolicies.id }).from(bookingPolicies).where(eq(bookingPolicies.professionalId, profile.id)).limit(1),
      db.select({ id: calendarConnections.id }).from(calendarConnections).where(eq(calendarConnections.professionalId, profile.id)).limit(1),
      db.select({ id: portfolioItems.id }).from(portfolioItems).where(and(eq(portfolioItems.professionalId, profile.id), eq(portfolioItems.isVisible, true))).limit(1),
    ]);

    const checklist = {
      profile: profile.profileCompletionPercent >= 60,
      services: serviceRows.length > 0,
      availability: Boolean(policyRows.length || calendarRows.length),
      portfolio: portfolioRows.length > 0,
      review: profile.status === 'approved',
    };
    const completed = Object.values(checklist).filter(Boolean).length;
    const completionPercent = Math.max(profile.profileCompletionPercent, Math.round((completed / Object.keys(checklist).length) * 100));
    const nextStep = !checklist.profile ? 'profile' : !checklist.services ? 'services' : !checklist.availability ? 'availability' : !checklist.portfolio ? 'portfolio' : 'review';

    res.json({ profile, completionPercent, nextStep, checklist });
  } catch (error) {
    next(error);
  }
});

professionalsRouter.get('/me/booking-policy', requireRole('professional', 'business', 'admin'), async (req, res, next) => {
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

professionalsRouter.put('/me/booking-policy', requireRole('professional', 'business', 'admin'), validateBody(bookingPolicySchema), async (req, res, next) => {
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

professionalsRouter.get('/me/calendar-connections', requireRole('professional', 'business', 'admin'), async (req, res, next) => {
  try {
    const profile = await requireOwnProfile(req.currentUser!.id);
    const rows = await db.select().from(calendarConnections).where(eq(calendarConnections.professionalId, profile.id));
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

professionalsRouter.put('/me/calendar-connections', requireRole('professional', 'business', 'admin'), validateBody(calendarConnectionSchema), async (req, res, next) => {
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
      approvedAt: professionalProfiles.approvedAt,
      verifiedAt: professionalProfiles.verifiedAt,
      trustScore: professionalProfiles.trustScore,
      profileCompletionPercent: professionalProfiles.profileCompletionPercent,
      createdAt: professionalProfiles.createdAt,
    }).from(professionalProfiles)
      .innerJoin(users, eq(users.id, professionalProfiles.userId))
      .where(and(eq(professionalProfiles.slug, req.params.slug), eq(professionalProfiles.status, 'approved'), eq(professionalProfiles.isVisible, true)))
      .limit(1);
    if (!profile) throw new HttpError(404, 'Professional not found');

    const stats = await loadProfessionalStats([profile.id]);
    res.json({ ...profile, ...enrichProfessional(profile, stats.get(profile.id)!) });
  } catch (error) {
    next(error);
  }
});
