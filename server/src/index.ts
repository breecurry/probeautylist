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
import { normalizeError } from './utils/http.js';
import { registerRoutes } from './routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PgSession = connectPgSimple(session);

app.set('trust proxy', isProduction ? 1 : 0);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'same-site' } }));
app.use(cors({ origin: env.APP_ORIGIN, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false }));

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
    maxAge: 1000 * 60 * 60 * 24 * 30,
  },
}));

app.use(attachCurrentUser);
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
