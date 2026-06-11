import { z } from 'zod';
import { serviceCategories } from '../../constants/domain.js';

export const savedSearchSchema = z.object({
  name: z.string().trim().min(2).max(80),
  query: z.string().trim().max(120).optional().or(z.literal('')),
  category: z.enum(serviceCategories).optional().or(z.literal('')),
  city: z.string().trim().max(80).optional().or(z.literal('')),
  state: z.string().trim().max(40).optional().or(z.literal('')),
  maxPriceCents: z.coerce.number().int().min(0).max(1000000).optional().nullable(),
  notifyOnNewMatches: z.boolean().default(true),
});
