import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { env } from '../config/env.js';
import * as schema from './schema.js';

const ssl = env.DATABASE_SSL_MODE === 'require'
  ? {
      rejectUnauthorized: env.DATABASE_SSL_REJECT_UNAUTHORIZED,
      ca: env.DATABASE_SSL_CA?.replace(/\\n/g, '\n'),
    }
  : undefined;

export const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
  ssl,
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

export const db = drizzle(pool, { schema });
