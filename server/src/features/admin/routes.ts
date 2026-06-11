import { Router } from 'express';
import { and, count, desc, eq, gte, lte, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../db/client.js';
import { adminActions, bookingDisputes, bookings, professionalProfiles, reviews, services, users } from '../../db/schema.js';
import { requireRole } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import { HttpError } from '../../utils/http.js';
import { createNotification } from '../notifications/service.js';

export const adminRouter = Router();
adminRouter.use(requireRole('admin'));

const moderationNoteSchema = z.object({
  note: z.string().max(1000).optional().or(z.literal('')),
});

adminRouter.get('/stats', async (_req, res, next) => {
  try {
    const [userCount, professionalCount, bookingCount, reviewCount] = await Promise.all([
      db.select({ value: count() }).from(users),
      db.select({ value: count() }).from(professionalProfiles),
      db.select({ value: count() }).from(bookings),
      db.select({ value: count() }).from(reviews),
    ]);

    res.json({
      users: userCount[0]?.value ?? 0,
      professionals: professionalCount[0]?.value ?? 0,
      bookings: bookingCount[0]?.value ?? 0,
      reviews: reviewCount[0]?.value ?? 0,
    });
  } catch (error) {
    next(error);
  }
});

adminRouter.get('/analytics', async (_req, res, next) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60_000);
    const [bookingRevenue, pendingBookings, openDisputes, approvalBacklog, recentReviews] = await Promise.all([
      db.select({ totalRevenueCents: sql<number>`coalesce(sum(${bookings.priceCents}), 0)`, completedBookings: count() }).from(bookings).where(and(eq(bookings.status, 'completed'), gte(bookings.completedAt, thirtyDaysAgo))),
      db.select({ value: count() }).from(bookings).where(eq(bookings.status, 'pending')),
      db.select({ value: count() }).from(bookingDisputes).where(sql`${bookingDisputes.status} in ('open', 'under_review')`),
      db.select({ value: count() }).from(professionalProfiles).where(eq(professionalProfiles.status, 'pending_review')),
      db.select({ averageRating: sql<number>`coalesce(avg(${reviews.rating}), 0)`, reviewCount: count() }).from(reviews).where(gte(reviews.createdAt, thirtyDaysAgo)),
    ]);
    res.json({
      thirtyDayRevenueCents: Number(bookingRevenue[0]?.totalRevenueCents ?? 0),
      thirtyDayCompletedBookings: bookingRevenue[0]?.completedBookings ?? 0,
      pendingBookings: pendingBookings[0]?.value ?? 0,
      openDisputes: openDisputes[0]?.value ?? 0,
      approvalBacklog: approvalBacklog[0]?.value ?? 0,
      thirtyDayAverageRating: Number(recentReviews[0]?.averageRating ?? 0),
      thirtyDayReviewCount: recentReviews[0]?.reviewCount ?? 0,
    });
  } catch (error) {
    next(error);
  }
});

adminRouter.get('/operations', async (_req, res, next) => {
  try {
    const now = new Date();
    const soon = new Date(Date.now() + 48 * 60 * 60_000);
    const [upcomingBookings, openDisputeRows, lowTrustProfiles] = await Promise.all([
      db.select({ id: bookings.id, startsAt: bookings.startsAt, status: bookings.status, serviceName: services.name, clientFirstName: users.firstName, clientLastName: users.lastName, professionalName: professionalProfiles.displayName })
        .from(bookings)
        .innerJoin(services, eq(services.id, bookings.serviceId))
        .innerJoin(users, eq(users.id, bookings.clientId))
        .innerJoin(professionalProfiles, eq(professionalProfiles.id, bookings.professionalId))
        .where(and(gte(bookings.startsAt, now), lte(bookings.startsAt, soon)))
        .orderBy(bookings.startsAt)
        .limit(12),
      db.select().from(bookingDisputes).where(sql`${bookingDisputes.status} in ('open', 'under_review')`).orderBy(desc(bookingDisputes.createdAt)).limit(12),
      db.select({ id: professionalProfiles.id, displayName: professionalProfiles.displayName, status: professionalProfiles.status, trustScore: professionalProfiles.trustScore, city: professionalProfiles.city, state: professionalProfiles.state })
        .from(professionalProfiles)
        .where(and(eq(professionalProfiles.status, 'approved'), lte(professionalProfiles.trustScore, 40)))
        .orderBy(professionalProfiles.trustScore)
        .limit(12),
    ]);
    res.json({ upcomingBookings, openDisputes: openDisputeRows, lowTrustProfiles });
  } catch (error) {
    next(error);
  }
});

