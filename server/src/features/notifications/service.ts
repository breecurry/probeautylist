import { db } from '../../db/client.js';
import { notifications, type NewNotification } from '../../db/schema.js';

type NotificationDatabase = Pick<typeof db, 'insert'>;

export async function createNotification(input: NewNotification, database: NotificationDatabase = db) {
  const [notification] = await database.insert(notifications).values(input).returning();
  return notification;
}
