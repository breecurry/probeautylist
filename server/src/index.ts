import path from 'node:path';
import { fileURLToPath } from 'node:url';
import connectPgSimple from 'connect-pg-simple';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import helmet from 'helmet';
import { env, isProduction } from './config/env.js';
import { pool } from './db/client.js';
import { attachCurrentUser } from './middleware/auth.js';
import { csrfProtection } from './middleware/csrf.js';
import { normalizeError } from './utils/http.js';
import { registerRoutes } from './routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PgSession = connectPgSimple(session);

app.set('trust proxy', env.TRUST_PROXY);
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      connectSrc: ["'self'", env.APP_ORIGIN],
      fontSrc: ["'self'", 'data:'],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      objectSrc: ["'none'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      upgradeInsecureRequests: isProduction ? [] : null,
    },
  },
  crossOriginResourcePolicy: { policy: 'same-site' },
  referrerPolicy: { policy: 'no-referrer' },
}));
app.use(cors({ origin: env.APP_ORIGIN, credentials: true, methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'], allowedHeaders: ['Content-Type', 'X-CSRF-Token'] }));
app.use(express.json({ limit: '512kb' }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests. Please slow down and try again.' },
}));

app.use(session({
  name: 'pbl.sid',
  store: new PgSession({ pool, createTableIfMissing: true }),
  secret: env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
}));

app.use(attachCurrentUser);
app.use(csrfProtection);
app.use('/uploads', express.static(path.resolve(env.UPLOAD_DIR), { fallthrough: false, maxAge: isProduction ? '7d' : 0 }));
registerRoutes(app);

if (isProduction) {
  app.use(express.static(path.resolve(__dirname, '../client')));
  app.get('*', (_req, res) => res.sendFile(path.resolve(__dirname, '../client/index.html')));
}

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const normalized = normalizeError(error);
  res.status(normalized.status).json(normalized.body);
});

app.listen(env.PORT, () => {
  console.log(`Pro Beauty List API listening on port ${env.PORT}`);
});
