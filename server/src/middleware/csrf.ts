import crypto from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../utils/http.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function ensureCsrfToken(req: Request) {
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  }
  return req.session.csrfToken;
}

export function csrfProtection(req: Request, _res: Response, next: NextFunction) {
  if (SAFE_METHODS.has(req.method) || req.path === '/api/auth/csrf') {
    return next();
  }

  const expected = req.session.csrfToken;
  const received = req.get('x-csrf-token');
  if (!expected || !received || received !== expected) {
    return next(new HttpError(403, 'Security token is missing or expired. Please refresh and try again.'));
  }

  next();
}
