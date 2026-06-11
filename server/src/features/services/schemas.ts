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

export const serviceSchema = z.object({
  name: z.string().min(2).max(120).trim(),
  description: z.string().min(5).max(1000).trim(),
  category: z.enum(serviceCategories),
  durationMinutes: z.number().int().min(15).max(480),
  priceCents: z.number().int().min(0).max(500000),
  depositCents: z.number().int().min(0).max(500000).default(0),
  isActive: z.boolean().default(true),
});
