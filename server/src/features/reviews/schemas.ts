import { z } from 'zod';

export const reviewSchema = z.object({
  bookingId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(5).max(1200).trim(),
});
