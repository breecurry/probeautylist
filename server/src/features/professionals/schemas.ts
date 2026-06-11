import { z } from 'zod';

import { serviceCategories } from '../../constants/domain.js';

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
  profileImageUrl: z.string().url().refine((value) => value.startsWith('https://'), 'Profile image URL must use HTTPS').optional().or(z.literal('')),
  coverImageUrl: z.string().url().refine((value) => value.startsWith('https://'), 'Cover image URL must use HTTPS').optional().or(z.literal('')),
  instagramUrl: z.string().url().refine((value) => value.startsWith('https://'), 'Instagram URL must use HTTPS').optional().or(z.literal('')),
  websiteUrl: z.string().url().refine((value) => value.startsWith('https://'), 'Website URL must use HTTPS').optional().or(z.literal('')),
  licenseLabel: z.string().max(140).optional(),
});

export const professionalSearchSchema = z.object({
  q: z.string().trim().max(120).optional(),
  category: z.string().trim().max(80).optional(),
  city: z.string().trim().max(100).optional(),
  state: z.string().trim().max(80).optional(),
});
