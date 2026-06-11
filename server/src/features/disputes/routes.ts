import { Router } from 'express';
import { desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../db/client.js';
import { bookingDisputes, bookings, professionalProfiles, services, users } from '../../db/schema.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import { HttpError, sendCreated } from '../../utils/http.js';
import { createNotification } from '../notifications/service.js';
import { createDisputeSchema, updateDisputeSchema } from './schemas.js';

export const disputesRouter = Router();

async function professionalOwnerId(professionalId: string) {
  const [profile] = await db.select({ userId: professionalProfiles.userId }).from(professionalProfiles).where(eq(professionalProfiles.id, professionalId)).limit(1);
  return profile?.userId ?? null;
}

async function assertBookingParticipant(bookingId: string, userId: string, role: string) {
  const [booking] = await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1);
  if (!booking) throw new HttpError(404, 'Booking not found');
  if (role === 'admin') return booking;
  if (booking.clientId === userId) return booking;
  const ownerId = await professionalOwnerId(booking.professionalId);
  if (ownerId === userId) return booking;
  throw new HttpError(403, 'You do not have access to this booking');
}

async function enrichDisputes(rows: Array<typeof bookingDisputes.$inferSelect>) {
  if (rows.length === 0) return [];
  return Promise.all(rows.map(async (dispute) => {
    const [booking, opener, resolver] = await Promise.all([
      db.select({
        id: bookings.id,
        startsAt: bookings.startsAt,
        status: bookings.status,
        serviceName: services.name,
        clientFirstName: users.firstName,
        clientLastName: users.lastName,
        professionalName: professionalProfiles.displayName,
      }).from(bookings)
        .innerJoin(services, eq(services.id, bookings.serviceId))
        .innerJoin(users, eq(users.id, bookings.clientId))
        .innerJoin(professionalProfiles, eq(professionalProfiles.id, bookings.professionalId))
        .where(eq(bookings.id, dispute.bookingId)).limit(1),
      db.select({ firstName: users.firstName, lastName: users.lastName }).from(users).where(eq(users.id, dispute.openedById)).limit(1),
      dispute.resolvedById ? db.select({ firstName: users.firstName, lastName: users.lastName }).from(users).where(eq(users.id, dispute.resolvedById)).limit(1) : Promise.resolve([]),
    ]);
    const bookingRow = booking[0];
    const openerRow = opener[0];
    const resolverRow = resolver[0];
    return {
      ...dispute,
      booking: bookingRow ? {
        id: bookingRow.id,
        startsAt: bookingRow.startsAt,
        status: bookingRow.status,
        serviceName: bookingRow.serviceName,
        clientName: `${bookingRow.clientFirstName} ${bookingRow.clientLastName}`.trim(),
        professionalName: bookingRow.professionalName,
      } : null,
      openedByName: openerRow ? `${openerRow.firstName} ${openerRow.lastName}`.trim() : null,
      resolvedByName: resolverRow ? `${resolverRow.firstName} ${resolverRow.lastName}`.trim() : null,
    };
  }));
}

disputesRouter.get('/', requireAuth, async (req, res, next) => {
  try {
    const user = req.currentUser!;
    if (user.role === 'admin') {
      const rows = await db.select().from(bookingDisputes).orderBy(desc(bookingDisputes.createdAt)).limit(100);
      res.json(await enrichDisputes(rows));
      return;
    }
    if (user.role === 'professional') {
      const [profile] = await db.select({ id: professionalProfiles.id }).from(professionalProfiles).where(eq(professionalProfiles.userId, user.id)).limit(1);
      if (!profile) return res.json([]);
      const rows = await db.select().from(bookingDisputes).where(eq(bookingDisputes.professionalId, profile.id)).orderBy(desc(bookingDisputes.createdAt)).limit(50);
      res.json(await enrichDisputes(rows));
      return;
    }
    const rows = await db.select().from(bookingDisputes).where(eq(bookingDisputes.clientId, user.id)).orderBy(desc(bookingDisputes.createdAt)).limit(50);
    res.json(await enrichDisputes(rows));
  } catch (error) {
    next(error);
  }
});

disputesRouter.post('/', requireRole('client', 'professional', 'admin'), validateBody(createDisputeSchema), async (req, res, next) => {
  try {
    const input = req.body as z.infer<typeof createDisputeSchema>;
    const user = req.currentUser!;
    const booking = await assertBookingParticipant(input.bookingId, user.id, user.role);
    const professionalUserId = await professionalOwnerId(booking.professionalId);
    const [created] = await db.transaction(async (tx) => {
      const [row] = await tx.insert(bookingDisputes).values({
        bookingId: booking.id,
        clientId: booking.clientId,
        professionalId: booking.professionalId,
        openedById: user.id,
        reason: input.reason,
        details: input.details,
      }).returning();
      await createNotification({
        userId: booking.clientId === user.id ? professionalUserId ?? booking.clientId : booking.clientId,
        type: 'dispute_opened',
        title: 'A booking dispute was opened',
        body: input.reason,
        actionUrl: '/notifications',
      }, tx);
      return [row];
    });
    sendCreated(res, (await enrichDisputes([created]))[0]);
  } catch (error) {
    next(error);
  }
});

disputesRouter.patch('/:id', requireRole('admin'), validateBody(updateDisputeSchema), async (req, res, next) => {
  try {
    const input = req.body as z.infer<typeof updateDisputeSchema>;
    const [updated] = await db.transaction(async (tx) => {
      const [row] = await tx.update(bookingDisputes).set({
        status: input.status,
        resolutionNote: input.resolutionNote || null,
        resolvedById: ['resolved', 'dismissed'].includes(input.status) ? req.currentUser!.id : null,
        resolvedAt: ['resolved', 'dismissed'].includes(input.status) ? new Date() : null,
        updatedAt: new Date(),
      }).where(eq(bookingDisputes.id, req.params.id)).returning();
      if (!row) throw new HttpError(404, 'Dispute not found');
      await createNotification({
        userId: row.clientId,
        type: 'dispute_updated',
        title: 'Your booking dispute was updated',
        body: input.resolutionNote || `Status changed to ${input.status.replaceAll('_', ' ')}`,
        actionUrl: '/client/bookings',
      }, tx);
      const ownerId = await professionalOwnerId(row.professionalId);
      if (ownerId) {
        await createNotification({
          userId: ownerId,
          type: 'dispute_updated',
          title: 'A booking dispute was updated',
          body: input.resolutionNote || `Status changed to ${input.status.replaceAll('_', ' ')}`,
          actionUrl: '/professional/bookings',
        }, tx);
      }
      return [row];
    });
    res.json((await enrichDisputes([updated]))[0]);
  } catch (error) {
    next(error);
  }
});
