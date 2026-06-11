import { and, eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { professionalProfiles } from '../db/schema.js';
import { HttpError } from './http.js';

export async function requireVisibleProfile(professionalId: string, message = 'Professional profile not found') {
  const [profile] = await db.select({ id: professionalProfiles.id }).from(professionalProfiles)
    .where(and(
      eq(professionalProfiles.id, professionalId),
      eq(professionalProfiles.status, 'approved'),
      eq(professionalProfiles.isVisible, true),
    ))
    .limit(1);

  if (!profile) throw new HttpError(404, message);
  return profile;
}
