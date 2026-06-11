import { Router } from 'express';
import { and, count, desc, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../db/client.js';
import { notifications } from '../../db/schema.js';
import { requireAuth } from '../../middleware/auth.js';
import { validateQuery } from '../../middleware/validate.js';
import { HttpError } from '../../utils/http.js';

export const notificationsRouter = Router();

const notificationsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

notificationsRouter.get('/', requireAuth, validateQuery(notificationsQuerySchema), async (req, res, next) => {
  try {
    const { limit } = req.query as unknown as z.infer<typeof notificationsQuerySchema>;
    const rows = await db.select().from(notifications)
      .where(eq(notifications.userId, req.currentUser!.id))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

notificationsRouter.get('/unread-count', requireAuth, async (req, res, next) => {
  try {
    const [unread] = await db.select({ value: count() }).from(notifications)
      .where(and(eq(notifications.userId, req.currentUser!.id), isNull(notifications.readAt)));
    res.json({ count: unread?.value ?? 0 });
  } catch (error) {
    next(error);
  }
});

notificationsRouter.patch('/read-all', requireAuth, async (req, res, next) => {
  try {
    const [unread] = await db.select({ value: count() }).from(notifications)
      .where(and(eq(notifications.userId, req.currentUser!.id), isNull(notifications.readAt)));

    await db.update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.userId, req.currentUser!.id), isNull(notifications.readAt)));

    res.json({ count: unread?.value ?? 0 });
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
