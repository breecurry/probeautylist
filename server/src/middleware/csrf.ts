import type { NextFunction, Request, Response } from 'express';

/**
 * Legacy CSRF compatibility shim.
 *
 * Clerk bearer-token authentication replaced the old cookie/session auth flow, so the
 * server no longer creates or validates session-backed CSRF tokens. These exports are
 * kept temporarily only to avoid breaking any stale imports while the old auth system
 * is being fully removed.
 */
export function ensureCsrfToken(_req: Request) {
  return null;
}

export function csrfProtection(_req: Request, _res: Response, next: NextFunction) {
  next();
}
