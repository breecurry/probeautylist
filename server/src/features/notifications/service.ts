import { db } from '../../db/client.js';
import { notifications, type NewNotification } from '../../db/schema.js';

export async function createNotification(input: NewNotification) {
  const [notification] = await db.insert(notifications).values(input).returning();
  return notification;
}
