import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { clerkMiddleware } from '@clerk/express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { appOrigins, env, isProduction } from './config/env.js';
import { pool } from './db/client.js';
import { attachCurrentUser } from './middleware/auth.js';
import { normalizeError } from './utils/http.js';
import { registerRoutes } from './routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

app.set('trust proxy', env.TRUST_PROXY);
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      connectSrc: ["'self'", ...appOrigins, 'https://*.clerk.accounts.dev', 'https://api.clerk.com'],
      fontSrc: ["'self'", 'data:'],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      objectSrc: ["'none'"],
      scriptSrc: ["'self'", 'https://*.clerk.accounts.dev'],
      styleSrc: ["'self'", "'unsafe-inline'"],
      upgradeInsecureRequests: isProduction ? [] : null,
    },
  },
  crossOriginResourcePolicy: { policy: 'same-site' },
  referrerPolicy: { policy: 'no-referrer' },
}));
app.use(cors({
  origin(origin, callback) {
    if (!origin || appOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origin is not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '512kb' }));
app.use(express.urlencoded({ extended: false, limit: '64kb' }));
app.use(cookieParser());

app.use((req, res, next) => {
  if (!isProduction) return next();
  const host = req.headers.host?.toLowerCase();
  const canonicalHost = new URL(env.APP_ORIGIN).host.toLowerCase();
  if (host === `www.${canonicalHost}`) {
    return res.redirect(308, `${env.APP_ORIGIN}${req.originalUrl}`);
  }
  return next();
});
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests. Please slow down and try again.' },
}));

app.use(clerkMiddleware());
app.use(attachCurrentUser);
app.use('/uploads', express.static(path.resolve(env.UPLOAD_DIR), {
  fallthrough: false,
  immutable: isProduction,
  maxAge: isProduction ? '7d' : 0,
  setHeaders(res) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
  },
}));
registerRoutes(app);

app.use('/api', (_req, res) => {
  res.status(404).json({ error: { message: 'API route not found' } });
});

if (isProduction) {
  app.use(express.static(path.resolve(__dirname, '../client')));
  app.get('*', (_req, res) => res.sendFile(path.resolve(__dirname, '../client/index.html')));
}

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const normalized = normalizeError(error);
  res.status(normalized.status).json(normalized.body);
});

const server = app.listen(env.PORT, () => {
  console.log(`Pro Beauty List API listening on port ${env.PORT}`);
});

async function shutdown(signal: NodeJS.Signals) {
  console.log(`${signal} received. Shutting down gracefully.`);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
