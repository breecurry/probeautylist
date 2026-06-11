import { Router } from 'express';
import { desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../db/client.js';
import { adminActions, bookings, professionalProfiles, reviews, users } from '../../db/schema.js';
import { requireRole, publicUser } from '../../middleware/auth.js';
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
    const [userRows, profileRows, bookingRows, reviewRows] = await Promise.all([
      db.select().from(users),
      db.select().from(professionalProfiles),
      db.select().from(bookings),
      db.select().from(reviews),
    ]);
    res.json({ users: userRows.length, professionals: profileRows.length, bookings: bookingRows.length, reviews: reviewRows.length });
  } catch (error) {
    next(error);
  }
});

adminRouter.get('/users', async (_req, res, next) => {
  try {
    const rows = await db.select().from(users).orderBy(desc(users.createdAt)).limit(50);
    res.json(rows.map(publicUser));
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
  const [profile] = await db.update(professionalProfiles)
    .set({
      status: params.status,
      isVisible: params.isVisible,
      approvedAt: params.status === 'approved' ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(professionalProfiles.id, params.profileId))
    .returning();
  if (!profile) throw new HttpError(404, 'Professional profile not found');

  await db.insert(adminActions).values({
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
  });

  return profile;
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
