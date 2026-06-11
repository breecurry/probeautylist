import { Router } from 'express';
import { and, desc, eq, gt, inArray, lt } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { availabilityRules, bookings, professionalProfiles, services } from '../../db/schema.js';
import { requireAuth } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import { createNotification } from '../notifications/service.js';
import { HttpError, sendCreated } from '../../utils/http.js';
import { createBookingSchema, updateBookingStatusSchema } from './schemas.js';

export const bookingsRouter = Router();

const transitions: Record<string, string[]> = {
  pending: ['confirmed', 'declined', 'cancelled_by_client'],
  confirmed: ['completed', 'cancelled_by_client', 'cancelled_by_professional', 'no_show'],
  declined: [],
  cancelled_by_client: [],
  cancelled_by_professional: [],
  completed: [],
  no_show: [],
};

const activeBookingStatuses = ['pending', 'confirmed'] as const;

function minutesFromTime(value: string) {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesFromDate(value: Date) {
  return value.getHours() * 60 + value.getMinutes();
}

async function isWithinWorkingHours(professionalId: string, startsAt: Date, endsAt: Date) {
  const weekday = startsAt.getDay();
  const rules = await db.select().from(availabilityRules).where(and(
    eq(availabilityRules.professionalId, professionalId),
    eq(availabilityRules.weekday, weekday),
    eq(availabilityRules.isActive, true),
  ));

  if (rules.length === 0) return true;

  const startMinutes = minutesFromDate(startsAt);
  const endMinutes = minutesFromDate(endsAt);
  return rules.some((rule) => startMinutes >= minutesFromTime(rule.startTime) && endMinutes <= minutesFromTime(rule.endTime));
}

bookingsRouter.get('/', requireAuth, async (req, res, next) => {
  try {
    const user = req.currentUser!;
    if (user.role === 'professional') {
      const [profile] = await db.select().from(professionalProfiles).where(eq(professionalProfiles.userId, user.id)).limit(1);
      if (!profile) return res.json([]);
      const rows = await db.select().from(bookings).where(eq(bookings.professionalId, profile.id)).orderBy(desc(bookings.startsAt));
      return res.json(rows);
    }

    const rows = await db.select().from(bookings).where(eq(bookings.clientId, user.id)).orderBy(desc(bookings.startsAt));
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

bookingsRouter.post('/', requireAuth, validateBody(createBookingSchema), async (req, res, next) => {
  try {
    if (req.currentUser!.role !== 'client') throw new HttpError(403, 'Only client accounts can request bookings');
    const [service] = await db.select().from(services).where(and(eq(services.id, req.body.serviceId), eq(services.professionalId, req.body.professionalId), eq(services.isActive, true))).limit(1);
    if (!service) throw new HttpError(404, 'Service not found');

    const [profile] = await db.select().from(professionalProfiles).where(and(eq(professionalProfiles.id, req.body.professionalId), eq(professionalProfiles.status, 'approved'), eq(professionalProfiles.isVisible, true))).limit(1);
    if (!profile) throw new HttpError(404, 'Professional not available for booking');

    const startsAt = new Date(req.body.startsAt);
    if (startsAt.getTime() <= Date.now()) throw new HttpError(400, 'Booking requests must be for a future date and time');

    const endsAt = new Date(startsAt.getTime() + service.durationMinutes * 60_000);
    const available = await isWithinWorkingHours(profile.id, startsAt, endsAt);
    if (!available) throw new HttpError(409, 'Requested time is outside this professional’s working hours');

    const [conflict] = await db.select().from(bookings).where(and(
      eq(bookings.professionalId, profile.id),
      inArray(bookings.status, activeBookingStatuses),
      lt(bookings.startsAt, endsAt),
      gt(bookings.endsAt, startsAt),
    )).limit(1);
    if (conflict) throw new HttpError(409, 'That time is already requested or booked');

    const [created] = await db.insert(bookings).values({
      clientId: req.currentUser!.id,
      professionalId: profile.id,
      serviceId: service.id,
      startsAt,
      endsAt,
      priceCents: service.priceCents,
      depositCents: service.depositCents,
      clientNote: req.body.clientNote,
    }).returning();

    await createNotification({
      userId: profile.userId,
      type: 'booking_requested',
      title: 'New booking request',
      body: `${req.currentUser!.firstName} requested ${service.name}.`,
      actionUrl: '/professional/bookings',
    });

    sendCreated(res, created);
  } catch (error) {
    next(error);
  }
});

bookingsRouter.patch('/:id/status', requireAuth, validateBody(updateBookingStatusSchema), async (req, res, next) => {
  try {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, req.params.id)).limit(1);
    if (!booking) throw new HttpError(404, 'Booking not found');

    const [profile] = await db.select().from(professionalProfiles).where(eq(professionalProfiles.id, booking.professionalId)).limit(1);
    if (!profile) throw new HttpError(404, 'Professional profile not found');

    const user = req.currentUser!;
    const isClient = booking.clientId === user.id;
    const isProfessionalOwner = profile.userId === user.id;
    const isAdmin = user.role === 'admin';
    if (!isClient && !isProfessionalOwner && !isAdmin) throw new HttpError(403, 'You do not have access to this booking');

    const requested = req.body.status;
    if (!transitions[booking.status].includes(requested)) {
      throw new HttpError(400, `Booking cannot move from ${booking.status} to ${requested}`);
    }
    if (requested === 'cancelled_by_client' && !isClient && !isAdmin) throw new HttpError(403, 'Only the client can cancel this way');
    if (['confirmed', 'declined', 'completed', 'cancelled_by_professional', 'no_show'].includes(requested) && !isProfessionalOwner && !isAdmin) {
      throw new HttpError(403, 'Only the professional can set this status');
    }

    const [updated] = await db.update(bookings).set({
      status: requested,
      professionalNote: req.body.professionalNote,
      cancelledAt: requested.startsWith('cancelled') ? new Date() : booking.cancelledAt,
      completedAt: requested === 'completed' ? new Date() : booking.completedAt,
      updatedAt: new Date(),
    }).where(eq(bookings.id, booking.id)).returning();

    const targetUserId = isClient ? profile.userId : booking.clientId;
    await createNotification({
      userId: targetUserId,
      type: requested === 'confirmed' ? 'booking_confirmed' : requested === 'declined' ? 'booking_declined' : requested === 'completed' ? 'booking_completed' : requested.startsWith('cancelled') ? 'booking_cancelled' : 'system',
      title: 'Booking updated',
      body: `Your booking status is now ${requested.replaceAll('_', ' ')}.`,
      actionUrl: isClient ? '/professional/bookings' : '/client/bookings',
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
});
