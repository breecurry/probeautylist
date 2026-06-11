import { z } from 'zod';

import { bookingStatuses, rescheduleRequestStatuses } from '../../constants/domain.js';

export const createBookingSchema = z.object({
  professionalId: z.string().uuid(),
  serviceId: z.string().uuid(),
  startsAt: z.string().datetime(),
  clientNote: z.string().trim().max(1000).optional(),
  policyAccepted: z.literal(true, { errorMap: () => ({ message: 'Booking policy acceptance is required' }) }),
  reminderOptIn: z.boolean().default(true),
});

export const updateBookingStatusSchema = z.object({
  status: z.enum(bookingStatuses),
  professionalNote: z.string().trim().max(1000).optional(),
  cancellationReason: z.string().trim().max(1000).optional(),
});

export const createRescheduleRequestSchema = z.object({
  proposedStartsAt: z.string().datetime(),
  note: z.string().trim().max(1000).optional(),
});

export const updateRescheduleRequestSchema = z.object({
  status: z.enum(rescheduleRequestStatuses).refine((value) => value === 'accepted' || value === 'declined' || value === 'cancelled', {
    message: 'Reschedule response must be accepted, declined, or cancelled',
  }),
});
