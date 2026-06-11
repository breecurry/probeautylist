import { Router } from 'express';
import { asc, eq } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { bookings, messages, professionalProfiles } from '../../db/schema.js';
import { requireAuth } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import { HttpError, sendCreated } from '../../utils/http.js';
import { createNotification } from '../notifications/service.js';
import { messageSchema } from './schemas.js';

export const messagesRouter = Router();

async function getBookingParticipantContext(bookingId: string, userId: string) {
  const [booking] = await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1);
  if (!booking) throw new HttpError(404, 'Booking not found');

  const [profile] = await db.select().from(professionalProfiles).where(eq(professionalProfiles.id, booking.professionalId)).limit(1);
  if (!profile) throw new HttpError(404, 'Professional profile not found');

  const isClient = booking.clientId === userId;
  const isProfessional = profile.userId === userId;
  if (!isClient && !isProfessional) throw new HttpError(403, 'You do not have access to this conversation');

  return {
    booking,
    profile,
    recipientId: isClient ? profile.userId : booking.clientId,
  };
}

messagesRouter.get('/booking/:bookingId', requireAuth, async (req, res, next) => {
  try {
    await getBookingParticipantContext(req.params.bookingId, req.currentUser!.id);
    const rows = await db.select().from(messages)
      .where(eq(messages.bookingId, req.params.bookingId))
      .orderBy(asc(messages.createdAt));
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

messagesRouter.post('/booking/:bookingId', requireAuth, validateBody(messageSchema), async (req, res, next) => {
  try {
    const context = await getBookingParticipantContext(req.params.bookingId, req.currentUser!.id);
    const [created] = await db.insert(messages).values({
      bookingId: context.booking.id,
      senderId: req.currentUser!.id,
      recipientId: context.recipientId,
      body: req.body.body,
    }).returning();

    await createNotification({
      userId: context.recipientId,
      type: 'message_received',
      title: 'New message',
      body: `${req.currentUser!.firstName} sent you a message about a booking.`,
      actionUrl: req.currentUser!.id === context.booking.clientId ? '/professional/bookings' : '/client/bookings',
    });

    sendCreated(res, created);
  } catch (error) {
    next(error);
  }
});
