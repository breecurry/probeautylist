import { Router } from 'express';
import { and, desc, eq, isNull } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { notifications } from '../../db/schema.js';
import { requireAuth } from '../../middleware/auth.js';
import { HttpError } from '../../utils/http.js';

export const notificationsRouter = Router();

notificationsRouter.get('/', requireAuth, async (req, res, next) => {
  try {
    const rows = await db.select().from(notifications)
      .where(eq(notifications.userId, req.currentUser!.id))
      .orderBy(desc(notifications.createdAt))
      .limit(50);
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

notificationsRouter.get('/unread-count', requireAuth, async (req, res, next) => {
  try {
    const rows = await db.select({ id: notifications.id }).from(notifications)
      .where(and(eq(notifications.userId, req.currentUser!.id), isNull(notifications.readAt)));
    res.json({ count: rows.length });
  } catch (error) {
    next(error);
  }
});

notificationsRouter.patch('/:id/read', requireAuth, async (req, res, next) => {
  try {
    const [updated] = await db.update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.id, req.params.id), eq(notifications.userId, req.currentUser!.id)))
      .returning();
    if (!updated) throw new HttpError(404, 'Notification not found');
    res.json(updated);
  } catch (error) {
    next(error);
  }
});
