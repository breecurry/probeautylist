import { z } from 'zod';

import { bookingStatuses } from '../../constants/domain.js';

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
