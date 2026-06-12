import { z } from 'zod';

const optionalPhoneSchema = z.string()
  .trim()
  .max(40)
  .regex(/^$|^[+0-9().\-\s]{7,40}$/, 'Phone must be a valid phone number')
  .optional();

export const appRoleSchema = z.enum(['client', 'professional', 'business', 'admin']);
export const organizationRoleSchema = z.enum(['owner', 'admin', 'member']);

export const syncUserSchema = z.object({
  role: z.enum(['client', 'professional', 'business']).default('client'),
  phone: optionalPhoneSchema,
});

export const accountUpdateSchema = z.object({
  firstName: z.string().min(1).max(80).trim().optional(),
  lastName: z.string().min(1).max(80).trim().optional(),
  phone: optionalPhoneSchema.or(z.literal('')),
  avatarUrl: z.string().url().refine((value) => value.startsWith('https://'), 'Avatar URL must use HTTPS').optional().or(z.literal('')),
}).strict();

export const syncOrganizationSchema = z.object({
  clerkOrgId: z.string().min(1).optional(),
  name: z.string().min(1).max(160).trim().optional(),
  slug: z.string().min(1).max(160).trim().optional().or(z.literal('')),
  imageUrl: z.string().url().optional().or(z.literal('')),
  role: organizationRoleSchema.default('member'),
  clerkMembershipId: z.string().min(1).optional(),
});
