import { Router } from 'express';
import { and, desc, eq, gt, inArray, lt } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { availabilityExceptions, availabilityRules, bookings, professionalProfiles, services, users } from '../../db/schema.js';
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

function dateKey(value: Date) {
  return value.toISOString().slice(0, 10);
}

async function isWithinWorkingHours(professionalId: string, startsAt: Date, endsAt: Date) {
  const weekday = startsAt.getDay();
  const rules = await db.select({ startTime: availabilityRules.startTime, endTime: availabilityRules.endTime }).from(availabilityRules).where(and(
    eq(availabilityRules.professionalId, professionalId),
    eq(availabilityRules.weekday, weekday),
    eq(availabilityRules.isActive, true),
  ));

  if (rules.length === 0) return true;

  const startMinutes = minutesFromDate(startsAt);
  const endMinutes = minutesFromDate(endsAt);
  return rules.some((rule) => startMinutes >= minutesFromTime(rule.startTime) && endMinutes <= minutesFromTime(rule.endTime));
}

async function isBlockedByException(professionalId: string, startsAt: Date, endsAt: Date) {
  const rows = await db.select({ startTime: availabilityExceptions.startTime, endTime: availabilityExceptions.endTime }).from(availabilityExceptions).where(and(
    eq(availabilityExceptions.professionalId, professionalId),
    eq(availabilityExceptions.date, dateKey(startsAt)),
    eq(availabilityExceptions.isBlocked, true),
  ));

  const startMinutes = minutesFromDate(startsAt);
  const endMinutes = minutesFromDate(endsAt);
  return rows.some((exception) => {
    if (!exception.startTime || !exception.endTime) return true;
    return minutesFromTime(exception.startTime) < endMinutes && minutesFromTime(exception.endTime) > startMinutes;
  });
}

async function enrichBooking(booking: typeof bookings.$inferSelect) {
  const [[service], [profile], [client]] = await Promise.all([
    db.select({
      id: services.id,
      name: services.name,
      category: services.category,
      durationMinutes: services.durationMinutes,
      priceCents: services.priceCents,
      depositCents: services.depositCents,
    }).from(services).where(eq(services.id, booking.serviceId)).limit(1),
    db.select({
      id: professionalProfiles.id,
      displayName: professionalProfiles.displayName,
      slug: professionalProfiles.slug,
      city: professionalProfiles.city,
      state: professionalProfiles.state,
    }).from(professionalProfiles).where(eq(professionalProfiles.id, booking.professionalId)).limit(1),
    db.select({ id: users.id, firstName: users.firstName, lastName: users.lastName, email: users.email }).from(users).where(eq(users.id, booking.clientId)).limit(1),
  ]);

  return {
    ...booking,
    service: service ? {
      id: service.id,
      name: service.name,
      category: service.category,
      durationMinutes: service.durationMinutes,
      priceCents: service.priceCents,
      depositCents: service.depositCents,
    } : null,
    professional: profile ? {
      id: profile.id,
      displayName: profile.displayName,
      slug: profile.slug,
      city: profile.city,
      state: profile.state,
    } : null,
    client: client ? {
      id: client.id,
      name: `${client.firstName} ${client.lastName}`.trim(),
      email: client.email,
    } : null,
  };
}

bookingsRouter.get('/', requireAuth, async (req, res, next) => {
  try {
    const user = req.currentUser!;
    if (user.role === 'professional') {
      const [profile] = await db.select({ id: professionalProfiles.id }).from(professionalProfiles).where(eq(professionalProfiles.userId, user.id)).limit(1);
      if (!profile) return res.json([]);
      const rows = await db.select().from(bookings).where(eq(bookings.professionalId, profile.id)).orderBy(desc(bookings.startsAt));
      return res.json(await Promise.all(rows.map(enrichBooking)));
    }

    const rows = await db.select().from(bookings).where(eq(bookings.clientId, user.id)).orderBy(desc(bookings.startsAt));
    res.json(await Promise.all(rows.map(enrichBooking)));
  } catch (error) {
    next(error);
  }
});

bookingsRouter.post('/', requireAuth, validateBody(createBookingSchema), async (req, res, next) => {
  try {
    if (req.currentUser!.role !== 'client') throw new HttpError(403, 'Only client accounts can request bookings');
    const [service] = await db.select({ id: services.id, name: services.name, durationMinutes: services.durationMinutes, priceCents: services.priceCents, depositCents: services.depositCents }).from(services).where(and(eq(services.id, req.body.serviceId), eq(services.professionalId, req.body.professionalId), eq(services.isActive, true))).limit(1);
    if (!service) throw new HttpError(404, 'Service not found');

    const [profile] = await db.select({ id: professionalProfiles.id, userId: professionalProfiles.userId }).from(professionalProfiles).where(and(eq(professionalProfiles.id, req.body.professionalId), eq(professionalProfiles.status, 'approved'), eq(professionalProfiles.isVisible, true))).limit(1);
    if (!profile) throw new HttpError(404, 'Professional not available for booking');

    const startsAt = new Date(req.body.startsAt);
    if (Number.isNaN(startsAt.getTime())) throw new HttpError(400, 'Booking start time is invalid');
    if (startsAt.getTime() <= Date.now()) throw new HttpError(400, 'Booking requests must be for a future date and time');

    const endsAt = new Date(startsAt.getTime() + service.durationMinutes * 60_000);
    const available = await isWithinWorkingHours(profile.id, startsAt, endsAt);
    if (!available) throw new HttpError(409, 'Requested time is outside this professional’s working hours');

    const blocked = await isBlockedByException(profile.id, startsAt, endsAt);
    if (blocked) throw new HttpError(409, 'Requested time is blocked by this professional’s availability exceptions');

    const [conflict] = await db.select({ id: bookings.id }).from(bookings).where(and(
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

    sendCreated(res, await enrichBooking(created));
  } catch (error) {
    next(error);
  }
});

bookingsRouter.patch('/:id/status', requireAuth, validateBody(updateBookingStatusSchema), async (req, res, next) => {
  try {
    const [booking] = await db.select({
      id: bookings.id,
      clientId: bookings.clientId,
      professionalId: bookings.professionalId,
      serviceId: bookings.serviceId,
      startsAt: bookings.startsAt,
      endsAt: bookings.endsAt,
      status: bookings.status,
      cancelledAt: bookings.cancelledAt,
      completedAt: bookings.completedAt,
    }).from(bookings).where(eq(bookings.id, req.params.id)).limit(1);
    if (!booking) throw new HttpError(404, 'Booking not found');

    const [profile] = await db.select({ userId: professionalProfiles.userId }).from(professionalProfiles).where(eq(professionalProfiles.id, booking.professionalId)).limit(1);
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

    res.json(await enrichBooking(updated));
  } catch (error) {
    next(error);
  }
});
