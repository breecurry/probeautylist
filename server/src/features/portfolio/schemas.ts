import { z } from 'zod';

const serviceCategories = [
  'Hair Stylist',
  'Nail Artist',
  'Esthetician',
  'Barber',
  'Makeup Artist',
  'Lash Artist',
  'Brow Artist',
  'Massage Therapist',
  'Waxing Specialist',
  'Other Beauty Professional',
] as const;

export const portfolioSchema = z.object({
  imageUrl: z.string().min(1),
  caption: z.string().min(2).max(300).trim(),
  category: z.enum(serviceCategories),
  isVisible: z.boolean().default(true),
});
