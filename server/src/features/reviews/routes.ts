import { Router } from 'express';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { bookings, professionalProfiles, reviews } from '../../db/schema.js';
import { requireAuth } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import { createNotification } from '../notifications/service.js';
import { HttpError, sendCreated } from '../../utils/http.js';
import { reviewSchema } from './schemas.js';

export const reviewsRouter = Router();

async function requireVisibleProfile(professionalId: string) {
  const [profile] = await db.select({ id: professionalProfiles.id }).from(professionalProfiles)
    .where(and(
      eq(professionalProfiles.id, professionalId),
      eq(professionalProfiles.status, 'approved'),
      eq(professionalProfiles.isVisible, true),
    ))
    .limit(1);
  if (!profile) throw new HttpError(404, 'Professional reviews not found');
}

reviewsRouter.get('/professional/:professionalId', async (req, res, next) => {
  try {
    await requireVisibleProfile(req.params.professionalId);
    const rows = await db.select().from(reviews)
      .where(and(eq(reviews.professionalId, req.params.professionalId), eq(reviews.isVisible, true)))
      .orderBy(desc(reviews.createdAt));
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

reviewsRouter.post('/', requireAuth, validateBody(reviewSchema), async (req, res, next) => {
  try {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, req.body.bookingId)).limit(1);
    if (!booking) throw new HttpError(404, 'Booking not found');
    if (booking.clientId !== req.currentUser!.id) throw new HttpError(403, 'Only the booking client can review this appointment');
    if (booking.status !== 'completed') throw new HttpError(400, 'Only completed bookings can be reviewed');

    const [existing] = await db.select().from(reviews).where(eq(reviews.bookingId, booking.id)).limit(1);
    if (existing) throw new HttpError(409, 'This booking has already been reviewed');

    const [created] = await db.insert(reviews).values({
      bookingId: booking.id,
      clientId: req.currentUser!.id,
      professionalId: booking.professionalId,
      rating: req.body.rating,
      comment: req.body.comment,
    }).returning();

    const [profile] = await db.select().from(professionalProfiles).where(eq(professionalProfiles.id, booking.professionalId)).limit(1);
    if (profile) {
      await createNotification({
        userId: profile.userId,
        type: 'review_received',
        title: 'New review received',
        body: `${req.currentUser!.firstName} left a ${req.body.rating}-star review.`,
        actionUrl: `/pros/${profile.slug}`,
      });
    }

    sendCreated(res, created);
  } catch (error) {
    next(error);
  }
});
