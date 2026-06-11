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
const optionalHttpsUrlSchema = httpsUrlSchema.optional().or(z.literal(''));

export const portfolioSchema = z.object({
  imageUrl: httpsUrlSchema,
  beforeImageUrl: optionalHttpsUrlSchema,
  afterImageUrl: optionalHttpsUrlSchema,
  caption: z.string().max(500).optional().or(z.literal('')),
  category: z.enum(beautyCategories).optional(),
  serviceTags: z.array(z.string().trim().min(1).max(80)).max(12).default([]),
  transformationNotes: z.string().trim().max(1000).optional().or(z.literal('')),
  isVisible: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(10000).default(0),
});

export const portfolioUpdateSchema = portfolioSchema.partial();
