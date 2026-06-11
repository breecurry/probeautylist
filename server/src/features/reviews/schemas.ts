import { z } from 'zod';

const httpsUrlSchema = z.string().url().refine((value) => value.startsWith('https://'), 'Review photo URL must use HTTPS');

export const reviewSchema = z.object({
  bookingId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  cleanlinessRating: z.number().int().min(1).max(5).default(5),
  communicationRating: z.number().int().min(1).max(5).default(5),
  valueRating: z.number().int().min(1).max(5).default(5),
  wouldRecommend: z.boolean().default(true),
  photoUrls: z.array(httpsUrlSchema).max(6).default([]),
  comment: z.string().min(5).max(1200).trim(),
});
