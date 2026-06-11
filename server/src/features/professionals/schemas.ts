import { z } from 'zod';

import { calendarConnectionStatuses, serviceCategories } from '../../constants/domain.js';

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


export const bookingPolicySchema = z.object({
  cancellationWindowHours: z.coerce.number().int().min(0).max(720),
  cancellationFeeCents: z.coerce.number().int().min(0).max(100000),
  depositRequired: z.boolean(),
  remindersEnabled: z.boolean(),
  reminderHoursBefore: z.coerce.number().int().min(1).max(336),
  policySummary: z.string().trim().min(20).max(1000),
});

export const calendarConnectionSchema = z.object({
  provider: z.string().trim().min(2).max(60),
  externalCalendarId: z.string().trim().max(240).optional(),
  status: z.enum(calendarConnectionStatuses),
  syncDirection: z.enum(['export_only', 'import_only', 'two_way']).default('export_only'),
  notes: z.string().trim().max(1000).optional(),
});
