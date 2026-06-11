import { Router } from 'express';
import { and, desc, eq, gt, inArray, lt, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../db/client.js';
import {
  availabilityExceptions,
  availabilityRules,
  bookingPayments,
  bookingPolicies,
  bookingReminders,
  bookingRescheduleRequests,
  bookings,
  professionalProfiles,
  services,
  users,
} from '../../db/schema.js';
import { requireAuth } from '../../middleware/auth.js';
import { validateBody, validateQuery } from '../../middleware/validate.js';
import { HttpError, sendCreated } from '../../utils/http.js';
import { createNotification } from '../notifications/service.js';
import { createBookingSchema, createRescheduleRequestSchema, updateBookingStatusSchema, updateRescheduleRequestSchema } from './schemas.js';

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
const cancellableStatuses = ['pending', 'confirmed'] as const;

const bookingListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

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

function reminderTimeFor(startsAt: Date, hoursBefore: number) {
  const scheduledFor = new Date(startsAt.getTime() - hoursBefore * 60 * 60_000);
  return scheduledFor.getTime() > Date.now() ? scheduledFor : null;
}

function paymentStatusForDeposit(depositCents: number, depositRequired: boolean) {
  return depositRequired && depositCents > 0 ? 'deposit_due' : 'not_required';
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

async function assertRequestedTimeAvailable(professionalId: string, startsAt: Date, endsAt: Date) {
  if (startsAt.getTime() <= Date.now()) throw new HttpError(400, 'Booking requests must be for a future date and time');
  const available = await isWithinWorkingHours(professionalId, startsAt, endsAt);
  if (!available) throw new HttpError(409, 'Requested time is outside this professional’s working hours');
  const blocked = await isBlockedByException(professionalId, startsAt, endsAt);
  if (blocked) throw new HttpError(409, 'Requested time is blocked by this professional’s availability exceptions');
}

async function enrichBookings(rows: Array<typeof bookings.$inferSelect>) {
  if (rows.length === 0) return [];

  const serviceIds = [...new Set(rows.map((booking) => booking.serviceId))];
  const professionalIds = [...new Set(rows.map((booking) => booking.professionalId))];
  const clientIds = [...new Set(rows.map((booking) => booking.clientId))];
  const bookingIds = rows.map((booking) => booking.id);

  const [serviceRows, profileRows, clientRows, paymentRows, rescheduleRows] = await Promise.all([
    db.select({
      id: services.id,
      name: services.name,
      category: services.category,
      durationMinutes: services.durationMinutes,
      priceCents: services.priceCents,
      depositCents: services.depositCents,
    }).from(services).where(inArray(services.id, serviceIds)),
    db.select({
      id: professionalProfiles.id,
      displayName: professionalProfiles.displayName,
      slug: professionalProfiles.slug,
      city: professionalProfiles.city,
      state: professionalProfiles.state,
    }).from(professionalProfiles).where(inArray(professionalProfiles.id, professionalIds)),
    db.select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
    }).from(users).where(inArray(users.id, clientIds)),
    db.select().from(bookingPayments).where(inArray(bookingPayments.bookingId, bookingIds)),
    db.select().from(bookingRescheduleRequests).where(and(
      inArray(bookingRescheduleRequests.bookingId, bookingIds),
      eq(bookingRescheduleRequests.status, 'pending'),
    )),
  ]);

  const servicesById = new Map(serviceRows.map((service) => [service.id, service]));
  const profilesById = new Map(profileRows.map((profile) => [profile.id, profile]));
  const clientsById = new Map(clientRows.map((client) => [client.id, client]));
  const paymentsByBookingId = new Map(paymentRows.map((payment) => [payment.bookingId, payment]));
  const pendingReschedulesByBookingId = new Map(rescheduleRows.map((request) => [request.bookingId, request]));

  return rows.map((booking) => {
    const service = servicesById.get(booking.serviceId);
    const profile = profilesById.get(booking.professionalId);
    const client = clientsById.get(booking.clientId);

    return {
      ...booking,
      payment: paymentsByBookingId.get(booking.id) ?? null,
      pendingRescheduleRequest: pendingReschedulesByBookingId.get(booking.id) ?? null,
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
  });
}

async function enrichBooking(booking: typeof bookings.$inferSelect) {
  const [enriched] = await enrichBookings([booking]);
  return enriched;
}

bookingsRouter.get('/', requireAuth, validateQuery(bookingListQuerySchema), async (req, res, next) => {
  try {
    const user = req.currentUser!;
    const { limit } = req.query as unknown as z.infer<typeof bookingListQuerySchema>;
    if (user.role === 'professional') {
      const [profile] = await db.select({ id: professionalProfiles.id }).from(professionalProfiles).where(eq(professionalProfiles.userId, user.id)).limit(1);
      if (!profile) return res.json([]);
      const rows = await db.select().from(bookings).where(eq(bookings.professionalId, profile.id)).orderBy(desc(bookings.startsAt)).limit(limit);
      return res.json(await enrichBookings(rows));
    }

    const rows = await db.select().from(bookings).where(eq(bookings.clientId, user.id)).orderBy(desc(bookings.startsAt)).limit(limit);
    res.json(await enrichBookings(rows));
  } catch (error) {
    next(error);
  }
});

bookingsRouter.get('/policies/:professionalId', async (req, res, next) => {
  try {
    const [profile] = await db.select({ id: professionalProfiles.id }).from(professionalProfiles).where(and(
      eq(professionalProfiles.id, req.params.professionalId),
      eq(professionalProfiles.status, 'approved'),
      eq(professionalProfiles.isVisible, true),
    )).limit(1);
    if (!profile) throw new HttpError(404, 'Professional not available for booking');

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

bookingsRouter.post('/', requireAuth, validateBody(createBookingSchema), async (req, res, next) => {
  try {
    if (req.currentUser!.role !== 'client') throw new HttpError(403, 'Only client accounts can request bookings');
    const [service] = await db.select({ id: services.id, name: services.name, durationMinutes: services.durationMinutes, priceCents: services.priceCents, depositCents: services.depositCents }).from(services).where(and(eq(services.id, req.body.serviceId), eq(services.professionalId, req.body.professionalId), eq(services.isActive, true))).limit(1);
    if (!service) throw new HttpError(404, 'Service not found');

    const [profile] = await db.select({ id: professionalProfiles.id, userId: professionalProfiles.userId }).from(professionalProfiles).where(and(eq(professionalProfiles.id, req.body.professionalId), eq(professionalProfiles.status, 'approved'), eq(professionalProfiles.isVisible, true))).limit(1);
    if (!profile) throw new HttpError(404, 'Professional not available for booking');

    const [policy] = await db.select().from(bookingPolicies).where(eq(bookingPolicies.professionalId, profile.id)).limit(1);
    const effectivePolicy = policy ?? {
      depositRequired: true,
      remindersEnabled: true,
      reminderHoursBefore: 24,
    };

    const startsAt = new Date(req.body.startsAt);
    if (Number.isNaN(startsAt.getTime())) throw new HttpError(400, 'Booking start time is invalid');
    const endsAt = new Date(startsAt.getTime() + service.durationMinutes * 60_000);
    await assertRequestedTimeAvailable(profile.id, startsAt, endsAt);

    const created = await db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${profile.id}))`);
      const [conflict] = await tx.select({ id: bookings.id }).from(bookings).where(and(
        eq(bookings.professionalId, profile.id),
        inArray(bookings.status, activeBookingStatuses),
        lt(bookings.startsAt, endsAt),
        gt(bookings.endsAt, startsAt),
      )).limit(1);
      if (conflict) throw new HttpError(409, 'That time is already requested or booked');

      const paymentStatus = paymentStatusForDeposit(service.depositCents, effectivePolicy.depositRequired);
      const [createdBooking] = await tx.insert(bookings).values({
        clientId: req.currentUser!.id,
        professionalId: profile.id,
        serviceId: service.id,
        startsAt,
        endsAt,
        priceCents: service.priceCents,
        depositCents: service.depositCents,
        paymentStatus,
        policyAcceptedAt: new Date(),
        reminderOptIn: req.body.reminderOptIn,
        clientNote: req.body.clientNote,
      }).returning();

      if (paymentStatus === 'deposit_due') {
        await tx.insert(bookingPayments).values({
          bookingId: createdBooking.id,
          status: 'deposit_due',
          amountCents: service.depositCents,
        });
        await createNotification({
          userId: req.currentUser!.id,
          type: 'payment_required',
          title: 'Deposit required',
          body: `A ${Math.round(service.depositCents / 100)} USD deposit is required to hold ${service.name}.`,
          actionUrl: '/client/bookings',
        }, tx);
      }

      const scheduledFor = req.body.reminderOptIn && effectivePolicy.remindersEnabled ? reminderTimeFor(startsAt, effectivePolicy.reminderHoursBefore) : null;
      if (scheduledFor) {
        await tx.insert(bookingReminders).values([
          { bookingId: createdBooking.id, userId: req.currentUser!.id, scheduledFor },
          { bookingId: createdBooking.id, userId: profile.userId, scheduledFor },
        ]).onConflictDoNothing();
      }

      await createNotification({
        userId: profile.userId,
        type: 'booking_requested',
        title: 'New booking request',
        body: `${req.currentUser!.firstName} requested ${service.name}.`,
        actionUrl: '/professional/bookings',
      }, tx);

      return createdBooking;
    });

    sendCreated(res, await enrichBooking(created));
  } catch (error) {
    next(error);
  }
});

bookingsRouter.post('/:id/reschedule-requests', requireAuth, validateBody(createRescheduleRequestSchema), async (req, res, next) => {
  try {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, req.params.id)).limit(1);
    if (!booking) throw new HttpError(404, 'Booking not found');
    if (!cancellableStatuses.includes(booking.status as typeof cancellableStatuses[number])) throw new HttpError(400, 'Only active bookings can be rescheduled');

    const [profile] = await db.select({ userId: professionalProfiles.userId }).from(professionalProfiles).where(eq(professionalProfiles.id, booking.professionalId)).limit(1);
    if (!profile) throw new HttpError(404, 'Professional profile not found');

    const user = req.currentUser!;
    const isParticipant = booking.clientId === user.id || profile.userId === user.id || user.role === 'admin';
    if (!isParticipant) throw new HttpError(403, 'You do not have access to this booking');

    const proposedStartsAt = new Date(req.body.proposedStartsAt);
    if (Number.isNaN(proposedStartsAt.getTime())) throw new HttpError(400, 'Proposed start time is invalid');
    const proposedEndsAt = new Date(proposedStartsAt.getTime() + (booking.endsAt.getTime() - booking.startsAt.getTime()));
    await assertRequestedTimeAvailable(booking.professionalId, proposedStartsAt, proposedEndsAt);

    const created = await db.transaction(async (tx) => {
      const [existing] = await tx.select({ id: bookingRescheduleRequests.id }).from(bookingRescheduleRequests).where(and(
        eq(bookingRescheduleRequests.bookingId, booking.id),
        eq(bookingRescheduleRequests.status, 'pending'),
      )).limit(1);
      if (existing) throw new HttpError(409, 'This booking already has a pending reschedule request');

      const [request] = await tx.insert(bookingRescheduleRequests).values({
        bookingId: booking.id,
        requestedById: user.id,
        proposedStartsAt,
        proposedEndsAt,
        note: req.body.note,
      }).returning();

      await createNotification({
        userId: booking.clientId === user.id ? profile.userId : booking.clientId,
        type: 'booking_reschedule_requested',
        title: 'Reschedule requested',
        body: 'A new appointment time has been proposed.',
        actionUrl: booking.clientId === user.id ? '/professional/bookings' : '/client/bookings',
      }, tx);

      return request;
    });

    sendCreated(res, created);
  } catch (error) {
    next(error);
  }
});

bookingsRouter.patch('/:id/reschedule-requests/:requestId', requireAuth, validateBody(updateRescheduleRequestSchema), async (req, res, next) => {
  try {
    const [request] = await db.select().from(bookingRescheduleRequests).where(and(
      eq(bookingRescheduleRequests.id, req.params.requestId),
      eq(bookingRescheduleRequests.bookingId, req.params.id),
    )).limit(1);
    if (!request) throw new HttpError(404, 'Reschedule request not found');
    if (request.status !== 'pending') throw new HttpError(409, 'Reschedule request is no longer pending');

    const [booking] = await db.select().from(bookings).where(eq(bookings.id, request.bookingId)).limit(1);
    if (!booking) throw new HttpError(404, 'Booking not found');
    const [profile] = await db.select({ userId: professionalProfiles.userId }).from(professionalProfiles).where(eq(professionalProfiles.id, booking.professionalId)).limit(1);
    if (!profile) throw new HttpError(404, 'Professional profile not found');

    const user = req.currentUser!;
    const isClient = booking.clientId === user.id;
    const isProfessionalOwner = profile.userId === user.id;
    if (!isClient && !isProfessionalOwner && user.role !== 'admin') throw new HttpError(403, 'You do not have access to this booking');
    if (request.requestedById === user.id && user.role !== 'admin' && req.body.status !== 'cancelled') throw new HttpError(403, 'The other party must accept or decline this request');

    const updatedRequest = await db.transaction(async (tx) => {
      const [updated] = await tx.update(bookingRescheduleRequests).set({
        status: req.body.status,
        respondedAt: new Date(),
        updatedAt: new Date(),
      }).where(and(eq(bookingRescheduleRequests.id, request.id), eq(bookingRescheduleRequests.status, 'pending'))).returning();
      if (!updated) throw new HttpError(409, 'Reschedule request changed. Refresh and try again.');

      if (req.body.status === 'accepted') {
        await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${booking.professionalId}))`);
        const [conflict] = await tx.select({ id: bookings.id }).from(bookings).where(and(
          eq(bookings.professionalId, booking.professionalId),
          inArray(bookings.status, activeBookingStatuses),
          lt(bookings.startsAt, request.proposedEndsAt),
          gt(bookings.endsAt, request.proposedStartsAt),
          sql`${bookings.id} <> ${booking.id}`,
        )).limit(1);
        if (conflict) throw new HttpError(409, 'The proposed time is no longer available');

        await tx.update(bookings).set({
          startsAt: request.proposedStartsAt,
          endsAt: request.proposedEndsAt,
          updatedAt: new Date(),
        }).where(eq(bookings.id, booking.id));
      }

      await createNotification({
        userId: request.requestedById,
        type: req.body.status === 'accepted' ? 'booking_reschedule_accepted' : req.body.status === 'declined' ? 'booking_reschedule_declined' : 'system',
        title: 'Reschedule request updated',
        body: `The reschedule request was ${req.body.status}.`,
        actionUrl: request.requestedById === booking.clientId ? '/client/bookings' : '/professional/bookings',
      }, tx);

      return updated;
    });

    res.json(updatedRequest);
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

    const targetUserId = isClient ? profile.userId : booking.clientId;
    const updated = await db.transaction(async (tx) => {
      const [updatedBooking] = await tx.update(bookings).set({
        status: requested,
        ...(req.body.professionalNote !== undefined ? { professionalNote: req.body.professionalNote } : {}),
        ...(req.body.cancellationReason !== undefined ? { cancellationReason: req.body.cancellationReason } : {}),
        cancelledAt: requested.startsWith('cancelled') ? new Date() : booking.cancelledAt,
        completedAt: requested === 'completed' ? new Date() : booking.completedAt,
        updatedAt: new Date(),
      }).where(and(eq(bookings.id, booking.id), eq(bookings.status, booking.status))).returning();
      if (!updatedBooking) throw new HttpError(409, 'Booking status changed. Refresh and try again.');

      if (requested.startsWith('cancelled')) {
        await tx.update(bookingReminders).set({ status: 'cancelled', updatedAt: new Date() }).where(and(
          eq(bookingReminders.bookingId, booking.id),
          eq(bookingReminders.status, 'scheduled'),
        ));
      }

      await createNotification({
        userId: targetUserId,
        type: requested === 'confirmed' ? 'booking_confirmed' : requested === 'declined' ? 'booking_declined' : requested === 'completed' ? 'booking_completed' : requested.startsWith('cancelled') ? 'booking_cancelled' : 'system',
        title: 'Booking updated',
        body: `Your booking status is now ${requested.replaceAll('_', ' ')}.`,
        actionUrl: isClient ? '/professional/bookings' : '/client/bookings',
      }, tx);

      return updatedBooking;
    });

    res.json(await enrichBooking(updated));
  } catch (error) {
    next(error);
  }
});
