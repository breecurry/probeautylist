import { z } from 'zod';

const passwordSchema = z.string()
  .min(12, 'Password must be at least 12 characters')
  .max(128, 'Password must be 128 characters or fewer')
  .regex(/[a-z]/, 'Password must include a lowercase letter')
  .regex(/[A-Z]/, 'Password must include an uppercase letter')
  .regex(/[0-9]/, 'Password must include a number')
  .regex(/[^A-Za-z0-9]/, 'Password must include a symbol');

const optionalPhoneSchema = z.string()
  .trim()
  .max(40)
  .regex(/^$|^[+0-9().\-\s]{7,40}$/, 'Phone must be a valid phone number')
  .optional();

export const registerSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  password: passwordSchema,
  firstName: z.string().min(1).max(80).trim(),
  lastName: z.string().min(1).max(80).trim(),
  phone: optionalPhoneSchema,
  role: z.enum(['client', 'professional']).default('client'),
});

export const loginSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  password: z.string().min(1).max(128),
});

export const accountUpdateSchema = z.object({
  firstName: z.string().min(1).max(80).trim(),
  lastName: z.string().min(1).max(80).trim(),
  phone: optionalPhoneSchema.or(z.literal('')),
  avatarUrl: z.string().url().refine((value) => value.startsWith('https://'), 'Avatar URL must use HTTPS').optional().or(z.literal('')),
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: passwordSchema,
});
