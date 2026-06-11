import type { Express } from 'express';
import { adminRouter } from './features/admin/routes.js';
import { availabilityRouter } from './features/availability/routes.js';
import { authRouter } from './features/auth/routes.js';
import { bookingsRouter } from './features/bookings/routes.js';
import { notificationsRouter } from './features/notifications/routes.js';
import { portfolioRouter } from './features/portfolio/routes.js';
import { professionalsRouter } from './features/professionals/routes.js';
import { reviewsRouter } from './features/reviews/routes.js';
import { servicesRouter } from './features/services/routes.js';

export function registerRoutes(app: Express) {
  app.get('/api/health', (_req, res) => res.json({ ok: true }));
  app.use('/api/auth', authRouter);
  app.use('/api/availability', availabilityRouter);
  app.use('/api/professionals', professionalsRouter);
  app.use('/api/services', servicesRouter);
  app.use('/api/bookings', bookingsRouter);
  app.use('/api/reviews', reviewsRouter);
  app.use('/api/portfolio', portfolioRouter);
  app.use('/api/notifications', notificationsRouter);
  app.use('/api/admin', adminRouter);
}
