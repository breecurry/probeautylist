import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DATABASE_SSL_MODE: z.enum(['disable', 'require']).default(process.env.NODE_ENV === 'production' ? 'require' : 'disable'),
  DATABASE_SSL_REJECT_UNAUTHORIZED: z.coerce.boolean().default(true),
  DATABASE_SSL_CA: z.string().optional(),
  SESSION_SECRET: z.string().min(64, 'SESSION_SECRET must be at least 64 characters'),
  APP_ORIGIN: z.string().url().default('http://localhost:5173'),
  TRUST_PROXY: z.coerce.number().int().min(0).max(5).default(process.env.NODE_ENV === 'production' ? 1 : 0),
  UPLOAD_DIR: z.string().default('uploads'),
  MAX_UPLOAD_MB: z.coerce.number().int().positive().max(10).default(5),
  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_PASSWORD: z.string().min(12).optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export const isProduction = env.NODE_ENV === 'production';
