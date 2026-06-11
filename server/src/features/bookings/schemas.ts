import { z } from 'zod';

const bookingStatuses = [
  'pending',
  'confirmed',
  'declined',
  'cancelled_by_client',
  'cancelled_by_professional',
  'completed',
  'no_show',
] as const;

export const createBookingSchema = z.object({
  professionalId: z.string().uuid(),
  serviceId: z.string().uuid(),
  startsAt: z.string().datetime(),
  clientNote: z.string().max(1000).optional(),
});

export const updateBookingStatusSchema = z.object({
  status: z.enum(bookingStatuses),
  professionalNote: z.string().max(1000).optional(),
});
