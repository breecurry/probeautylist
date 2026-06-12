import { eq, sql } from 'drizzle-orm';
import { env } from '../config/env.js';
import { db, pool } from '../db/client.js';
import { users } from '../db/schema.js';

if (!env.ADMIN_EMAIL && !env.ADMIN_CLERK_USER_ID) {
  console.error('ADMIN_EMAIL or ADMIN_CLERK_USER_ID is required for this command. Sign in once through Clerk and sync the user before promoting it.');
  process.exit(1);
}

const whereClause = env.ADMIN_CLERK_USER_ID
  ? eq(users.clerkUserId, env.ADMIN_CLERK_USER_ID)
  : sql`lower(${users.email}) = ${env.ADMIN_EMAIL!.toLowerCase()}`;

const [existing] = await db.select().from(users).where(whereClause).limit(1);
if (!existing) {
  console.error('No synced Clerk-backed local user found. Sign in through Clerk first, then run this command with ADMIN_EMAIL or ADMIN_CLERK_USER_ID.');
  await pool.end();
  process.exit(1);
}

await db.update(users).set({ role: 'admin', updatedAt: new Date() }).where(eq(users.id, existing.id));

console.log(`Admin role granted to ${existing.email}.`);
await pool.end();
