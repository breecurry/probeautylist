import argon2 from 'argon2';
import { sql } from 'drizzle-orm';
import { env } from '../config/env.js';
import { db, pool } from '../db/client.js';
import { users } from '../db/schema.js';

if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) {
  console.error('ADMIN_EMAIL and ADMIN_PASSWORD are required for this command.');
  process.exit(1);
}

const existing = await db.select().from(users).where(sql`lower(${users.email}) = ${env.ADMIN_EMAIL.toLowerCase()}`).limit(1);
if (existing.length) {
  console.error('An account with ADMIN_EMAIL already exists.');
  await pool.end();
  process.exit(1);
}

const passwordHash = await argon2.hash(env.ADMIN_PASSWORD, { type: argon2.argon2id });
await db.insert(users).values({
  email: env.ADMIN_EMAIL.toLowerCase(),
  passwordHash,
  firstName: 'Platform',
  lastName: 'Admin',
  role: 'admin',
  emailVerified: true,
});

console.log('Admin account created successfully. Remove ADMIN_PASSWORD from the environment after use.');
await pool.end();
