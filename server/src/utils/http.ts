import type { Response } from 'express';
import { ZodError } from 'zod';

export class HttpError extends Error {
  constructor(public status: number, message: string, public details?: unknown) {
    super(message);
  }
}

export function sendCreated<T>(res: Response, data: T) {
  return res.status(201).json(data);
}

export function normalizeError(error: unknown) {
  if (error instanceof HttpError) {
    return { status: error.status, body: { message: error.message, issues: error.details } };
  }

  if (error instanceof ZodError) {
    return { status: 400, body: { message: 'Validation failed', issues: error.flatten() } };
  }

  console.error(error);
  return { status: 500, body: { message: 'Internal server error' } };
}
