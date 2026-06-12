import type { Express } from 'express';
import { pool } from './db/client.js';
import { adminRouter } from './features/admin/routes.js';
import { availabilityRouter } from './features/availability/routes.js';
import { authRouter } from './features/auth/routes.js';
import { bookingsRouter } from './features/bookings/routes.js';
import { discoveryRouter } from './features/discovery/routes.js';
import { disputesRouter } from './features/disputes/routes.js';
import { favoritesRouter } from './features/favorites/routes.js';
import { messagesRouter } from './features/messages/routes.js';
import { notificationsRouter } from './features/notifications/routes.js';
import { portfolioRouter } from './features/portfolio/routes.js';
import { professionalsRouter } from './features/professionals/routes.js';
import { reviewsRouter } from './features/reviews/routes.js';
import { servicesRouter } from './features/services/routes.js';

export function registerRoutes(app: Express) {
  app.get('/api/health', (_req, res) => res.json({ ok: true }));
  app.get('/api/ready', async (_req, res, next) => {
    try {
      await pool.query('select 1');
      res.json({ ok: true, database: true });
    } catch (error) {
      res.status(503);
      next(error);
    }
  });
  app.use('/api/auth', authRouter);
  app.use('/api/availability', availabilityRouter);
  app.use('/api/professionals', professionalsRouter);
  app.use('/api/services', servicesRouter);
  app.use('/api/bookings', bookingsRouter);
  app.use('/api/reviews', reviewsRouter);
  app.use('/api/portfolio', portfolioRouter);
  app.use('/api/favorites', favoritesRouter);
  app.use('/api/discovery', discoveryRouter);
  app.use('/api/disputes', disputesRouter);
  app.use('/api/messages', messagesRouter);
  app.use('/api/notifications', notificationsRouter);
  app.use('/api/admin', adminRouter);
}
