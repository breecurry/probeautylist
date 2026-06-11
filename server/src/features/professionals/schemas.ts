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

export const professionalProfileSchema = z.object({
  displayName: z.string().min(2).max(120).trim(),
  headline: z.string().min(4).max(160).trim(),
  bio: z.string().min(20).max(2000).trim(),
  category: z.enum(serviceCategories),
  specialties: z.array(z.string().min(1).max(60)).max(12).default([]),
  city: z.string().min(2).max(100).trim(),
  state: z.string().min(2).max(80).trim(),
  addressLine1: z.string().max(160).optional(),
  postalCode: z.string().max(20).optional(),
  profileImageUrl: z.string().url().optional().or(z.literal('')),
  coverImageUrl: z.string().url().optional().or(z.literal('')),
  instagramUrl: z.string().url().optional().or(z.literal('')),
  websiteUrl: z.string().url().optional().or(z.literal('')),
  licenseLabel: z.string().max(140).optional(),
});

export const professionalSearchSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
});