adminRouter.get('/users', async (_req, res, next) => {
  try {
    const rows = await db.select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      phone: users.phone,
      avatarUrl: users.avatarUrl,
      role: users.role,
      isActive: users.isActive,
      lastLoginAt: users.lastLoginAt,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    }).from(users).orderBy(desc(users.createdAt)).limit(50);
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

adminRouter.get('/professionals/pending', async (_req, res, next) => {
  try {
    const rows = await db.select().from(professionalProfiles).where(eq(professionalProfiles.status, 'pending_review')).orderBy(desc(professionalProfiles.updatedAt));
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

adminRouter.get('/actions', async (_req, res, next) => {
  try {
    const rows = await db.select().from(adminActions).orderBy(desc(adminActions.createdAt)).limit(50);
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

async function moderateProfile(params: {
  adminId: string;
  profileId: string;
  status: 'approved' | 'pending_review' | 'suspended';
  isVisible: boolean;
  action: string;
  notificationTitle: string;
  notificationBody: string;
  note?: string;
}) {
  return db.transaction(async (tx) => {
    const [profile] = await tx.update(professionalProfiles)
      .set({
        status: params.status,
        isVisible: params.isVisible,
        approvedAt: params.status === 'approved' ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(professionalProfiles.id, params.profileId))
      .returning();
    if (!profile) throw new HttpError(404, 'Professional profile not found');

    await tx.insert(adminActions).values({
      adminId: params.adminId,
      targetType: 'professional_profile',
      targetId: profile.id,
      action: params.action,
      note: params.note || `${params.action} profile ${profile.displayName}`,
    });

    await createNotification({
      userId: profile.userId,
      type: params.status === 'approved' ? 'profile_approved' : params.status === 'suspended' ? 'profile_suspended' : 'system',
      title: params.notificationTitle,
      body: params.notificationBody,
      actionUrl: '/professional/profile',
    }, tx);

    return profile;
  });
}

adminRouter.post('/professionals/:id/approve', validateBody(moderationNoteSchema), async (req, res, next) => {
  try {
    const profile = await moderateProfile({
      adminId: req.currentUser!.id,
      profileId: req.params.id,
      status: 'approved',
      isVisible: true,
      action: 'approved',
      note: req.body.note,
      notificationTitle: 'Your profile is approved',
      notificationBody: 'Clients can now discover and book your services.',
    });
    res.json(profile);
  } catch (error) {
    next(error);
  }
});

adminRouter.post('/professionals/:id/request-changes', validateBody(moderationNoteSchema), async (req, res, next) => {
  try {
    const profile = await moderateProfile({
      adminId: req.currentUser!.id,
      profileId: req.params.id,
      status: 'pending_review',
      isVisible: false,
      action: 'changes_requested',
      note: req.body.note,
      notificationTitle: 'Profile changes requested',
      notificationBody: req.body.note || 'Please review your professional profile and update the details before it can be approved.',
    });
    res.json(profile);
  } catch (error) {
    next(error);
  }
});

adminRouter.post('/professionals/:id/suspend', validateBody(moderationNoteSchema), async (req, res, next) => {
  try {
    const profile = await moderateProfile({
      adminId: req.currentUser!.id,
      profileId: req.params.id,
      status: 'suspended',
      isVisible: false,
      action: 'suspended',
      note: req.body.note,
      notificationTitle: 'Your profile has been suspended',
      notificationBody: req.body.note || 'Your profile is temporarily hidden. Please contact support or update your profile for review.',
    });
    res.json(profile);
  } catch (error) {
    next(error);
  }
});
