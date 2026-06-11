import { z } from 'zod';

const beautyCategories = [
  'hair',
  'nails',
  'makeup',
  'skincare',
  'brows-lashes',
  'barbering',
  'massage',
  'waxing',
  'tattoo',
  'other',
] as const;

const httpsUrlSchema = z.string().url().refine((value) => value.startsWith('https://'), 'Image URL must use HTTPS');

export const portfolioSchema = z.object({
  imageUrl: httpsUrlSchema,
  caption: z.string().max(500).optional().or(z.literal('')),
  category: z.enum(beautyCategories).optional(),
  isVisible: z.boolean().default(true),
});
